import { Cliente } from '../../types';
import BadgeStatus from '../ui/BadgeStatus';
import Button from '../ui/Button';

type ClienteCardMobileProps = {
  cliente: Cliente;
  onSelecionar: (cliente: Cliente) => void;
};

export default function ClienteCardMobile({
  cliente,
  onSelecionar
}: ClienteCardMobileProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">{cliente.empresa}</p>
          <p className="mt-1 text-xs text-slate-500">
            Cód. ERP: {cliente.codigo_cliente || '-'}
          </p>
        </div>
        <BadgeStatus status={cliente.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[10px] font-bold uppercase text-slate-400">
            Segmento
          </dt>
          <dd className="font-medium text-slate-700">{cliente.segmento || '-'}</dd>
        </div>

        <div>
          <dt className="text-[10px] font-bold uppercase text-slate-400">
            Cidade/UF
          </dt>
          <dd className="font-medium text-slate-700">
            {[cliente.cidade, cliente.estado].filter(Boolean).join(' - ') || '-'}
          </dd>
        </div>
      </dl>

      <Button
        type="button"
        variant="secondary"
        className="mt-4 w-full"
        onClick={() => onSelecionar(cliente)}
      >
        Ver detalhes
      </Button>
    </article>
  );
}
