import Button from '../../ui/Button';
import type {
  ColunaOrdenacao,
  DirecaoOrdenacao,
  HistoricoOrcamentoAgrupado
} from '../../../types/historico';
import {
  formatarData,
  obterAriaSort,
  obterClasseStatusOrcamento,
  obterDescricaoStatusOrcamento,
  obterIconeOrdenacao
} from '../../../utils/historicoOrcamentos';

type TabelaHistoricoOrcamentosProps = {
  historico: HistoricoOrcamentoAgrupado[];
  colunaOrdenacao: ColunaOrdenacao;
  direcaoOrdenacao: DirecaoOrdenacao;
  orcamentoFocoInicial?: string | null;
  onOrdenar: (coluna: ColunaOrdenacao) => void;
  onAbrirDetalhes: (item: HistoricoOrcamentoAgrupado) => void;
  onAbrirHistoricoManual: (item: HistoricoOrcamentoAgrupado) => void;
};

const colunasOrdenaveis: Array<{
  coluna: ColunaOrdenacao;
  rotulo: string;
}> = [
  { coluna: 'numero_orcamento', rotulo: 'Orçamento' },
  { coluna: 'data_emissao', rotulo: 'Emissão' },
  { coluna: 'pedido_venda', rotulo: 'Pedido' },
  { coluna: 'data_fechamento', rotulo: 'Fechamento' }
];

export default function TabelaHistoricoOrcamentos({
  historico,
  colunaOrdenacao,
  direcaoOrdenacao,
  orcamentoFocoInicial,
  onOrdenar,
  onAbrirDetalhes,
  onAbrirHistoricoManual
}: TabelaHistoricoOrcamentosProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <caption className="sr-only">
            Histórico de orçamentos do cliente agrupado por número principal.
          </caption>

          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {colunasOrdenaveis.map(({ coluna, rotulo }) => (
                <th
                  key={coluna}
                  scope="col"
                  aria-sort={obterAriaSort(
                    colunaOrdenacao,
                    direcaoOrdenacao,
                    coluna
                  )}
                  className="px-4 py-3 text-left"
                >
                  <button
                    type="button"
                    onClick={() => onOrdenar(coluna)}
                    className="inline-flex items-center gap-1 whitespace-nowrap font-bold leading-none"
                    aria-label={`Ordenar histórico por ${rotulo}`}
                  >
                    {rotulo}{' '}
                    {obterIconeOrdenacao(
                      colunaOrdenacao,
                      direcaoOrdenacao,
                      coluna
                    )}
                  </button>
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-left">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {historico.map((item) => {
              const destacado = orcamentoFocoInicial === item.numero_orcamento;

              return (
                <tr
                  key={item.chave}
                  className={destacado ? 'bg-blue-50' : 'hover:bg-slate-50'}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onAbrirDetalhes(item)}
                      className="font-semibold text-blue-700 underline-offset-4 hover:underline"
                      aria-label={`Abrir itens do orçamento ${item.numero_orcamento}`}
                    >
                      {item.numero_orcamento}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatarData(item.data_emissao)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.pedido_venda || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatarData(item.data_fechamento)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-bold ${obterClasseStatusOrcamento(
                        item
                      )}`}
                    >
                      {obterDescricaoStatusOrcamento(item)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="h-[30px] min-h-[30px] px-[10px] py-0 text-sm leading-none"
                      onClick={() => onAbrirHistoricoManual(item)}
                      aria-label={`Abrir histórico do orçamento ${item.numero_orcamento}`}
                    >
                      Histórico
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {historico.map((item) => {
          const destacado = orcamentoFocoInicial === item.numero_orcamento;

          return (
            <div
              key={item.chave}
              className={`block w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                destacado
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Orçamento
                  </p>
                  <button
                    type="button"
                    onClick={() => onAbrirDetalhes(item)}
                    className="text-base font-bold text-blue-700 underline-offset-4 hover:underline"
                    aria-label={`Abrir itens do orçamento ${item.numero_orcamento}`}
                  >
                    {item.numero_orcamento}
                  </button>
                </div>

                <span
                  className={`rounded-full border px-2 py-1 text-xs font-bold ${obterClasseStatusOrcamento(
                    item
                  )}`}
                >
                  {obterDescricaoStatusOrcamento(item)}
                </span>
              </div>

              {item.cancelamento_solicitado ? (
                <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
                  Cancelamento solicitado
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Emissão
                  </p>
                  <p className="font-medium text-slate-700">
                    {formatarData(item.data_emissao)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Pedido de venda
                  </p>
                  <p className="font-medium text-slate-700">
                    {item.pedido_venda || '-'}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Data de fechamento
                  </p>
                  <p className="font-medium text-slate-700">
                    {formatarData(item.data_fechamento)}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="h-[30px] min-h-[30px] px-[10px] py-0 text-sm leading-none"
                  fullWidth
                  onClick={() => onAbrirHistoricoManual(item)}
                  aria-label={`Abrir histórico do orçamento ${item.numero_orcamento}`}
                >
                  Histórico
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
