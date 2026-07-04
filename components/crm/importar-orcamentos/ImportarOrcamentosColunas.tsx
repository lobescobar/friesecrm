type ImportarOrcamentosColunasProps = {
  headers: string[];
};

export default function ImportarOrcamentosColunas({
  headers
}: ImportarOrcamentosColunasProps) {
  if (!headers.length) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5"
      aria-labelledby="importar-orcamentos-colunas-titulo"
    >
      <h3
        id="importar-orcamentos-colunas-titulo"
        className="text-sm font-bold uppercase tracking-widest text-slate-500"
      >
        Colunas reconhecidas
      </h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {headers.map((header) => (
          <span
            key={header}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {header}
          </span>
        ))}
      </div>
    </section>
  );
}
