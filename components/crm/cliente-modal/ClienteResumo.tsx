'use client';

import { Cliente } from '../../../types';
import { STATUS_OPTIONS } from '../../../utils/constants';
import { formatarCnpj, formatarTelefone } from '../../../utils/formatters';
import BadgeStatus from '../../ui/BadgeStatus';
import { ClienteModalSecao } from './ClienteModalNav';

type ClienteResumoProps = {
  cliente: Cliente;
  status: string;
  enderecoCompleto: string;
  whatsappEmpresa: string;
  onStatusChange: (status: string) => void;
  onAbrirSecao: (secao: ClienteModalSecao) => void;
};

function InfoCard({
  label,
  value
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || '-'}
      </p>
    </div>
  );
}

export default function ClienteResumo({
  cliente,
  status,
  enderecoCompleto,
  whatsappEmpresa,
  onStatusChange,
  onAbrirSecao
}: ClienteResumoProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Resumo do cliente
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              Visão rápida para consulta e direcionamento.
            </p>
          </div>

          <BadgeStatus status={status} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Status
            </label>
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
            >
              {STATUS_OPTIONS.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </div>

          <InfoCard label="CNPJ" value={formatarCnpj(cliente.cnpj)} />
          <InfoCard label="Segmento" value={cliente.segmento} />
          <InfoCard
            label="Cidade / UF"
            value={[cliente.cidade, cliente.estado].filter(Boolean).join(' / ')}
          />
          <InfoCard
            label="Telefone"
            value={formatarTelefone(cliente.telefone)}
          />
          <InfoCard label="Endereço" value={enderecoCompleto} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {whatsappEmpresa ? (
          <a
            href={whatsappEmpresa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            WhatsApp Empresa
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-2xl bg-slate-200 py-3 text-sm font-bold text-slate-500"
          >
            Sem telefone
          </button>
        )}

        <button
          type="button"
          onClick={() => onAbrirSecao('mapa')}
          className="rounded-2xl border border-amber-200 bg-amber-50 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
        >
          Ver localização
        </button>

        <button
          type="button"
          onClick={() => onAbrirSecao('historico')}
          className="rounded-2xl border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Histórico do Cliente
        </button>
      </div>
    </section>
  );
}
