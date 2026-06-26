import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuditLog } from '../types';

export type FiltrosAuditoria = {
  dataInicio: string;
  dataFim: string;
  usuario: string;
  tabela: string;
  acao: string;
  origem: string;
  busca: string;
  limite: number;
};

const CAMPOS_AUDITORIA =
  'id,created_at,user_id,user_email,tabela,registro_id,cliente_id,acao,origem,valor_anterior,valor_novo,detalhes';

function normalizarBusca(valor: unknown) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function inicioDoDiaISO(data: string) {
  return new Date(`${data}T00:00:00`).toISOString();
}

function fimDoDiaISO(data: string) {
  return new Date(`${data}T23:59:59.999`).toISOString();
}

function logContemBusca(log: AuditLog, busca: string) {
  const termo = normalizarBusca(busca);

  if (!termo) {
    return true;
  }

  const textoPesquisavel = normalizarBusca([
    log.user_email,
    log.tabela,
    log.acao,
    log.origem,
    log.registro_id,
    log.cliente_id,
    JSON.stringify(log.detalhes ?? {}),
    JSON.stringify(log.valor_anterior ?? {}),
    JSON.stringify(log.valor_novo ?? {})
  ].join(' '));

  return textoPesquisavel.includes(termo);
}

export function useAuditoria(filtros: FiltrosAuditoria, ativo: boolean) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtrosNormalizados = useMemo(
    () => ({
      ...filtros,
      dataInicio: filtros.dataInicio.trim(),
      dataFim: filtros.dataFim.trim(),
      usuario: filtros.usuario.trim(),
      tabela: filtros.tabela.trim(),
      acao: filtros.acao.trim(),
      origem: filtros.origem.trim(),
      busca: filtros.busca.trim(),
      limite: Number.isFinite(filtros.limite) ? filtros.limite : 200
    }),
    [filtros]
  );

  const carregarAuditoria = useCallback(async () => {
    if (!ativo) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('audit_log')
        .select(CAMPOS_AUDITORIA)
        .order('created_at', { ascending: false })
        .limit(filtrosNormalizados.limite);

      if (filtrosNormalizados.dataInicio) {
        query = query.gte('created_at', inicioDoDiaISO(filtrosNormalizados.dataInicio));
      }

      if (filtrosNormalizados.dataFim) {
        query = query.lte('created_at', fimDoDiaISO(filtrosNormalizados.dataFim));
      }

      if (filtrosNormalizados.usuario) {
        query = query.ilike('user_email', `%${filtrosNormalizados.usuario}%`);
      }

      if (filtrosNormalizados.tabela) {
        query = query.eq('tabela', filtrosNormalizados.tabela);
      }

      if (filtrosNormalizados.acao) {
        query = query.eq('acao', filtrosNormalizados.acao);
      }

      if (filtrosNormalizados.origem) {
        query = query.eq('origem', filtrosNormalizados.origem);
      }

      const { data, error: erroBusca } = await query;

      if (erroBusca) {
        throw erroBusca;
      }

      const logsRecebidos = (data || []) as AuditLog[];
      const logsFiltrados = logsRecebidos.filter((log) =>
        logContemBusca(log, filtrosNormalizados.busca)
      );

      setLogs(logsFiltrados);
    } catch (err) {
      const mensagem =
        err instanceof Error ? err.message : 'Erro ao carregar auditoria.';
      console.error('Erro ao carregar auditoria:', err);
      setError(mensagem);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [ativo, filtrosNormalizados]);

  useEffect(() => {
    if (!ativo) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      void carregarAuditoria();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [ativo, carregarAuditoria]);

  return {
    logs,
    loading,
    error,
    carregarAuditoria
  };
}
