'use client';

type ClienteObservacoesProps = {
  observacoes: string;
  lembreteEm: string;
  lembreteEnviadoEm?: string | null;
  onChange: (valor: string) => void;
  onLembreteChange: (valor: string) => void;
};

export default function ClienteObservacoes({
  observacoes,
  lembreteEm,
  lembreteEnviadoEm,
  onChange,
  onLembreteChange
}: ClienteObservacoesProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 border-b border-slate-100 pb-3">
        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">
          Observações / histórico
        </h4>
        <p className="mt-1 text-sm text-slate-500">
          Anotações sobre visitas, negociação, pedidos ou próximos passos.
        </p>
      </div>

      <textarea
        className="h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900"
        placeholder="Anotações sobre visitas, negociação, pedidos ou próximos passos..."
        value={observacoes}
        onChange={(event) => onChange(event.target.value)}
      />

      <div className="mt-4 border-t border-slate-100 pt-4">
        <label className="block" htmlFor="observacoes-lembrete">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Lembrete (data e hora)
          </span>
          <input
            id="observacoes-lembrete"
            type="datetime-local"
            value={lembreteEm}
            onChange={(event) => onLembreteChange(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm sm:max-w-sm"
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">
          O vendedor responsável pela carteira receberá a observação por e-mail
          na data e hora informadas.
        </p>
        {lembreteEnviadoEm ? (
          <p className="mt-2 text-xs font-semibold text-green-700" role="status">
            Lembrete enviado.
          </p>
        ) : lembreteEm ? (
          <p className="mt-2 text-xs font-semibold text-amber-700" role="status">
            Lembrete programado.
          </p>
        ) : null}
      </div>
    </section>
  );
}
