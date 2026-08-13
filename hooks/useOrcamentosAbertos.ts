import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  buscarOrigemImportacaoOrcamentosAtual,
  montarSufixoCacheOrigemImportacao
} from '../lib/origemImportacaoOrcamentos';
import { MESES_HISTORICO_ORCAMENTOS } from '../utils/constants';
import {
  CACHE_TTL_CURTO_MS,
  lerCacheSessao,
  salvarCacheSessao
} from '../utils/sessionCache';

export type OrcamentoAbertoResumo = {
  chave: string;
  cliente_id: string | null;
  codigo_cliente: string;
  codigo_cliente_loja: string;
  nome_cliente: string;
  numero_orcamento: string;
  data_emissao: string;
  quantidade_itens: number;
};

type StatusOrcamento = 'A' | 'B' | 'C';

type ClienteRelacionado = {
  id?: string | null;
  empresa?: string | null;
  razao_social?: string | null;
  nome_fantasia?: string | null;
};

type LinhaOrcamentoHistorico = {
  id: string;
  cliente_id: string | null;
  codigo_cliente: string | null;
  codigo_cliente_loja: string | null;
  numero_orcamento: string | null;
  numero_it_completo: string | null;
  data_emissao: string | null;
  status: StatusOrcamento;
  clientes?: ClienteRelacionado | ClienteRelacionado[] | null;
};

type OrcamentoAgrupadoComStatus = OrcamentoAbertoResumo & {
  statusFinal: StatusOrcamento;
};

type EstadoOrcamentosAbertos = {
  orcamentos: OrcamentoAbertoResumo[];
  loading: boolean;
  error: string | null;
};

const estadoInicial: EstadoOrcamentosAbertos = {
  orcamentos: [],
  loading: false,
  error: null
};

const TAMANHO_PAGINA_SUPABASE = 1000;

// Chave atualizada para não reutilizar cache antigo calculado com regra anterior.
// Regra atual:
// 1. Agrupar por codigo_cliente_loja + numero_orcamento.
// 2. Status final vem do status atual importado:
//    A = Aberto
//    B = Fechado
//    C = Cancelado
const CHAVE_CACHE_ORCAMENTOS_ABERTOS =
  'orcamentos-abertos:v8-lote-atual';

function montarChaveCacheOrcamentosAbertos(origemImportacao: string | null) {
  return `${CHAVE_CACHE_ORCAMENTOS_ABERTOS}:${montarSufixoCacheOrigemImportacao(
    origemImportacao
  )}`;
}

function calcularDataLimiteHistoricoOrcamentos() {
  const data = new Date();
  data.setMonth(data.getMonth() - MESES_HISTORICO_ORCAMENTOS);
  return data.toISOString().slice(0, 10);
}

function obterClienteRelacionado(
  clientes?: ClienteRelacionado | ClienteRelacionado[] | null
) {
  if (Array.isArray(clientes)) {
    return clientes[0] || null;
  }

  return clientes || null;
}

function obterNomeCliente(linha: LinhaOrcamentoHistorico) {
  const cliente = obterClienteRelacionado(linha.clientes);

  return (
    cliente?.empresa ||
    cliente?.razao_social ||
    cliente?.nome_fantasia ||
    'Cliente sem nome'
  );
}

function normalizarTexto(valor?: string | null) {
  return String(valor || '').trim();
}

function obterNumeroPrincipal(linha: LinhaOrcamentoHistorico) {
  const numeroOrcamento = normalizarTexto(linha.numero_orcamento);

  if (numeroOrcamento) {
    return numeroOrcamento;
  }

  return normalizarTexto(linha.numero_it_completo).split('-')[0] || '';
}

function obterCodigoCliente(linha: LinhaOrcamentoHistorico) {
  const codigoCliente = normalizarTexto(linha.codigo_cliente);

  if (codigoCliente) {
    return codigoCliente;
  }

  return normalizarTexto(linha.codigo_cliente_loja).split('-')[0] || '';
}

function escolherStatusFinal(
  _statusAtual: StatusOrcamento,
  novoStatus: StatusOrcamento
) {
  // Regra oficial definida:
  // A = Aberto
  // B = Fechado
  // C = Cancelado
  //
  // A cada upload da planilha, o CRM deve considerar o status atual
  // importado para o orçamento agrupado por:
  // codigo_cliente_loja + numero_orcamento.
  //
  // Portanto, não existe mais prioridade B > C > A.
  // O status final passa a ser o status atual recebido/importado.
  return novoStatus;
}

function removerCamposInternos(
  orcamento: OrcamentoAgrupadoComStatus
): OrcamentoAbertoResumo {
  return {
    chave: orcamento.chave,
    cliente_id: orcamento.cliente_id,
    codigo_cliente: orcamento.codigo_cliente,
    codigo_cliente_loja: orcamento.codigo_cliente_loja,
    nome_cliente: orcamento.nome_cliente,
    numero_orcamento: orcamento.numero_orcamento,
    data_emissao: orcamento.data_emissao,
    quantidade_itens: orcamento.quantidade_itens
  };
}

function agruparEFiltrarOrcamentosAbertos(
  linhas: LinhaOrcamentoHistorico[]
): OrcamentoAbertoResumo[] {
  const mapa = new Map<string, OrcamentoAgrupadoComStatus>();

  linhas.forEach((linha) => {
    const codigoClienteLoja = normalizarTexto(linha.codigo_cliente_loja);
    const numeroOrcamento = obterNumeroPrincipal(linha);
    const dataEmissao = normalizarTexto(linha.data_emissao);

    if (!codigoClienteLoja || !numeroOrcamento || !dataEmissao) {
      return;
    }

    const chave = `${codigoClienteLoja}|${numeroOrcamento}`;
    const existente = mapa.get(chave);

    if (!existente) {
      mapa.set(chave, {
        chave,
        cliente_id: linha.cliente_id,
        codigo_cliente: obterCodigoCliente(linha),
        codigo_cliente_loja: codigoClienteLoja,
        nome_cliente: obterNomeCliente(linha),
        numero_orcamento: numeroOrcamento,
        data_emissao: dataEmissao,
        quantidade_itens: 1,
        statusFinal: linha.status
      });
      return;
    }

    mapa.set(chave, {
      ...existente,
      data_emissao:
        dataEmissao > existente.data_emissao
          ? dataEmissao
          : existente.data_emissao,
      quantidade_itens: existente.quantidade_itens + 1,
      statusFinal: escolherStatusFinal(existente.statusFinal, linha.status)
    });
  });

  return Array.from(mapa.values())
    .filter((orcamento) => orcamento.statusFinal === 'A')
    .map(removerCamposInternos)
    .sort((a, b) => {
      const clienteComparacao = a.codigo_cliente_loja.localeCompare(
        b.codigo_cliente_loja,
        'pt-BR',
        {
          numeric: true,
          sensitivity: 'base'
        }
      );

      if (clienteComparacao !== 0) {
        return clienteComparacao;
      }

      return a.numero_orcamento.localeCompare(b.numero_orcamento, 'pt-BR', {
        numeric: true,
        sensitivity: 'base'
      });
    });
}

async function buscarTodasLinhasOrcamentosHistorico(
  dataLimite: string,
  origemImportacao: string | null
) {
  const linhas: LinhaOrcamentoHistorico[] = [];
  let inicio = 0;

  while (true) {
    const fim = inicio + TAMANHO_PAGINA_SUPABASE - 1;

    let query = supabase
      .from('orcamentos_historico')
      .select(
        'id, cliente_id, codigo_cliente, codigo_cliente_loja, numero_orcamento, numero_it_completo, data_emissao, status, clientes(id, empresa, razao_social, nome_fantasia)'
      )
      .in('status', ['A', 'B', 'C'])
      .gte('data_emissao', dataLimite);

    if (origemImportacao) {
      query = query.eq('origem_importacao', origemImportacao);
    }

    const { data, error } = await query
      .order('codigo_cliente_loja', { ascending: true })
      .order('numero_orcamento', { ascending: true })
      .order('numero_it_completo', { ascending: true })
      .range(inicio, fim);

    if (error) {
      throw error;
    }

    const pagina = (data || []) as LinhaOrcamentoHistorico[];
    linhas.push(...pagina);

    if (pagina.length < TAMANHO_PAGINA_SUPABASE) {
      break;
    }

    inicio += TAMANHO_PAGINA_SUPABASE;
  }

  return linhas;
}

async function carregarOrcamentosAbertosDaBase(
  origemImportacao: string | null
) {
  const dataLimite = calcularDataLimiteHistoricoOrcamentos();
  const linhas = await buscarTodasLinhasOrcamentosHistorico(
    dataLimite,
    origemImportacao
  );

  return agruparEFiltrarOrcamentosAbertos(linhas);
}

function obterMensagemErro(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Não foi possível carregar os orçamentos em aberto.';
}

export function useOrcamentosAbertos(refreshKey = 0) {
  const [estado, setEstado] = useState<EstadoOrcamentosAbertos>(estadoInicial);
  const orcamentosRef = useRef<OrcamentoAbertoResumo[]>([]);

  useEffect(() => {
    orcamentosRef.current = estado.orcamentos;
  }, [estado.orcamentos]);

  const recarregar = useCallback(async () => {
    setEstado((estadoAtual) => ({
      ...estadoAtual,
      loading: true,
      error: null
    }));

    try {
      const origemImportacao = await buscarOrigemImportacaoOrcamentosAtual();
      const orcamentos = await carregarOrcamentosAbertosDaBase(
        origemImportacao
      );

      salvarCacheSessao(
        montarChaveCacheOrcamentosAbertos(origemImportacao),
        orcamentos
      );

      orcamentosRef.current = orcamentos;

      setEstado({
        orcamentos,
        loading: false,
        error: null
      });

      return orcamentos;
    } catch (error) {
      const mensagem = obterMensagemErro(error);

      setEstado((estadoAtual) => ({
        ...estadoAtual,
        loading: false,
        error: mensagem
      }));

      return orcamentosRef.current;
    }
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setEstado((estadoAtual) => ({
        ...estadoAtual,
        loading: true,
        error: null
      }));

      try {
        const origemImportacao = await buscarOrigemImportacaoOrcamentosAtual();
        const cacheKey = montarChaveCacheOrcamentosAbertos(origemImportacao);

        if (refreshKey === 0) {
          const cache = lerCacheSessao<OrcamentoAbertoResumo[]>(
            cacheKey,
            CACHE_TTL_CURTO_MS
          );

          if (cache) {
            if (cancelado) {
              return;
            }

            orcamentosRef.current = cache;

            setEstado({
              orcamentos: cache,
              loading: false,
              error: null
            });

            return;
          }
        }

        const orcamentos = await carregarOrcamentosAbertosDaBase(
          origemImportacao
        );

        if (cancelado) {
          return;
        }

        salvarCacheSessao(
          cacheKey,
          orcamentos
        );

        orcamentosRef.current = orcamentos;

        setEstado({
          orcamentos,
          loading: false,
          error: null
        });
      } catch (error) {
        if (cancelado) {
          return;
        }

        setEstado((estadoAtual) => ({
          ...estadoAtual,
          loading: false,
          error: obterMensagemErro(error)
        }));
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, [refreshKey]);

  const obterOrcamentosAtuais = useCallback(() => {
    return orcamentosRef.current;
  }, []);

  return {
    ...estado,
    total: estado.orcamentos.length,
    totalAbertos: estado.orcamentos.length,
    quantidade: estado.orcamentos.length,
    recarregar,
    obterOrcamentosAtuais
  };
}
