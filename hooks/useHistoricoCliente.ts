import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { HistoricoOrcamento } from '../types';
import {
  CACHE_TTL_CURTO_MS,
  lerCacheSessao,
  salvarCacheSessao
} from '../utils/sessionCache';

function calcularDataLimite36Meses() {
  const data = new Date();
  data.setMonth(data.getMonth() - 36);
  return data.toISOString().slice(0, 10);
}

type EstadoHistoricoCliente = {
  historico: HistoricoOrcamento[];
  loading: boolean;
  error: string | null;
};

const estadoInicial: EstadoHistoricoCliente = {
  historico: [],
  loading: false,
  error: null
};

export function useHistoricoCliente(clienteId?: string | null, ativo = true) {
  const cacheKey = useMemo(
    () => (clienteId ? `historico-cliente:${clienteId}` : null),
    [clienteId]
  );
  const [estado, setEstado] = useState<EstadoHistoricoCliente>(estadoInicial);
  const historicoRef = useRef<HistoricoOrcamento[]>([]);

  useEffect(() => {
    historicoRef.current = estado.historico;
  }, [estado.historico]);

  useEffect(() => {
    if (!cacheKey || historicoRef.current.length > 0) {
      return;
    }

    const historicoEmCache = lerCacheSessao<HistoricoOrcamento[]>(
      cacheKey,
      CACHE_TTL_CURTO_MS
    );

    if (historicoEmCache) {
      setEstado({
        historico: historicoEmCache,
        loading: false,
        error: null
      });
    }
  }, [cacheKey]);

  const carregarHistorico = useCallback(async () => {
    if (!clienteId || !ativo || !cacheKey) {
      if (!clienteId) {
        setEstado(estadoInicial);
      }

      return;
    }

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

    try {
      const dataLimite = calcularDataLimite36Meses();

      const { data, error: erroBusca } = await supabase
        .from('orcamentos_historico')
        .select('*')
        .eq('cliente_id', clienteId)
        .gte('data_emissao', dataLimite)
        .order('data_emissao', { ascending: false })
        .order('numero_it_completo', { ascending: true });

      if (erroBusca) {
        throw erroBusca;
      }

      const historicoAtualizado = (data || []) as HistoricoOrcamento[];

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
  }, [clienteId, ativo, cacheKey]);

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
