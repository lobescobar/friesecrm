type ImportarOrcamentosMensagensProps = {
  processando: boolean;
  erro: string | null;
  mensagem: string | null;
};

export default function ImportarOrcamentosMensagens({
  processando,
  erro,
  mensagem
}: ImportarOrcamentosMensagensProps) {
  return (
    <>
      {processando ? (
        <div
          className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700"
          role="status"
          aria-live="polite"
        >
          Lendo e validando a planilha. Aguarde...
        </div>
      ) : null}

      {erro ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          <strong>Erro:</strong> {erro}
        </div>
      ) : null}

      {mensagem ? (
        <div
          className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          role="status"
          aria-live="polite"
        >
          {mensagem}
        </div>
      ) : null}
    </>
  );
}
