'use client';

import { Cliente } from '../../../types';
import { MESES_STATUS_CLIENTE_ATIVO } from '../../../utils/constants';
import { formatarCnpj } from '../../../utils/formatters';
import BadgeStatus from '../../ui/BadgeStatus';

type ClienteDadosProps = {
  cliente: Cliente;
  status: string;
  enderecoCompleto: string;
};

function LinhaDados({
  label,
  value
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || '-'}
      </dd>
    </div>
  );
}

export default function ClienteDados({
  cliente,
  status,
  enderecoCompleto
}: ClienteDadosProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 border-b border-slate-100 pb-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">
          Dados cadastrais
        </h4>
        <p className="mt-1 text-sm text-slate-500">
          Informações cadastrais vindas do ERP. O status é calculado pelo
          último orçamento do cliente.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LinhaDados label="Código do cliente" value={cliente.codigo_cliente} />
        <LinhaDados label="Razão Social" value={cliente.razao_social} />
        <LinhaDados label="Nome Fantasia" value={cliente.nome_fantasia} />
        <LinhaDados label="CNPJ" value={formatarCnpj(cliente.cnpj)} />
        <LinhaDados label="Segmento" value={cliente.segmento} />
        <LinhaDados label="Cidade" value={cliente.cidade} />
        <LinhaDados label="UF" value={cliente.estado} />
        <LinhaDados label="Endereço" value={enderecoCompleto} />

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 md:col-span-2">
          <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Status
          </dt>
          <dd className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <BadgeStatus status={status} />
            <span className="text-xs text-slate-500">
              Ativo se houver orçamento emitido nos últimos{' '}
              {MESES_STATUS_CLIENTE_ATIVO} meses. Sem histórico recente:
              Inativo.
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
