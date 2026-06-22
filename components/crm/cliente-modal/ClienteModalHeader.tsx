'use client';

import { Cliente } from '../../../types';
import { formatarTelefone } from '../../../utils/formatters';
import BadgeStatus from '../../ui/BadgeStatus';

type ClienteModalHeaderProps = {
  cliente: Cliente;
  status: string;
  enderecoCompleto: string;
  whatsappEmpresa: string;
};

export default function ClienteModalHeader({
  cliente,
  status,
  enderecoCompleto,
  whatsappEmpresa
}: ClienteModalHeaderProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <BadgeStatus status={status} />

            {cliente.segmento ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                {cliente.segmento}
              </span>
            ) : null}

            {cliente.estado ? (
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-xs font-semibold text-amber-100">
                {cliente.estado}
              </span>
            ) : null}
          </div>

          <h3 className="text-2xl font-black leading-tight tracking-tight">
            {cliente.empresa}
          </h3>

          <p className="mt-2 text-sm text-slate-300">
            {[cliente.codigo_cliente ? `Cliente ${cliente.codigo_cliente}` : '', enderecoCompleto]
              .filter(Boolean)
              .join(' • ') || 'Cliente sem endereço cadastrado'}
          </p>

          {cliente.telefone ? (
            <p className="mt-2 text-sm text-slate-300">
              Telefone: {formatarTelefone(cliente.telefone)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          {whatsappEmpresa ? (
            <a
              href={whatsappEmpresa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              WhatsApp Empresa
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-slate-300"
            >
              Sem telefone
            </button>
          )}

          {enderecoCompleto ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                enderecoCompleto
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-300"
            >
              Ver no Mapa
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-slate-300"
            >
              Sem endereço
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
