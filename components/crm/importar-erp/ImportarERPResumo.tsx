import { ResumoImportacaoERP } from '../../../types/importacaoERP';

type ImportarERPResumoProps = {
  resumo: ResumoImportacaoERP;
};

export default function ImportarERPResumo({ resumo }: ImportarERPResumoProps) {
  return (
    <section
      aria-labelledby="importar-erp-resumo"
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <h3 id="importar-erp-resumo" className="mb-3 text-sm font-bold text-slate-900">
        Resumo antes de importar
      </h3>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Total de linhas lidas</dt>
          <dd className="font-bold">{resumo.totalLinhas}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Registros válidos</dt>
          <dd className="font-bold">{resumo.validos}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Inserções previstas</dt>
          <dd className="font-bold">{resumo.inseridosPrevistos}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Atualizações previstas</dt>
          <dd className="font-bold">{resumo.atualizadosPrevistos}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Sem código ERP</dt>
          <dd className="font-bold">{resumo.ignoradosSemCodigo}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Duplicados internos</dt>
          <dd className="font-bold">{resumo.ignoradosDuplicados}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Sem CNPJ</dt>
          <dd className="font-bold">{resumo.semCnpj}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Segmentos reconhecidos</dt>
          <dd className="font-bold">{resumo.segmentosReconhecidos}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Segmentos vazios desconsiderados</dt>
          <dd className="font-bold">{resumo.segmentosVazios}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Segmentos fora do padrão</dt>
          <dd className="font-bold">{resumo.segmentosNaoReconhecidos}</dd>
        </div>
      </dl>
    </section>
  );
}
