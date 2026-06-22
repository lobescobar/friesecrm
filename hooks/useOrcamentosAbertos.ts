import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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

type ClienteRelacionado = {
  id?: string | null;
  empresa?: string | null;
  razao_social?: string | null;
  nome_fantasia?: string | null;
};

type LinhaOrcamentoAberto = {
  id: string;
  cliente_id: string | null;
  codigo_cliente: string;
  codigo_cliente_loja: string;
  numero_orcamento: string;
  numero_it_completo: string;
  data_emissao: string;
  clientes?: ClienteRelacionado | ClienteRelacionado[] | null;
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

function calcularDataLimite36Meses() {
  const data = new Date();
  data.setMonth(data.getMonth() - 36);
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

function obterNomeCliente(linha: LinhaOrcamentoAberto) {
  const cliente = obterClienteRelacionado(linha.clientes);

  return (
    cliente?.empresa ||
    cliente?.razao_social ||
    cliente?.nome_fantasia ||
    'Cliente sem nome'
  );
}

function agruparOrcamentosAbertos(
  linhas: LinhaOrcamentoAberto[]
): OrcamentoAbertoResumo[] {
  const mapa = new Map<string, OrcamentoAbertoResumo>();

  linhas.forEach((linha) => {
    const chave = `${linha.codigo_cliente_loja}|${linha.numero_orcamento}`;
    const existente = mapa.get(chave);

    if (!existente) {
      mapa.set(chave, {
        chave,
        cliente_id: linha.cliente_id,
        codigo_cliente: linha.codigo_cliente,
        codigo_cliente_loja: linha.codigo_cliente_loja,
        nome_cliente: obterNomeCliente(linha),
        numero_orcamento: linha.numero_orcamento,
        data_emissao: linha.data_emissao,
        quantidade_itens: 1
      });
      return;
    }

    mapa.set(chave, {
      ...existente,
      data_emissao:
        linha.data_emissao > existente.data_emissao
          ? linha.data_emissao
          : existente.data_emissao,
      quantidade_itens: existente.quantidade_itens + 1
    });
  });

  return Array.from(mapa.values()).sort((a, b) => {
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

export function useOrcamentosAbertos(refreshKey = 0) {
  const [estado, setEstado] = useState<EstadoOrcamentosAbertos>(estadoInicial);

  const carregarOrcamentosAbertos = useCallback(async () => {
    setEstado((estadoAtual) => ({
      ...estadoAtual,
      loading: true,
      error: null
    }));

    try {
      const dataLimite = calcularDataLimite36Meses();

      const { data, error } = await supabase
        .from('orcamentos_historico')
        .select(
          'id, cliente_id, codigo_cliente, codigo_cliente_loja, numero_orcamento, numero_it_completo, data_emissao, clientes(id, empresa, razao_social, nome_fantasia)'
        )
        .eq('status', 'A')
        .gte('data_emissao', dataLimite)
        .order('codigo_cliente_loja', { ascending: true })
        .order('numero_orcamento', { ascending: true });

      if (error) {
        throw error;
      }

      const linhas = (data || []) as LinhaOrcamentoAberto[];

      setEstado({
        orcamentos: agruparOrcamentosAbertos(linhas),
        loading: false,
        error: null
      });
    } catch (err) {
      const mensagem =
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os orçamentos em aberto.';

      console.error('Erro ao carregar orçamentos em aberto:', err);

      setEstado({
        orcamentos: [],
        loading: false,
        error: mensagem
      });
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarOrcamentosAbertos();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [carregarOrcamentosAbertos, refreshKey]);

  return {
    orcamentos: estado.orcamentos,
    loading: estado.loading,
    error: estado.error,
    carregarOrcamentosAbertos
  };
}
