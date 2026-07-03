import { AuditLog } from '../../../types';

type AuditoriaDetalhesProps = {
  log: AuditLog | null;
};

function formatarJson(valor: unknown) {
  if (valor === null || valor === undefined) {
    return 'Sem dados.';
  }

  try {
    return JSON.stringify(valor, null, 2);
  } catch {
    return String(valor);
  }
}

function formatarData(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(data);
}

function BlocoJson({ titulo, valor }: { titulo: string; valor: unknown }) {
  const conteudo = formatarJson(valor);

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
      aria-label={titulo}
    >
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {titulo}
      </h4>
      <pre
        className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white p-3 text-[11px] leading-relaxed text-slate-700"
        tabIndex={0}
        aria-label={`${titulo} em formato JSON`}
      >
        {conteudo}
      </pre>
    </section>
  );
}

export default function AuditoriaDetalhes({ log }: AuditoriaDetalhesProps) {
  if (!log) {
    return (
      <aside
        className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"
        role="status"
        aria-live="polite"
      >
        Selecione um evento da tabela para ver os detalhes técnicos da auditoria.
      </aside>
    );
  }

  return (
    <aside
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="auditoria-detalhes-titulo"
      aria-live="polite"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Evento selecionado
        </p>
        <h3 id="auditoria-detalhes-titulo" className="mt-1 text-lg font-bold text-slate-900">
          {log.acao}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {formatarData(log.created_at)} · {log.tabela} · {log.origem}
        </p>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[10px] font-bold uppercase text-slate-400">
            Usuário
          </dt>
          <dd className="mt-1 break-words font-semibold text-slate-700">
            {log.user_email || 'Não identificado'}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[10px] font-bold uppercase text-slate-400">
            Registro
          </dt>
          <dd className="mt-1 break-words font-semibold text-slate-700">
            {log.registro_id || log.cliente_id || 'Não informado'}
          </dd>
        </div>
      </dl>

      <BlocoJson titulo="Detalhes" valor={log.detalhes} />
      <BlocoJson titulo="Valor anterior" valor={log.valor_anterior} />
      <BlocoJson titulo="Valor novo" valor={log.valor_novo} />
    </aside>
  );
}
