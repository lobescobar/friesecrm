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
    <div className="border-b border-slate-200 bg-white px-5 py-5">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="crm-section-title text-lg">Clientes</h2>
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
          <span className="crm-label">
            Buscar cliente
          </span>
          <input
            type="text"
            value={buscaEmpresa}
            onChange={(event) => setBuscaEmpresa(event.target.value)}
            className="crm-field rounded-xl px-3 py-2 text-sm"
            placeholder="Nome, fantasia, CNPJ, cidade..."
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="crm-label">
            Cód. ERP
          </span>
          <input
            type="text"
            value={buscaCodigo}
            onChange={(event) => setBuscaCodigo(event.target.value)}
            className="crm-field rounded-xl px-3 py-2 text-sm"
            placeholder="Ex.: 000123-01"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="crm-label">
            Segmento
          </span>
          <select
            value={filtroSegmento}
            onChange={(event) => setFiltroSegmento(event.target.value)}
            className="crm-field rounded-xl px-3 py-2 text-sm"
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
          <span className="crm-label">
            Estado
          </span>
          <select
            value={filtroEstado}
            onChange={(event) => setFiltroEstado(event.target.value)}
            className="crm-field rounded-xl px-3 py-2 text-sm"
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
          <span className="crm-label">
            Status
          </span>
          <select
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value)}
            className="crm-field rounded-xl px-3 py-2 text-sm"
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
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600"
            >
              {filtro}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
