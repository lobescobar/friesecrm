import { HistoricoImportacao } from '../../../types/importacaoOrcamentos';
import { formatarData } from '../../../utils/importacaoOrcamentos';

type ImportarOrcamentosPreviaProps = {
  preview: HistoricoImportacao[];
};

export default function ImportarOrcamentosPrevia({
  preview
}: ImportarOrcamentosPreviaProps) {
  if (!preview.length) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5"
      aria-labelledby="importar-orcamentos-previa-titulo"
    >
      <h3
        id="importar-orcamentos-previa-titulo"
        className="text-sm font-bold uppercase tracking-widest text-slate-500"
      >
        Prévia dos primeiros registros válidos
      </h3>

      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <caption className="sr-only">
            Prévia dos primeiros registros válidos da importação de orçamentos.
          </caption>

          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">Cliente</th>
              <th scope="col" className="px-4 py-3 text-left">Data emissão</th>
              <th scope="col" className="px-4 py-3 text-left">Data fechamento</th>
              <th scope="col" className="px-4 py-3 text-left">Orçamento</th>
              <th scope="col" className="px-4 py-3 text-left">Pedido venda</th>
              <th scope="col" className="px-4 py-3 text-left">Quantidade</th>
              <th scope="col" className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {preview.map((item) => (
              <tr key={`${item.codigo_cliente_loja}-${item.numero_it_completo}`}>
                <td className="px-4 py-3 text-slate-700">
                  {item.codigo_cliente_loja}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatarData(item.data_emissao)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatarData(item.data_fechamento)}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.numero_orcamento}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {item.pedido_venda || '-'}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {item.quantidade_item ?? '-'}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {item.status_descricao}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {preview.map((item) => (
          <div
            key={`${item.codigo_cliente_loja}-${item.numero_it_completo}`}
            className="rounded-2xl border border-slate-200 p-4"
          >
            <p className="text-xs font-semibold uppercase text-slate-400">
              {item.codigo_cliente_loja}
            </p>
            <p className="text-base font-bold text-slate-900">
              Orçamento {item.numero_orcamento}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Pedido venda: {item.pedido_venda || '-'}
            </p>
            <p className="text-sm text-slate-600">
              Emissão: {formatarData(item.data_emissao)}
            </p>
            <p className="text-sm text-slate-600">
              Fechamento: {formatarData(item.data_fechamento)}
            </p>
            <p className="text-sm text-slate-600">
              Quantidade: {item.quantidade_item ?? '-'}
            </p>
            <p className="text-sm text-slate-600">
              Status: {item.status_descricao}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
