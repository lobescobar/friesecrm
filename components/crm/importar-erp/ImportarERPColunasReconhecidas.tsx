import { ColunaReconhecidaERP } from '../../../types/importacaoERP';

type ImportarERPColunasReconhecidasProps = {
  colunas: ColunaReconhecidaERP[];
};

export default function ImportarERPColunasReconhecidas({
  colunas
}: ImportarERPColunasReconhecidasProps) {
  if (!colunas.length) {
    return null;
  }

  return (
    <section
      aria-labelledby="importar-erp-colunas-reconhecidas"
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <h3
        id="importar-erp-colunas-reconhecidas"
        className="mb-3 text-sm font-bold text-slate-900"
      >
        Colunas reconhecidas
      </h3>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {colunas.map((coluna) => (
          <div
            key={coluna.campo}
            className="rounded-xl border border-slate-100 bg-slate-50 p-3"
          >
            <p className="text-xs font-bold uppercase text-slate-400">
              {coluna.campo}
            </p>
            <p className="text-sm font-medium text-slate-700">
              {coluna.origem}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
