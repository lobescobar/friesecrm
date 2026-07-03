import type { KeyboardEvent } from 'react';
import { AuditLog } from '../../../types';

type AuditoriaTabelaProps = {
  logs: AuditLog[];
  logSelecionadoId?: string | null;
  onSelecionarLog: (log: AuditLog) => void;
};

function formatarData(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(data);
}

function resumirDetalhes(log: AuditLog) {
  const detalhes = log.detalhes || {};
  const arquivoNome = detalhes.arquivo_nome;
  const resultado = detalhes.resultado;

  if (typeof arquivoNome === 'string' && arquivoNome) {
    return arquivoNome;
  }

  if (resultado && typeof resultado === 'object') {
    return 'Resumo de importação disponível';
  }

  if (log.cliente_id) {
    return `Cliente: ${log.cliente_id}`;
  }

  return log.registro_id || 'Sem resumo';
}

function classeAcao(acao: string) {
  if (acao.startsWith('importacao_')) {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  if (acao === 'delete') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (acao === 'insert') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function selecionarComTeclado(
  event: KeyboardEvent<HTMLTableRowElement>,
  log: AuditLog,
  onSelecionarLog: (log: AuditLog) => void
) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  event.preventDefault();
  onSelecionarLog(log);
}

export default function AuditoriaTabela({
  logs,
  logSelecionadoId,
  onSelecionarLog
}: AuditoriaTabelaProps) {
  if (!logs.length) {
    return (
      <div
        className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500"
        role="status"
        aria-live="polite"
      >
        Nenhum evento encontrado para os filtros atuais.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[520px] overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <caption className="sr-only">
            Eventos de auditoria. Use Enter ou Espaço em uma linha para ver os detalhes.
          </caption>
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <tr>
              <th scope="col" className="px-4 py-3">Data</th>
              <th scope="col" className="px-4 py-3">Usuário</th>
              <th scope="col" className="px-4 py-3">Ação</th>
              <th scope="col" className="px-4 py-3">Tabela</th>
              <th scope="col" className="px-4 py-3">Origem</th>
              <th scope="col" className="px-4 py-3">Resumo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => {
              const selecionado = log.id === logSelecionadoId;
              const dataFormatada = formatarData(log.created_at);
              const resumo = resumirDetalhes(log);

              return (
                <tr
                  key={log.id}
                  tabIndex={0}
                  aria-selected={selecionado}
                  aria-label={`Evento ${log.acao} em ${log.tabela}, criado em ${dataFormatada}. Pressione Enter para ver detalhes.`}
                  onClick={() => onSelecionarLog(log)}
                  onKeyDown={(event) =>
                    selecionarComTeclado(event, log, onSelecionarLog)
                  }
                  className={`cursor-pointer transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-amber-400 ${
                    selecionado ? 'bg-blue-50/70' : 'bg-white'
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                    {dataFormatada}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-600">
                    {log.user_email || 'Não identificado'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${classeAcao(
                        log.acao
                      )}`}
                    >
                      {log.acao}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {log.tabela}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {log.origem}
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-slate-500">
                    {resumo}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
