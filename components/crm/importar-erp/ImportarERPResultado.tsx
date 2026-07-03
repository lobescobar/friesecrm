import { ResultadoImportacaoERP } from '../../../types/importacaoERP';

type ImportarERPResultadoProps = {
  resultado: ResultadoImportacaoERP | null;
};

export default function ImportarERPResultado({
  resultado
}: ImportarERPResultadoProps) {
  if (!resultado) {
    return null;
  }

  return (
    <div
      role="status"
      className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
    >
      <h3 className="mb-2 font-bold">Resultado final</h3>
      <p>Inseridos: {resultado.inseridos}</p>
      <p>Atualizados: {resultado.atualizados}</p>
      <p>Ignorados com erro: {resultado.ignoradosComErro}</p>

      {resultado.primeiraMensagemErro ? (
        <p className="mt-2">
          Primeiro erro: {resultado.primeiraMensagemErro}
        </p>
      ) : null}
    </div>
  );
}
