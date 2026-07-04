import { ResumoOrcamentos } from '../../../types/importacaoOrcamentos';

type ImportarOrcamentosResumoProps = {
  resumo: ResumoOrcamentos;
};

export default function ImportarOrcamentosResumo({
  resumo
}: ImportarOrcamentosResumoProps) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5"
      aria-labelledby="importar-orcamentos-resumo-titulo"
    >
      <h3
        id="importar-orcamentos-resumo-titulo"
        className="text-sm font-bold uppercase tracking-widest text-slate-500"
      >
        Resumo da leitura
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <ResumoItem label="Linhas lidas" valor={resumo.totalLinhasLidas} />
        <ResumoItem label="Itens válidos" valor={resumo.validosParaImportar} />
        <ResumoItem label="Orçamentos" valor={resumo.orcamentosUnicos} />
        <ResumoItem label="Abertos" valor={resumo.abertos} />
        <ResumoItem label="Fechados" valor={resumo.fechados} />
        <ResumoItem label="Cancelados" valor={resumo.cancelados} />
        <ResumoItem label="Fora do período" valor={resumo.foraHistoricoMeses} />
        <ResumoItem label="Sem cliente" valor={resumo.semClienteEncontrado} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
        <p>Cabeçalhos repetidos ignorados: {resumo.cabecalhosIgnorados}</p>
        <p>Status D desconsiderado: {resumo.statusDDesconsiderado}</p>
        <p>Status inválido: {resumo.statusInvalido}</p>
        <p>Datas inválidas: {resumo.dataInvalida}</p>
        <p>Sem número do orçamento/item: {resumo.semNumeroIt}</p>
        <p>Sem código do cliente: {resumo.semCodigoCliente}</p>
        <p>Duplicados internos: {resumo.duplicadosInternos}</p>
      </div>
    </section>
  );
}

function ResumoItem({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}
