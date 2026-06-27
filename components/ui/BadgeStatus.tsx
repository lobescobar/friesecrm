import { STATUS_COLORS, StatusType } from '../../utils/constants';

type BadgeStatusProps = {
  status?: string | null;
};

function normalizarStatusCliente(status?: string | null): StatusType {
  return status === 'Ativo' || status === 'Inativo' ? status : 'Inativo';
}

export default function BadgeStatus({ status }: BadgeStatusProps) {
  const nome = normalizarStatusCliente(status);
  const classes = STATUS_COLORS[nome].classes;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${classes}`}
    >
      {nome}
    </span>
  );
}
