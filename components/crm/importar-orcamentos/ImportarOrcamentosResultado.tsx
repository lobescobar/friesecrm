import { MESES_STATUS_CLIENTE_ATIVO } from '../../../utils/constants';
import { ResultadoImportacao } from '../../../types/importacaoOrcamentos';

type ImportarOrcamentosResultadoProps = {
  resultado: ResultadoImportacao | null;
};

export default function ImportarOrcamentosResultado({
  resultado
}: ImportarOrcamentosResultadoProps) {
  if (!resultado) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-700"
      role="status"
      aria-live="polite"
    >
      <h3 className="font-bold">Importação concluída</h3>
      <p className="mt-1">
        {resultado.enviados} registros enviados para o histórico em{' '}
        {resultado.lotes} lote(s).
      </p>
      <p className="mt-1">
        {resultado.clientesAtivos.toLocaleString('pt-BR')} cliente(s)
        marcado(s) como Ativo(s) por orçamento nos últimos{' '}
        {MESES_STATUS_CLIENTE_ATIVO} meses. Os demais ficam Inativos.
      </p>
    </section>
  );
}
