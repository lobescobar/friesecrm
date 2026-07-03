type ImportarERPArquivoInfoProps = {
  arquivoNome: string;
};

export default function ImportarERPArquivoInfo({
  arquivoNome
}: ImportarERPArquivoInfoProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">
        Arquivo: {arquivoNome || 'nenhum arquivo selecionado'}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Mapeamento respeitado: D = razão social, E = nome fantasia, AF = CNPJ,
        EK = segmento. Segmentos vazios em EK não alteram segmentos já existentes.
      </p>
    </div>
  );
}
