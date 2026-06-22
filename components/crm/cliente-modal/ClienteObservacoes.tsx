'use client';

type ClienteObservacoesProps = {
  observacoes: string;
  onChange: (valor: string) => void;
};

export default function ClienteObservacoes({
  observacoes,
  onChange
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
    </section>
  );
}
