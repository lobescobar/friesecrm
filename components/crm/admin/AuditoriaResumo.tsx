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
      valor: total
    },
    {
      titulo: 'Importações',
      valor: importacoes
    },
    {
      titulo: 'Contatos',
      valor: contatos
    },
    {
      titulo: 'Observações',
      valor: observacoes
    },
    {
      titulo: 'Últimas 24h',
      valor: ultimas24h
    }
  ];

  return (
    <section aria-label="Resumo dos eventos de auditoria">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <article
            key={card.titulo}
            className="flex h-[58px] flex-col justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            aria-label={`${card.titulo}: ${card.valor.toLocaleString('pt-BR')}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {card.titulo}
            </p>
            <p className="mt-1 text-2xl font-bold leading-none text-slate-900">
              {card.valor.toLocaleString('pt-BR')}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
