import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  buscarOrigemImportacaoOrcamentosAtual,
  montarSufixoCacheOrigemImportacao
} from '../lib/origemImportacaoOrcamentos';
import { MESES_HISTORICO_ORCAMENTOS } from '../utils/constants';
import { HistoricoOrcamento } from '../types';
import {
  CACHE_TTL_CURTO_MS,
  lerCacheSessao,
  salvarCacheSessao
} from '../utils/sessionCache';

function calcularDataLimiteHistoricoOrcamentos() {
  const data = new Date();
  data.setMonth(data.getMonth() - MESES_HISTORICO_ORCAMENTOS);
  return data.toISOString().slice(0, 10);
}

type EstadoHistoricoCliente = {
  historico: HistoricoOrcamento[];
  loading: boolean;
  error: string | null;
};

type InteracaoCancelamentoConsulta = {
  numero_orcamento: string;
  observacao: string | null;
  created_at: string | null;
};

const estadoInicial: EstadoHistoricoCliente = {
  historico: [],
  loading: false,
  error: null
};

function montarChaveCacheHistoricoCliente(
  clienteId: string,
  origemImportacao: string | null
) {
  return `historico-cliente:v3:${montarSufixoCacheOrigemImportacao(
    origemImportacao
  )}:${clienteId}`;
}

function extrairMotivoCancelamento(observacao?: string | null) {
  const texto = observacao?.trim() || '';
  const marcador = 'Motivo:';
  const indice = texto.indexOf(marcador);

  if (indice === -1) {
    return texto || null;
  }

  return texto.slice(indice + marcador.length).trim() || null;
}

async function buscarCancelamentosSolicitados(
  clienteId: string,
  numerosOrcamento: string[]
) {
  if (numerosOrcamento.length === 0) {
    return new Map<string, InteracaoCancelamentoConsulta>();
  }

  const { data, error } = await supabase
    .from('orcamentos_interacoes')
    .select('numero_orcamento, observacao, created_at')
    .eq('cliente_id', clienteId)
    .eq('status_comercial', 'cancelamento_solicitado')
    .in('numero_orcamento', numerosOrcamento)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const mapa = new Map<string, InteracaoCancelamentoConsulta>();

  ((data || []) as InteracaoCancelamentoConsulta[]).forEach((interacao) => {
    if (!mapa.has(interacao.numero_orcamento)) {
      mapa.set(interacao.numero_orcamento, interacao);
    }
  });

  return mapa;
}

export function useHistoricoCliente(clienteId?: string | null, ativo = true) {
  const [estado, setEstado] = useState<EstadoHistoricoCliente>(estadoInicial);
  const historicoRef = useRef<HistoricoOrcamento[]>([]);

  useEffect(() => {
    historicoRef.current = estado.historico;
  }, [estado.historico]);

  const carregarHistorico = useCallback(async () => {
    if (!clienteId || !ativo) {
      if (!clienteId) {
        setEstado(estadoInicial);
      }

      return;
    }

    setEstado((estadoAtual) => ({
      ...estadoAtual,
      loading: historicoRef.current.length === 0,
      error: null
    }));

    try {
      const dataLimite = calcularDataLimiteHistoricoOrcamentos();
      const origemImportacao = await buscarOrigemImportacaoOrcamentosAtual();
      const cacheKey = montarChaveCacheHistoricoCliente(
        clienteId,
        origemImportacao
      );
      const historicoEmCache = lerCacheSessao<HistoricoOrcamento[]>(
        cacheKey,
        CACHE_TTL_CURTO_MS
      );

      if (historicoEmCache && historicoRef.current.length === 0) {
        historicoRef.current = historicoEmCache;
        setEstado({
          historico: historicoEmCache,
          loading: false,
          error: null
        });
      }

      const possuiDadosEmTela =
        historicoRef.current.length > 0 || Boolean(historicoEmCache);

      setEstado((estadoAtual) => ({
        ...estadoAtual,
        loading: !possuiDadosEmTela,
        error: null
      }));

      let query = supabase
        .from('orcamentos_historico')
        .select('*')
        .eq('cliente_id', clienteId)
        .gte('data_emissao', dataLimite);

      if (origemImportacao) {
        query = query.eq('origem_importacao', origemImportacao);
      }

      const { data, error: erroBusca } = await query
        .order('data_emissao', { ascending: false })
        .order('numero_it_completo', { ascending: true });

      if (erroBusca) {
        throw erroBusca;
      }

      const historicoBanco = (data || []) as HistoricoOrcamento[];
      const numerosOrcamento = Array.from(
        new Set(historicoBanco.map((item) => item.numero_orcamento))
      );
      const cancelamentosSolicitados =
        await buscarCancelamentosSolicitados(clienteId, numerosOrcamento);
      const historicoAtualizado = historicoBanco.map((item) => {
        const cancelamento = cancelamentosSolicitados.get(
          item.numero_orcamento
        );

        if (!cancelamento) {
          return item;
        }

        return {
          ...item,
          cancelamento_solicitado: true,
          motivo_cancelamento: extrairMotivoCancelamento(
            cancelamento.observacao
          ),
          cancelamento_solicitado_em: cancelamento.created_at
        };
      });

      historicoRef.current = historicoAtualizado;
      salvarCacheSessao(cacheKey, historicoAtualizado);

      setEstado({
        historico: historicoAtualizado,
        loading: false,
        error: null
      });
    } catch (err) {
      const mensagem =
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar o histórico do cliente.';

      console.error('Erro ao carregar histórico do cliente:', err);

      setEstado((estadoAtual) => ({
        historico: estadoAtual.historico,
        loading: false,
        error: mensagem
      }));
    }
  }, [clienteId, ativo]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarHistorico();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [carregarHistorico]);

  return {
    historico: estado.historico,
    loading: estado.loading,
    error: estado.error,
    carregarHistorico
  };
}
