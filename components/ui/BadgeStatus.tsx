import { STATUS_COLORS, StatusType } from '../../utils/constants';

type BadgeStatusProps = {
  status?: string | null;
  comprouUltimos12Meses?: boolean | null;
};

function normalizarStatusCliente(status?: string | null): StatusType {
  return status === 'Ativo' || status === 'Inativo' ? status : 'Inativo';
}

export default function BadgeStatus({
  status,
  comprouUltimos12Meses
}: BadgeStatusProps) {
  const nome = normalizarStatusCliente(status);
  const ativoSemCompraRecente =
    nome === 'Ativo' && comprouUltimos12Meses === false;
  const classes = ativoSemCompraRecente
    ? 'border-amber-300 bg-amber-50 text-amber-700'
    : STATUS_COLORS[nome].classes;
  const descricao = ativoSemCompraRecente
    ? 'Ativo: orçou nos últimos 18 meses e não comprou nos últimos 12 meses.'
    : nome === 'Ativo'
      ? 'Ativo: orçou nos últimos 18 meses e comprou nos últimos 12 meses.'
      : 'Inativo: não orçou nos últimos 18 meses.';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${classes}`}
      title={descricao}
    >
      {nome}
    </span>
  );
}
