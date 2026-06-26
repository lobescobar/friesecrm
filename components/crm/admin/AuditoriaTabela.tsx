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

export default function AuditoriaTabela({
  logs,
  logSelecionadoId,
  onSelecionarLog
}: AuditoriaTabelaProps) {
  if (!logs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Nenhum evento encontrado para os filtros atuais.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[520px] overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Tabela</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Resumo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => {
              const selecionado = log.id === logSelecionadoId;

              return (
                <tr
                  key={log.id}
                  onClick={() => onSelecionarLog(log)}
                  className={`cursor-pointer transition hover:bg-slate-50 ${
                    selecionado ? 'bg-blue-50/70' : 'bg-white'
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                    {formatarData(log.created_at)}
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
                    {resumirDetalhes(log)}
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
