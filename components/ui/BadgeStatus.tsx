import { STATUS_COLORS, StatusType } from '../../utils/constants';

type BadgeStatusProps = {
  status?: string | null;
};

export default function BadgeStatus({ status }: BadgeStatusProps) {
  const nome = (status || 'Novo') as StatusType;
  const classes = STATUS_COLORS[nome]?.classes || STATUS_COLORS.Novo.classes;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${classes}`}
    >
      {status || 'Novo'}
    </span>
  );
}
