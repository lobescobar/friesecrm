import { ChangeEvent, RefObject } from 'react';
import { MESES_HISTORICO_ORCAMENTOS, MESES_STATUS_CLIENTE_ATIVO } from '../../../utils/constants';
import Button from '../../ui/Button';

type ImportarOrcamentosSelecionarPlanilhaProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  processando: boolean;
  importando: boolean;
  onSelecionarArquivo: (event: ChangeEvent<HTMLInputElement>) => void;
  onLimpar: () => void;
};

export default function ImportarOrcamentosSelecionarPlanilha({
  inputRef,
  processando,
  importando,
  onSelecionarArquivo,
  onLimpar
}: ImportarOrcamentosSelecionarPlanilhaProps) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
      aria-labelledby="importar-orcamentos-planilha-titulo"
    >
      <h3
        id="importar-orcamentos-planilha-titulo"
        className="text-base font-bold text-slate-900"
      >
        Selecionar planilha
      </h3>

      <p className="mt-1 text-sm text-slate-600">
        Use a planilha Relatório de Orçamentos CRM. O sistema vai considerar
        somente status A, B e C, ignorar status D, manter apenas dados dos
        últimos {MESES_HISTORICO_ORCAMENTOS} meses pela data de emissão e
        importar a data de fechamento quando houver, guardar a descrição e a
        quantidade do item. Após a importação, o status dos clientes será
        recalculado: Ativo com orçamento nos últimos{' '}
        {MESES_STATUS_CLIENTE_ATIVO} meses; sem histórico recente, Inativo.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="block w-full text-sm font-semibold text-slate-700">
          Arquivo de orçamentos
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={onSelecionarArquivo}
            disabled={processando || importando}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>

        <Button
          type="button"
          variant="secondary"
          onClick={onLimpar}
          disabled={processando || importando}
          className="sm:mt-6"
        >
          Limpar
        </Button>
      </div>
    </section>
  );
}
