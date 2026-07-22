import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import type { HistoricoOrcamentoAgrupado } from '../../../types/historico';

type ModalCancelamentoOrcamentoProps = {
  clienteId: string;
  orcamento: HistoricoOrcamentoAgrupado;
  emailCancelamento: string;
  solicitante: string;
  motivo: string;
  erro: string | null;
  enviando: boolean;
  onMotivoChange: (motivo: string) => void;
  onClose: () => void;
  onConfirmar: () => void;
};

export default function ModalCancelamentoOrcamento({
  clienteId,
  orcamento,
  emailCancelamento,
  solicitante,
  motivo,
  erro,
  enviando,
  onMotivoChange,
  onClose,
  onConfirmar
}: ModalCancelamentoOrcamentoProps) {
  return (
    <Modal
      title={`Solicitar cancelamento do orçamento ${orcamento.numero_orcamento}`}
      subtitle="O CRM abrirá um e-mail pronto para envio ao time de vendas."
      onClose={onClose}
      scrollKey={`cancelamento:${clienteId}:${orcamento.numero_orcamento}`}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={enviando}
          >
            Voltar
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={onConfirmar}
            disabled={enviando}
          >
            {enviando ? 'Enviando...' : 'Enviar solicitação'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">
            Esta ação não altera o status do orçamento no CRM nem no ERP.
          </p>
          <p className="mt-1">
            Ela envia automaticamente um e-mail de solicitação para o vendedor
            e para o destino administrativo {emailCancelamento}.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Orçamento
            </p>
            <p className="font-semibold text-slate-900">
              {orcamento.numero_orcamento}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Solicitante
            </p>
            <p className="break-all font-semibold text-slate-900">
              {solicitante}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Status atual
            </p>
            <p className="font-semibold text-blue-700">Aberto</p>
          </div>
        </div>

        <label className="block text-sm font-semibold text-slate-700">
          Motivo do cancelamento
          <textarea
            value={motivo}
            onChange={(event) => onMotivoChange(event.target.value)}
            disabled={enviando}
            rows={5}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-500"
            placeholder="Descreva o motivo do cancelamento..."
          />
        </label>

        {erro ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          >
            {erro}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
