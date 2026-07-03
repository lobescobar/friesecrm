import type { StatusFiltro } from '../../../types/historico';

type HistoricoResumoCardsProps = {
  resumo: {
    total: number;
    abertos: number;
    fechados: number;
    cancelados: number;
  };
  statusFiltro: StatusFiltro;
  onStatusFiltroChange: (status: StatusFiltro) => void;
};

export default function HistoricoResumoCards({
  resumo,
  statusFiltro,
  onStatusFiltroChange
}: HistoricoResumoCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Resumo do histórico de orçamentos">
      <button
        type="button"
        onClick={() => onStatusFiltroChange('todos')}
        aria-pressed={statusFiltro === 'todos'}
        className={`rounded-2xl p-4 text-left transition ${
          statusFiltro === 'todos'
            ? 'ring-2 ring-slate-500'
            : 'bg-slate-50 hover:bg-slate-100'
        }`}
      >
        <p className="text-xs font-semibold uppercase text-slate-400">Total</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{resumo.total}</p>
      </button>

      <button
        type="button"
        onClick={() => onStatusFiltroChange('A')}
        aria-pressed={statusFiltro === 'A'}
        className={`rounded-2xl p-4 text-left transition ${
          statusFiltro === 'A'
            ? 'ring-2 ring-blue-500'
            : 'bg-blue-50 hover:bg-blue-100'
        }`}
      >
        <p className="text-xs font-semibold uppercase text-blue-500">Abertos</p>
        <p className="mt-1 text-2xl font-bold text-blue-700">{resumo.abertos}</p>
      </button>

      <button
        type="button"
        onClick={() => onStatusFiltroChange('B')}
        aria-pressed={statusFiltro === 'B'}
        className={`rounded-2xl p-4 text-left transition ${
          statusFiltro === 'B'
            ? 'ring-2 ring-green-500'
            : 'bg-green-50 hover:bg-green-100'
        }`}
      >
        <p className="text-xs font-semibold uppercase text-green-500">Fechados</p>
        <p className="mt-1 text-2xl font-bold text-green-700">{resumo.fechados}</p>
      </button>

      <button
        type="button"
        onClick={() => onStatusFiltroChange('C')}
        aria-pressed={statusFiltro === 'C'}
        className={`rounded-2xl p-4 text-left transition ${
          statusFiltro === 'C'
            ? 'ring-2 ring-red-500'
            : 'bg-red-50 hover:bg-red-100'
        }`}
      >
        <p className="text-xs font-semibold uppercase text-red-500">Cancelados</p>
        <p className="mt-1 text-2xl font-bold text-red-700">{resumo.cancelados}</p>
      </button>
    </div>
  );
}
