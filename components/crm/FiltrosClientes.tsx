import { Dispatch, SetStateAction } from 'react';
import { SEGMENTOS_CLIENTES, STATUS_OPTIONS } from '../../utils/constants';
import Button from '../ui/Button';

type FiltrosClientesProps = {
  buscaEmpresa: string;
  setBuscaEmpresa: Dispatch<SetStateAction<string>>;
  buscaCodigo: string;
  setBuscaCodigo: Dispatch<SetStateAction<string>>;
  filtroStatus: string;
  setFiltroStatus: Dispatch<SetStateAction<string>>;
  filtroEstado: string;
  setFiltroEstado: Dispatch<SetStateAction<string>>;
  filtroSegmento: string;
  setFiltroSegmento: Dispatch<SetStateAction<string>>;
  estadosUnicos: string[];
  segmentosUnicos: string[];
  filtrosAtivos: string[];
  totalClientes: number;
  totalFiltrado: number;
  onLimparFiltros: () => void;
};

export default function FiltrosClientes({
  buscaEmpresa,
  setBuscaEmpresa,
  buscaCodigo,
  setBuscaCodigo,
  filtroStatus,
  setFiltroStatus,
  filtroEstado,
  setFiltroEstado,
  filtroSegmento,
  setFiltroSegmento,
  estadosUnicos,
  segmentosUnicos,
  filtrosAtivos,
  totalClientes,
  totalFiltrado,
  onLimparFiltros
}: FiltrosClientesProps) {
  const segmentosComClientes = SEGMENTOS_CLIENTES.filter((segmento) =>
    segmentosUnicos.includes(segmento)
  );

  const segmentosParaFiltro = segmentosComClientes.length
    ? segmentosComClientes
    : SEGMENTOS_CLIENTES;

  return (
    <div className="border-b border-slate-200 bg-white px-5 py-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Clientes</h2>
          <p className="text-sm text-slate-500">
            Exibindo {totalFiltrado.toLocaleString('pt-BR')} de{' '}
            {totalClientes.toLocaleString('pt-BR')} clientes.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={onLimparFiltros}
          disabled={filtrosAtivos.length === 0}
        >
          Limpar filtros
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Buscar cliente
          </span>
          <input
            type="text"
            value={buscaEmpresa}
            onChange={(event) => setBuscaEmpresa(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-700 focus:outline-none"
            placeholder="Nome, fantasia, CNPJ, cidade..."
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Cód. ERP
          </span>
          <input
            type="text"
            value={buscaCodigo}
            onChange={(event) => setBuscaCodigo(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-700 focus:outline-none"
            placeholder="Ex.: 000123-01"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Segmento
          </span>
          <select
            value={filtroSegmento}
            onChange={(event) => setFiltroSegmento(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-700 focus:outline-none"
          >
            <option value="Todos">Todos</option>
            {segmentosParaFiltro.map((segmento) => (
              <option key={segmento} value={segmento}>
                {segmento}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Estado
          </span>
          <select
            value={filtroEstado}
            onChange={(event) => setFiltroEstado(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-700 focus:outline-none"
          >
            <option value="Todos">Todos</option>
            {estadosUnicos.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Status
          </span>
          <select
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-700 focus:outline-none"
          >
            <option value="Todos">Todos</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtrosAtivos.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {filtrosAtivos.map((filtro) => (
            <span
              key={filtro}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {filtro}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
