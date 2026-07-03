import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import type { HistoricoOrcamentoAgrupado } from '../../../types/historico';
import {
  formatarData,
  formatarQuantidade,
  obterClasseStatus,
  ordenarItensOrcamento
} from '../../../utils/historicoOrcamentos';

type ModalItensOrcamentoProps = {
  clienteId: string;
  orcamento: HistoricoOrcamentoAgrupado;
  onClose: () => void;
  onSolicitarCancelamento: (orcamento: HistoricoOrcamentoAgrupado) => void;
};

export default function ModalItensOrcamento({
  clienteId,
  orcamento,
  onClose,
  onSolicitarCancelamento
}: ModalItensOrcamentoProps) {
  const itensOrdenados = ordenarItensOrcamento(orcamento.itens);

  return (
    <Modal
      title={`Orçamento ${orcamento.numero_orcamento}`}
      subtitle="Itens, descrições e quantidades importados da planilha"
      onClose={onClose}
      scrollKey={`orcamento:${clienteId}:${orcamento.numero_orcamento}`}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {orcamento.status === 'A' ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                onClose();
                onSolicitarCancelamento(orcamento);
              }}
            >
              Solicitar cancelamento
            </Button>
          ) : null}

          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Emissão
            </p>
            <p className="font-semibold text-slate-800">
              {formatarData(orcamento.data_emissao)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Pedido venda
            </p>
            <p className="font-semibold text-slate-800">
              {orcamento.pedido_venda || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Fechamento
            </p>
            <p className="font-semibold text-slate-800">
              {formatarData(orcamento.data_fechamento)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Status
            </p>
            <span
              className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-bold ${obterClasseStatus(
                orcamento.status
              )}`}
            >
              {orcamento.status_descricao}
            </span>
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <caption className="sr-only">
              Itens importados do orçamento {orcamento.numero_orcamento}.
            </caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">
                  Número item
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  Descrição
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  Quantidade
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {itensOrdenados.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="w-44 px-4 py-3 font-semibold text-slate-800">
                    {item.numero_it_completo}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.descricao_item || '-'}
                  </td>
                  <td className="w-36 px-4 py-3 text-slate-700">
                    {formatarQuantidade(item.quantidade_item)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {itensOrdenados.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <p className="text-xs font-bold uppercase text-slate-400">
                Número item
              </p>
              <p className="font-semibold text-slate-900">
                {item.numero_it_completo}
              </p>

              <p className="mt-3 text-xs font-bold uppercase text-slate-400">
                Descrição
              </p>
              <p className="text-sm text-slate-700">
                {item.descricao_item || '-'}
              </p>

              <p className="mt-3 text-xs font-bold uppercase text-slate-400">
                Quantidade
              </p>
              <p className="text-sm font-semibold text-slate-700">
                {formatarQuantidade(item.quantidade_item)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
