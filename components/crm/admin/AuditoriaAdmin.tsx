'use client';

import { useMemo, useState } from 'react';
import { AuditLog } from '../../../types';
import { FiltrosAuditoria, useAuditoria } from '../../../hooks/useAuditoria';
import Button from '../../ui/Button';
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
  const [aberto, setAberto] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosAuditoria>(filtrosIniciais);
  const [logSelecionado, setLogSelecionado] = useState<AuditLog | null>(null);

  const { logs, loading, error, carregarAuditoria } = useAuditoria(
    filtros,
    aberto
  );

  const tabelas = useMemo(() => valoresUnicos(logs, 'tabela'), [logs]);
  const acoes = useMemo(() => valoresUnicos(logs, 'acao'), [logs]);
  const origens = useMemo(() => valoresUnicos(logs, 'origem'), [logs]);

  function alternarAberto() {
    setAberto((valorAtual) => !valorAtual);
  }

  function selecionarLog(log: AuditLog) {
    setLogSelecionado(log);
  }

  function alterarFiltros(proximosFiltros: FiltrosAuditoria) {
    setFiltros(proximosFiltros);
    setLogSelecionado(null);
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Administração
          </p>
          <h2 className="text-lg font-bold text-slate-900">
            Auditoria do CRM
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Consulte importações, alterações de contatos e atualizações de observações registradas na Etapa 14U.
          </p>
        </div>

        <Button type="button" variant="secondary" onClick={alternarAberto}>
          {aberto ? 'Ocultar auditoria' : 'Abrir auditoria'}
        </Button>
      </div>

      {aberto ? (
        <div className="space-y-4 p-4">
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
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
            <p className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-medium text-blue-700">
              Carregando eventos de auditoria...
            </p>
          ) : null}

          <p className="text-xs text-slate-400">
            A auditoria é somente leitura. A política RLS permite consulta apenas para administradores.
          </p>
        </div>
      ) : null}
    </section>
  );
}
