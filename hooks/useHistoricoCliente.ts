import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { HistoricoOrcamento } from '../types';

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
  const [estado, setEstado] = useState<EstadoHistoricoCliente>(estadoInicial);

  const carregarHistorico = useCallback(async () => {
    if (!clienteId || !ativo) {
      setEstado(estadoInicial);
      return;
    }

    setEstado((estadoAtual) => ({
      ...estadoAtual,
      loading: true,
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

      setEstado({
        historico: (data || []) as HistoricoOrcamento[],
        loading: false,
        error: null
      });
    } catch (err) {
      const mensagem =
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar o histórico do cliente.';

      console.error('Erro ao carregar histórico do cliente:', err);

      setEstado({
        historico: [],
        loading: false,
        error: mensagem
      });
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
