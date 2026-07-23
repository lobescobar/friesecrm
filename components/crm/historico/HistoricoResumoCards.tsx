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

type CardResumo = {
  status: StatusFiltro;
  label: string;
  corTextoLabel: string;
  corTextoValor: string;
  classeAtivo: string;
  classeInativo: string;
};

const cards: CardResumo[] = [
  {
    status: 'todos',
    label: 'Total',
    corTextoLabel: 'text-slate-400',
    corTextoValor: 'text-slate-900',
    classeAtivo: 'border-slate-600 bg-white ring-2 ring-slate-500',
    classeInativo: 'border-slate-200 bg-white hover:bg-slate-50'
  },
  {
    status: 'A',
    label: 'Abertos',
    corTextoLabel: 'text-blue-600',
    corTextoValor: 'text-blue-700',
    classeAtivo: 'border-blue-500 bg-blue-50 ring-2 ring-blue-400',
    classeInativo: 'border-blue-100 bg-blue-50 hover:bg-blue-100'
  },
  {
    status: 'B',
    label: 'Fechados',
    corTextoLabel: 'text-green-600',
    corTextoValor: 'text-green-700',
    classeAtivo: 'border-green-500 bg-green-50 ring-2 ring-green-400',
    classeInativo: 'border-green-100 bg-green-50 hover:bg-green-100'
  },
  {
    status: 'C',
    label: 'Cancelados',
    corTextoLabel: 'text-red-600',
    corTextoValor: 'text-red-700',
    classeAtivo: 'border-red-500 bg-red-50 ring-2 ring-red-400',
    classeInativo: 'border-red-100 bg-red-50 hover:bg-red-100'
  }
];

function obterValorCard(status: StatusFiltro, resumo: HistoricoResumoCardsProps['resumo']) {
  if (status === 'A') {
    return resumo.abertos;
  }

  if (status === 'B') {
    return resumo.fechados;
  }

  if (status === 'C') {
    return resumo.cancelados;
  }

  return resumo.total;
}

export default function HistoricoResumoCards({
  resumo,
  statusFiltro,
  onStatusFiltroChange
}: HistoricoResumoCardsProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-label="Resumo do histórico de orçamentos"
    >
      {cards.map((card) => {
        const ativo = statusFiltro === card.status;
        const valor = obterValorCard(card.status, resumo);

        return (
          <button
            key={card.status}
            type="button"
            onClick={() => onStatusFiltroChange(card.status)}
            aria-pressed={ativo}
            className={`flex h-[58px] flex-col justify-center rounded-2xl border px-4 py-2 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58A2A] focus-visible:ring-offset-2 ${
              ativo ? card.classeAtivo : card.classeInativo
            }`}
          >
            <span
              className={`text-[11px] font-bold uppercase leading-none tracking-wide ${card.corTextoLabel}`}
            >
              {card.label}
            </span>
            <span
              className={`mt-1 text-xl font-extrabold leading-none ${card.corTextoValor}`}
            >
              {valor}
            </span>
          </button>
        );
      })}
    </div>
  );
}
