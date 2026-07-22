import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  CACHE_TTL_CURTO_MS,
  lerCacheSessao,
  salvarCacheSessao
} from '../utils/sessionCache';

export type StatusFunilOrcamento = 'A' | 'B' | 'C';

export type FunilOrcamentoResumoStatus = {
  status: StatusFunilOrcamento;
  titulo: string;
  descricao: string;
  quantidadeOrcamentos: number;
  quantidadeItens: number;
  quantidadeClientes: number;
  percentual: number;
  valorTotal: number;
  ticketMedio: number;
};

export type FunilOrcamentosResumo = {
  totalOrcamentos: number;
  totalItens: number;
  totalClientes: number;
  valorTotal: number;
  ticketMedio: number;
  periodoDescricao: string;
  status: FunilOrcamentoResumoStatus[];
};

export type FiltrosFunilOrcamentos = {
  area: string;
  periodo: string;
  mes: string;
};

export type OpcoesFunilOrcamentos = {
  areas: string[];
  periodos: string[];
  meses: string[];
};

type LinhaFunilBase = {
  id: string;
  cliente_id: string | null;
  codigo_cliente_loja: string | null;
  numero_orcamento: string | null;
  numero_it_completo: string | null;
  status: StatusFunilOrcamento;
  ramo?: string | null;
  valor_total: number | string | null;
  data_emissao?: string | null;
  data_fechamento?: string | null;
  data_cancelamento?: string | null;
};

type EstadoFunilOrcamentos = {
  resumo: FunilOrcamentosResumo;
  opcoes: OpcoesFunilOrcamentos;
  loading: boolean;
  error: string | null;
};

type CacheFunilOrcamentos = {
  resumo: FunilOrcamentosResumo;
  opcoes: OpcoesFunilOrcamentos;
};

const TAMANHO_PAGINA_SUPABASE = 1000;
const CACHE_TTL_OPCOES_MS = 30 * 60 * 1000;
const FILTRO_TODAS_AREAS = 'todas';
const FILTRO_TODOS_PERIODOS = 'todos';
const FILTRO_TODOS_MESES = 'todos';

const STATUS_CONFIG: Record<
  StatusFunilOrcamento,
  Pick<FunilOrcamentoResumoStatus, 'titulo' | 'descricao'>
> = {
  A: {
    titulo: 'Abertos',
    descricao: 'Status A, filtrado pela data de emissão'
  },
  B: {
    titulo: 'Fechados',
    descricao: 'Status B, filtrado pela data de fechamento'
  },
  C: {
    titulo: 'Cancelados',
    descricao: 'Status C, filtrado pela data de cancelamento'
  }
};

const STATUS_ORDEM: StatusFunilOrcamento[] = ['A', 'B', 'C'];

type CampoDataFunil =
  | 'data_emissao'
  | 'data_fechamento'
  | 'data_cancelamento';

const DATA_REFERENCIA_STATUS: Record<StatusFunilOrcamento, CampoDataFunil> = {
  A: 'data_emissao',
  B: 'data_fechamento',
  C: 'data_cancelamento'
};

const MESES_NOMES: Record<string, string> = {
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Março',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro'
};

const resumoVazio: FunilOrcamentosResumo = {
  totalOrcamentos: 0,
  totalItens: 0,
  totalClientes: 0,
  valorTotal: 0,
  ticketMedio: 0,
  periodoDescricao: '',
  status: STATUS_ORDEM.map((status) => ({
    status,
    titulo: STATUS_CONFIG[status].titulo,
    descricao: STATUS_CONFIG[status].descricao,
    quantidadeOrcamentos: 0,
    quantidadeItens: 0,
    quantidadeClientes: 0,
    percentual: 0,
    valorTotal: 0,
    ticketMedio: 0
  }))
};

const opcoesVazias: OpcoesFunilOrcamentos = {
  areas: [],
  periodos: [],
  meses: Object.keys(MESES_NOMES)
};

function normalizarTexto(valor?: string | null) {
  return String(valor || '').trim();
}

function calcularAnoCorrente() {
  return String(new Date().getFullYear());
}

function montarFiltrosIniciais(isAdmin: boolean): FiltrosFunilOrcamentos {
  return {
    area: FILTRO_TODAS_AREAS,
    periodo: isAdmin ? FILTRO_TODOS_PERIODOS : calcularAnoCorrente(),
    mes: FILTRO_TODOS_MESES
  };
}

function montarPeriodoDescricao() {
  return 'Volume financeiro';
}

function montarChaveCache(isAdmin: boolean, filtros: FiltrosFunilOrcamentos) {
  const alcance = isAdmin ? 'admin-todos' : `vendedor-${calcularAnoCorrente()}`;
  const area = filtros.area || FILTRO_TODAS_AREAS;
  const periodo = filtros.periodo || FILTRO_TODOS_PERIODOS;
  const mes = filtros.mes || FILTRO_TODOS_MESES;

  return `funil-orcamentos:v16-${alcance}:area-${area}:periodo-${periodo}:mes-${mes}`;
}

function montarChaveCacheOpcoes(isAdmin: boolean) {
  const alcance = isAdmin ? 'admin-todos' : `vendedor-${calcularAnoCorrente()}`;

  return `funil-orcamentos:opcoes:v2-${alcance}`;
}

function extrairPartesData(data?: string | null) {
  const valor = normalizarTexto(data);

  if (!valor) {
    return { ano: '', mes: '' };
  }

  const iso = valor.match(/^(\d{4})-(\d{2})-/);

  if (iso) {
    return { ano: iso[1], mes: iso[2] };
  }

  const brasileira = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (brasileira) {
    return {
      ano: brasileira[3],
      mes: brasileira[2].padStart(2, '0')
    };
  }

  const ano = valor.match(/(\d{4})/)?.[1] || '';

  return { ano, mes: '' };
}

function ordenarDecrescente(a: string, b: string) {
  return b.localeCompare(a, 'pt-BR', { numeric: true });
}

function normalizarValorMonetario(valor: number | string | null | undefined) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0;
  }

  const textoValor = normalizarTexto(valor);

  if (!textoValor) {
    return 0;
  }

  const numero = Number(textoValor.replace(/\./g, '').replace(',', '.'));

  return Number.isFinite(numero) ? numero : 0;
}

function obterNumeroPrincipal(linha: LinhaFunilBase) {
  const numeroOrcamento = normalizarTexto(linha.numero_orcamento);

  if (numeroOrcamento) {
    return numeroOrcamento;
  }

  return normalizarTexto(linha.numero_it_completo).split('-')[0] || '';
}

function obterChaveOrcamento(linha: LinhaFunilBase, dataReferencia?: string | null) {
  const codigoClienteLoja = normalizarTexto(linha.codigo_cliente_loja);
  const numeroOrcamento = obterNumeroPrincipal(linha);

  if (!codigoClienteLoja || !numeroOrcamento) {
    return '';
  }

  return `${codigoClienteLoja}|${numeroOrcamento}|${linha.status}|${dataReferencia || 'sem-data'}`;
}

function montarIntervaloData(filtros: FiltrosFunilOrcamentos) {
  if (filtros.periodo === FILTRO_TODOS_PERIODOS) {
    return null;
  }

  const ano = filtros.periodo;
  const mes = filtros.mes;

  if (mes && mes !== FILTRO_TODOS_MESES) {
    const mesNumero = Number(mes);
    const dataInicio = `${ano}-${mes}-01`;
    const proximoAno = mesNumero === 12 ? Number(ano) + 1 : Number(ano);
    const proximoMes = mesNumero === 12 ? '01' : String(mesNumero + 1).padStart(2, '0');

    return {
      inicio: dataInicio,
      fim: `${proximoAno}-${proximoMes}-01`
    };
  }

  return {
    inicio: `${ano}-01-01`,
    fim: `${Number(ano) + 1}-01-01`
  };
}

function areaEhValida(area: string, filtros: FiltrosFunilOrcamentos) {
  return filtros.area === FILTRO_TODAS_AREAS || area === filtros.area;
}

function descreverErroSupabase(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }

  if (err && typeof err === 'object') {
    const erro = err as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    const partes = [erro.message, erro.details, erro.hint, erro.code].filter(Boolean);

    if (partes.length > 0) {
      return partes.join(' | ');
    }

    try {
      return JSON.stringify(err);
    } catch {
      return 'Não foi possível carregar o funil comercial.';
    }
  }

  return 'Não foi possível carregar o funil comercial.';
}

async function buscarTodasAsPaginas<T extends { id: string }>(
  montarConsulta: () => any
) {
  const linhas: T[] = [];
  let ultimoId = '';

  while (true) {
    let query = montarConsulta()
      .order('id', { ascending: true })
      .limit(TAMANHO_PAGINA_SUPABASE);

    if (ultimoId) {
      query = query.gt('id', ultimoId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const pagina = (data || []) as T[];
    linhas.push(...pagina);

    if (pagina.length < TAMANHO_PAGINA_SUPABASE) {
      break;
    }

    const novoUltimoId = pagina[pagina.length - 1]?.id;

    if (!novoUltimoId || novoUltimoId === ultimoId) {
      break;
    }

    ultimoId = novoUltimoId;
  }

  return linhas;
}

type LinhaOpcoesFunil = {
  id: string;
  status: StatusFunilOrcamento;
  ramo: string | null;
  data_emissao?: string | null;
  data_fechamento?: string | null;
  data_cancelamento?: string | null;
};

async function buscarOpcoesFunilOrcamentos(isAdmin: boolean) {
  const linhas: LinhaOpcoesFunil[] = [];

  for (const status of STATUS_ORDEM) {
    const campoData = DATA_REFERENCIA_STATUS[status];

    const linhasStatus = await buscarTodasAsPaginas<LinhaOpcoesFunil>(() =>
      supabase
        .from('orcamentos_historico')
        .select(`id, status, ramo, ${campoData}`)
        .eq('status', status)
    );

    linhas.push(...linhasStatus);
  }

  const areas = new Set<string>();
  const periodos = new Set<string>();

  linhas.forEach((linha) => {
    const area = normalizarTexto(linha.ramo);

    if (area) {
      areas.add(area);
    }

    const campoData = DATA_REFERENCIA_STATUS[linha.status];
    const { ano } = extrairPartesData(linha[campoData] as string | null);

    if (ano) {
      periodos.add(ano);
    }
  });

  return {
    areas: Array.from(areas).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    periodos: isAdmin
      ? Array.from(periodos).sort(ordenarDecrescente)
      : [calcularAnoCorrente()],
    meses: Object.keys(MESES_NOMES)
  };
}

async function buscarLinhasPorStatus(
  status: StatusFunilOrcamento,
  filtros: FiltrosFunilOrcamentos
) {
  const campoData = DATA_REFERENCIA_STATUS[status] as string;
  const intervalo = montarIntervaloData(filtros);

  const buscarPorCampoData = (campo: string, exigirData = true) =>
    buscarTodasAsPaginas<LinhaFunilBase>(() => {
      let query = supabase
        .from('orcamentos_historico')
        .select(
          `id, cliente_id, codigo_cliente_loja, numero_orcamento, numero_it_completo, status, valor_total, ${campo}`
        )
        .eq('status', status);

      if (filtros.area !== FILTRO_TODAS_AREAS) {
        query = query.eq('ramo', filtros.area);
      }

      if (intervalo) {
        if (exigirData) {
          query = query.not(campo, 'is', null);
        }

        query = query.gte(campo, intervalo.inicio).lt(campo, intervalo.fim);
      }

      return query;
    });

  return buscarPorCampoData(campoData);
}

async function buscarLinhasTotalOrcado(filtros: FiltrosFunilOrcamentos) {
  const intervalo = montarIntervaloData(filtros);

  return buscarTodasAsPaginas<LinhaFunilBase>(() => {
    let query = supabase
      .from('orcamentos_historico')
      .select(
        'id, cliente_id, codigo_cliente_loja, numero_orcamento, numero_it_completo, status, valor_total, data_emissao'
      )
      .in('status', ['A', 'B', 'C']);

    if (filtros.area !== FILTRO_TODAS_AREAS) {
      query = query.eq('ramo', filtros.area);
    }

    if (intervalo) {
      query = query
        .not('data_emissao', 'is', null)
        .gte('data_emissao', intervalo.inicio)
        .lt('data_emissao', intervalo.fim);
    }

    return query;
  });
}



async function buscarLinhasTotalAnalisado(
  filtros: FiltrosFunilOrcamentos
) {
  const intervalo = montarIntervaloData(filtros);

  return buscarTodasAsPaginas<LinhaFunilBase>(() => {
    let query = supabase
      .from('orcamentos_historico')
      .select(
        'id, cliente_id, codigo_cliente_loja, numero_orcamento, numero_it_completo, status, ramo, valor_total, data_emissao, data_fechamento, data_cancelamento'
      )
      .in('status', ['A', 'B', 'C']);

    if (filtros.area !== FILTRO_TODAS_AREAS) {
      query = query.eq('ramo', filtros.area);
    }

    if (intervalo) {
      query = query
        .not('data_emissao', 'is', null)
        .gte('data_emissao', intervalo.inicio)
        .lt('data_emissao', intervalo.fim);
    }

    return query;
  });
}

function calcularResumoStatus(
  status: StatusFunilOrcamento,
  linhas: LinhaFunilBase[]
): FunilOrcamentoResumoStatus {
  const campoData = DATA_REFERENCIA_STATUS[status];
  const orcamentosUnicos = new Set<string>();
  const clientesUnicos = new Set<string>();
  let valorTotal = 0;

  linhas.forEach((linha) => {
    const dataReferencia = linha[campoData] as string | null | undefined;
    const chave = obterChaveOrcamento(linha, dataReferencia || null);

    if (chave) {
      orcamentosUnicos.add(chave);
    }

    if (linha.cliente_id) {
      clientesUnicos.add(linha.cliente_id);
    }

    valorTotal += normalizarValorMonetario(linha.valor_total);
  });

  const quantidadeOrcamentos = orcamentosUnicos.size || linhas.length;

  return {
    status,
    titulo: STATUS_CONFIG[status].titulo,
    descricao: STATUS_CONFIG[status].descricao,
    quantidadeOrcamentos,
    quantidadeItens: linhas.length,
    quantidadeClientes: clientesUnicos.size,
    percentual: 0,
    valorTotal,
    ticketMedio: quantidadeOrcamentos > 0 ? valorTotal / quantidadeOrcamentos : 0
  };
}

function calcularTotaisPorEmissao(linhas: LinhaFunilBase[]) {
  const orcamentosUnicos = new Set<string>();
  const clientesUnicos = new Set<string>();
  let valorTotal = 0;

  linhas.forEach((linha) => {
    const chave = obterChaveOrcamento(linha, linha.data_emissao || null);

    if (chave) {
      orcamentosUnicos.add(chave);
    }

    if (linha.cliente_id) {
      clientesUnicos.add(linha.cliente_id);
    }

    valorTotal += normalizarValorMonetario(linha.valor_total);
  });

  return {
    totalOrcamentos: orcamentosUnicos.size || linhas.length,
    totalItens: linhas.length,
    totalClientes: clientesUnicos.size,
    valorTotal
  };
}


function calcularTotalAnalisadoPorEmissao(linhas: LinhaFunilBase[]) {
  const orcamentosUnicos = new Set<string>();
  const clientesUnicos = new Set<string>();
  let valorTotal = 0;

  linhas.forEach((linha) => {
    const chave = obterChaveOrcamento(linha, linha.data_emissao || null);

    if (chave) {
      orcamentosUnicos.add(chave);
    }

    if (linha.cliente_id) {
      clientesUnicos.add(linha.cliente_id);
    }

    valorTotal += normalizarValorMonetario(linha.valor_total);
  });

  return {
    totalOrcamentos: orcamentosUnicos.size || linhas.length,
    totalItens: linhas.length,
    totalClientes: clientesUnicos.size,
    valorTotal
  };
}

function calcularResumo(
  linhasPorStatus: Record<StatusFunilOrcamento, LinhaFunilBase[]>,
  linhasTotalAnalisado: LinhaFunilBase[],
  periodoDescricao: string
): FunilOrcamentosResumo {
  const statusSemPercentual = STATUS_ORDEM.map((status) =>
    calcularResumoStatus(status, linhasPorStatus[status])
  );

  const valorTotalStatus = statusSemPercentual.reduce(
    (total, item) => total + item.valorTotal,
    0
  );
  const quantidadeTotalStatus = statusSemPercentual.reduce(
    (total, item) => total + item.quantidadeOrcamentos,
    0
  );
  const quantidadeItensTotal = statusSemPercentual.reduce(
    (total, item) => total + item.quantidadeItens,
    0
  );

  const clientesUnicos = new Set<string>();
  STATUS_ORDEM.forEach((status) => {
    linhasPorStatus[status].forEach((linha) => {
      if (linha.cliente_id) {
        clientesUnicos.add(linha.cliente_id);
      }
    });
  });

  const totalAnalisado = calcularTotalAnalisadoPorEmissao(
    linhasTotalAnalisado
  );

  const status = statusSemPercentual.map((item) => ({
    ...item,
    percentual:
      valorTotalStatus > 0
        ? Math.round((item.valorTotal / valorTotalStatus) * 100)
        : quantidadeTotalStatus > 0
          ? Math.round((item.quantidadeOrcamentos / quantidadeTotalStatus) * 100)
          : 0
  }));

  return {
    totalOrcamentos: totalAnalisado.totalOrcamentos,
    totalItens: totalAnalisado.totalItens,
    totalClientes: totalAnalisado.totalClientes,
    valorTotal: totalAnalisado.valorTotal,
    ticketMedio:
      totalAnalisado.totalOrcamentos > 0
        ? totalAnalisado.valorTotal / totalAnalisado.totalOrcamentos
        : 0,
    periodoDescricao,
    status
  };
}


export function useFunilOrcamentos(isAdmin: boolean, refreshKey = 0) {
  const [filtros, setFiltros] = useState<FiltrosFunilOrcamentos>(() =>
    montarFiltrosIniciais(isAdmin)
  );

  useEffect(() => {
    setFiltros(montarFiltrosIniciais(isAdmin));
  }, [isAdmin]);

  const cacheKey = useMemo(() => montarChaveCache(isAdmin, filtros), [isAdmin, filtros]);
  const cacheOpcoesKey = useMemo(() => montarChaveCacheOpcoes(isAdmin), [isAdmin]);
  const periodoDescricao = useMemo(() => montarPeriodoDescricao(), []);
  const resumoInicial = useMemo(
    () => ({
      ...resumoVazio,
      periodoDescricao
    }),
    [periodoDescricao]
  );

  const [estado, setEstado] = useState<EstadoFunilOrcamentos>({
    resumo: resumoInicial,
    opcoes: opcoesVazias,
    loading: false,
    error: null
  });
  const resumoRef = useRef<FunilOrcamentosResumo>(resumoInicial);
  const opcoesRef = useRef<OpcoesFunilOrcamentos>(opcoesVazias);
  const numeroRequisicaoRef = useRef(0);

  useEffect(() => {
    resumoRef.current = estado.resumo;
  }, [estado.resumo]);

  useEffect(() => {
    opcoesRef.current = estado.opcoes;
  }, [estado.opcoes]);

  useEffect(() => {
    const cache = lerCacheSessao<CacheFunilOrcamentos>(
      cacheKey,
      CACHE_TTL_CURTO_MS
    );

    if (cache && resumoRef.current.totalOrcamentos === 0) {
      resumoRef.current = cache.resumo;
      setEstado({
        resumo: cache.resumo,
        opcoes: cache.opcoes,
        loading: false,
        error: null
      });
    }
  }, [cacheKey]);

  const carregarFunilOrcamentos = useCallback(async () => {
    const numeroRequisicao = numeroRequisicaoRef.current + 1;
    numeroRequisicaoRef.current = numeroRequisicao;

    const cache = lerCacheSessao<CacheFunilOrcamentos>(
      cacheKey,
      CACHE_TTL_CURTO_MS
    );
    const opcoesEmCache = lerCacheSessao<OpcoesFunilOrcamentos>(
      cacheOpcoesKey,
      CACHE_TTL_OPCOES_MS
    );

    if (cache && resumoRef.current.totalOrcamentos === 0) {
      resumoRef.current = cache.resumo;
      opcoesRef.current = cache.opcoes;

      setEstado({
        resumo: cache.resumo,
        opcoes: cache.opcoes,
        loading: false,
        error: null
      });
    } else if (
      opcoesEmCache &&
      opcoesRef.current.areas.length === 0
    ) {
      opcoesRef.current = opcoesEmCache;

      setEstado((estadoAtual) => ({
        ...estadoAtual,
        opcoes: opcoesEmCache
      }));
    }

    const possuiDadosEmTela =
      resumoRef.current.totalOrcamentos > 0 ||
      Boolean(cache?.resumo.totalOrcamentos);

    setEstado((estadoAtual) => ({
      ...estadoAtual,
      loading: !possuiDadosEmTela,
      error: null
    }));

    try {
      const promessaOpcoes =
        opcoesEmCache ||
        opcoesRef.current.areas.length > 0
          ? Promise.resolve(opcoesEmCache || opcoesRef.current)
          : buscarOpcoesFunilOrcamentos(isAdmin);

      const [opcoes, abertos, fechados, cancelados, totalAnalisado] =
        await Promise.all([
          promessaOpcoes,
          buscarLinhasPorStatus('A', filtros),
          buscarLinhasPorStatus('B', filtros),
          buscarLinhasPorStatus('C', filtros),
          buscarLinhasTotalOrcado(filtros)
        ]);

      if (numeroRequisicao !== numeroRequisicaoRef.current) {
        return;
      }

      const resumo = calcularResumo(
        {
          A: abertos,
          B: fechados,
          C: cancelados
        },
        totalAnalisado,
        periodoDescricao
      );

      const cacheAtualizado = { resumo, opcoes };

      resumoRef.current = resumo;
      opcoesRef.current = opcoes;

      salvarCacheSessao(cacheKey, cacheAtualizado);
      salvarCacheSessao(cacheOpcoesKey, opcoes);

      setEstado({
        resumo,
        opcoes,
        loading: false,
        error: null
      });
    } catch (err) {
      if (numeroRequisicao !== numeroRequisicaoRef.current) {
        return;
      }

      const mensagem = descreverErroSupabase(err);

      console.error('Erro ao carregar funil de orçamentos:', mensagem, err);

      setEstado((estadoAtual) => ({
        resumo: estadoAtual.resumo,
        opcoes: estadoAtual.opcoes,
        loading: false,
        error: mensagem
      }));
    }
  }, [
    cacheKey,
    cacheOpcoesKey,
    filtros,
    isAdmin,
    periodoDescricao
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarFunilOrcamentos();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [carregarFunilOrcamentos, refreshKey]);

  return {
    resumo: estado.resumo,
    opcoes: estado.opcoes,
    filtros,
    loading: estado.loading,
    error: estado.error,
    setFiltroArea: (area: string) =>
      setFiltros((filtrosAtuais) => ({
        ...filtrosAtuais,
        area
      })),
    setFiltroPeriodo: (periodo: string) =>
      setFiltros((filtrosAtuais) => ({
        ...filtrosAtuais,
        periodo,
        mes: FILTRO_TODOS_MESES
      })),
    setFiltroMes: (mes: string) =>
      setFiltros((filtrosAtuais) => ({
        ...filtrosAtuais,
        mes
      })),
    carregarFunilOrcamentos
  };
}

export const FILTROS_FUNIL_ORCAMENTOS = {
  TODAS_AREAS: FILTRO_TODAS_AREAS,
  TODOS_PERIODOS: FILTRO_TODOS_PERIODOS,
  TODOS_MESES: FILTRO_TODOS_MESES,
  MESES_NOMES
};
