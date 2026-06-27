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
    <article className="crm-card rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-extrabold text-slate-950">{cliente.empresa}</p>
          <p className="mt-1 text-xs text-slate-500">
            Cód. ERP: {cliente.codigo_cliente || '-'}
          </p>
        </div>
        <BadgeStatus status={cliente.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="crm-label">
            Segmento
          </dt>
          <dd className="font-medium text-slate-700">{cliente.segmento || '-'}</dd>
        </div>

        <div>
          <dt className="crm-label">
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
