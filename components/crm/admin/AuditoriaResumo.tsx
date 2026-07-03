import { AuditLog } from '../../../types';

type AuditoriaResumoProps = {
  logs: AuditLog[];
};

function ocorreuNasUltimas24h(createdAt: string) {
  const data = new Date(createdAt).getTime();

  if (Number.isNaN(data)) {
    return false;
  }

  return Date.now() - data <= 24 * 60 * 60 * 1000;
}

export default function AuditoriaResumo({ logs }: AuditoriaResumoProps) {
  const total = logs.length;
  const importacoes = logs.filter((log) =>
    log.acao.startsWith('importacao_')
  ).length;
  const contatos = logs.filter((log) => log.tabela === 'contatos_clientes').length;
  const observacoes = logs.filter(
    (log) => log.acao === 'update_observacoes'
  ).length;
  const ultimas24h = logs.filter((log) => ocorreuNasUltimas24h(log.created_at)).length;

  const cards = [
    {
      titulo: 'Eventos listados',
      valor: total,
      descricao: 'Registros retornados pelos filtros atuais'
    },
    {
      titulo: 'Importações',
      valor: importacoes,
      descricao: 'ERP e orçamentos registrados'
    },
    {
      titulo: 'Contatos',
      valor: contatos,
      descricao: 'Inclusões, edições e exclusões'
    },
    {
      titulo: 'Observações',
      valor: observacoes,
      descricao: 'Alterações no campo observações'
    },
    {
      titulo: 'Últimas 24h',
      valor: ultimas24h,
      descricao: 'Eventos recentes na lista atual'
    }
  ];

  return (
    <section aria-label="Resumo dos eventos de auditoria">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <article
            key={card.titulo}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            aria-label={`${card.titulo}: ${card.valor.toLocaleString(
              'pt-BR'
            )}. ${card.descricao}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {card.titulo}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {card.valor.toLocaleString('pt-BR')}
            </p>
            <p className="mt-1 text-xs text-slate-500">{card.descricao}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
