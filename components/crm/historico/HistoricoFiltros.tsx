import type {
  ColunaOrdenacao,
  DirecaoOrdenacao,
  StatusFiltro
} from '../../../types/historico';

type HistoricoFiltrosProps = {
  statusFiltro: StatusFiltro;
  colunaOrdenacao: ColunaOrdenacao;
  direcaoOrdenacao: DirecaoOrdenacao;
  totalExibidos: number;
  total: number;
  onStatusFiltroChange: (status: StatusFiltro) => void;
  onColunaOrdenacaoChange: (coluna: ColunaOrdenacao) => void;
  onDirecaoOrdenacaoChange: (direcao: DirecaoOrdenacao) => void;
};

export default function HistoricoFiltros({
  statusFiltro,
  colunaOrdenacao,
  direcaoOrdenacao,
  totalExibidos,
  total,
  onStatusFiltroChange,
  onColunaOrdenacaoChange,
  onDirecaoOrdenacaoChange
}: HistoricoFiltrosProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-end md:justify-between">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Status
          <select
            value={statusFiltro}
            onChange={(event) =>
              onStatusFiltroChange(event.target.value as StatusFiltro)
            }
            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-700"
          >
            <option value="todos">Todos</option>
            <option value="A">Abertos</option>
            <option value="B">Fechados</option>
            <option value="C">Cancelados</option>
          </select>
        </label>

        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Ordenar por
          <select
            value={colunaOrdenacao}
            onChange={(event) =>
              onColunaOrdenacaoChange(event.target.value as ColunaOrdenacao)
            }
            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-700"
          >
            <option value="numero_orcamento">Orçamento</option>
            <option value="data_emissao">Data de emissão</option>
            <option value="pedido_venda">Pedido de venda</option>
            <option value="data_fechamento">Data de fechamento</option>
          </select>
        </label>

        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Direção
          <select
            value={direcaoOrdenacao}
            onChange={(event) =>
              onDirecaoOrdenacaoChange(event.target.value as DirecaoOrdenacao)
            }
            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-700"
          >
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </select>
        </label>
      </div>

      <p className="text-sm text-slate-500" role="status">
        Exibindo <strong className="text-slate-800">{totalExibidos}</strong> de{' '}
        <strong className="text-slate-800">{total}</strong> orçamento(s).
      </p>
    </div>
  );
}
