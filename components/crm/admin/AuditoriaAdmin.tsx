'use client';

import { useMemo, useState } from 'react';
import { AuditLog } from '../../../types';
import { FiltrosAuditoria, useAuditoria } from '../../../hooks/useAuditoria';
import AuditoriaDetalhes from './AuditoriaDetalhes';
import AuditoriaFiltros from './AuditoriaFiltros';
import AuditoriaResumo from './AuditoriaResumo';
import AuditoriaTabela from './AuditoriaTabela';

const filtrosIniciais: FiltrosAuditoria = {
  dataInicio: '',
  dataFim: '',
  usuario: '',
  tabela: '',
  acao: '',
  origem: '',
  busca: '',
  limite: 200
};

function valoresUnicos(logs: AuditLog[], campo: 'tabela' | 'acao' | 'origem') {
  return Array.from(
    new Set(logs.map((log) => log[campo]).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export default function AuditoriaAdmin() {
  const [filtros, setFiltros] = useState<FiltrosAuditoria>(filtrosIniciais);
  const [logSelecionado, setLogSelecionado] = useState<AuditLog | null>(null);

  const { logs, loading, error, carregarAuditoria } = useAuditoria(
    filtros,
    true
  );

  const tabelas = useMemo(() => valoresUnicos(logs, 'tabela'), [logs]);
  const acoes = useMemo(() => valoresUnicos(logs, 'acao'), [logs]);
  const origens = useMemo(() => valoresUnicos(logs, 'origem'), [logs]);

  function selecionarLog(log: AuditLog) {
    setLogSelecionado(log);
  }

  function alterarFiltros(proximosFiltros: FiltrosAuditoria) {
    setFiltros(proximosFiltros);
    setLogSelecionado(null);
  }

  return (
    <section
      className="mt-4 space-y-4"
      aria-labelledby="auditoria-admin-titulo"
    >
      <div className="sr-only">
        <h2 id="auditoria-admin-titulo">Auditoria administrativa</h2>
      </div>

      <AuditoriaFiltros
        filtros={filtros}
        tabelas={tabelas}
        acoes={acoes}
        origens={origens}
        loading={loading}
        onChange={alterarFiltros}
        onAtualizar={carregarAuditoria}
      />

      {error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          Não foi possível carregar auditoria: {error}
        </div>
      ) : null}

      <AuditoriaResumo logs={logs} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <AuditoriaTabela
          logs={logs}
          logSelecionadoId={logSelecionado?.id}
          onSelecionarLog={selecionarLog}
        />

        <AuditoriaDetalhes log={logSelecionado} />
      </div>

      {loading ? (
        <p
          className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-medium text-blue-700"
          role="status"
          aria-live="polite"
        >
          Carregando eventos de auditoria...
        </p>
      ) : null}

      <p className="text-xs text-slate-400">
        A auditoria é somente leitura. A política RLS permite consulta apenas para administradores.
      </p>
    </section>
  );
}
