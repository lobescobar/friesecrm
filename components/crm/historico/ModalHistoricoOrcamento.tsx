import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import Modal from '../../ui/Modal';
import type {
  FormularioInteracaoOrcamento,
  HistoricoOrcamentoAgrupado,
  OrcamentoInteracao
} from '../../../types/historico';
import {
  formatarData,
  formatarDataHora,
  obterClasseStatusOrcamento,
  obterDescricaoStatusOrcamento
} from '../../../utils/historicoOrcamentos';

type ModalHistoricoOrcamentoProps = {
  clienteId: string;
  orcamento: HistoricoOrcamentoAgrupado;
  interacoes: OrcamentoInteracao[];
  formulario: FormularioInteracaoOrcamento;
  carregando: boolean;
  salvando: boolean;
  erro: string | null;
  mensagem: string | null;
  onFormularioChange: (formulario: FormularioInteracaoOrcamento) => void;
  onClose: () => void;
  onSalvar: () => void;
};

const ACAO_AUTOMATICA_CANCELAMENTO =
  'Acompanhar retorno da solicitação de cancelamento';

function obterAcaoNecessariaVisivel(interacao: OrcamentoInteracao) {
  const acao = interacao.proximo_passo?.trim() || '';

  if (acao === ACAO_AUTOMATICA_CANCELAMENTO) {
    return null;
  }

  return acao || null;
}

export default function ModalHistoricoOrcamento({
  clienteId,
  orcamento,
  interacoes,
  formulario,
  carregando,
  salvando,
  erro,
  mensagem,
  onFormularioChange,
  onClose,
  onSalvar
}: ModalHistoricoOrcamentoProps) {
  return (
    <Modal
      title={`Histórico do orçamento ${orcamento.numero_orcamento}`}
      subtitle="Registre contatos, observações, ações necessárias e lembretes específicos deste orçamento."
      onClose={onClose}
      scrollKey={`historico-manual:${clienteId}:${orcamento.numero_orcamento}`}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={salvando}
          >
            Fechar
          </Button>

          <Button
            type="button"
            onClick={onSalvar}
            disabled={salvando}
            loading={salvando}
            loadingText="Salvando..."
          >
            Salvar registro
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
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
              Emissão
            </p>
            <p className="font-semibold text-slate-900">
              {formatarData(orcamento.data_emissao)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Status ERP
            </p>
            <span
              className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-bold ${obterClasseStatusOrcamento(
                orcamento
              )}`}
            >
              {obterDescricaoStatusOrcamento(orcamento)}
            </span>
          </div>
        </div>

        {orcamento.cancelamento_solicitado ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-bold">Cancelamento solicitado</p>
            {orcamento.motivo_cancelamento ? (
              <p className="mt-1 whitespace-pre-wrap">
                Motivo: {orcamento.motivo_cancelamento}
              </p>
            ) : null}
          </div>
        ) : null}

        {mensagem ? (
          <div
            role="status"
            className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-medium text-blue-800"
          >
            {mensagem}
          </div>
        ) : null}

        {erro ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          >
            {erro}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h5 className="text-sm font-bold text-slate-900">Novo registro</h5>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
              Observação do orçamento
              <textarea
                value={formulario.observacao}
                onChange={(event) =>
                  onFormularioChange({
                    ...formulario,
                    observacao: event.target.value
                  })
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-500"
                placeholder="Digite o histórico, contato feito, pendência ou informação específica deste orçamento..."
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Ação necessária
              <input
                type="text"
                value={formulario.proximo_passo}
                onChange={(event) =>
                  onFormularioChange({
                    ...formulario,
                    proximo_passo: event.target.value
                  })
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-500"
                placeholder="Ex.: Retornar para o cliente, enviar proposta revisada ou confirmar aprovação"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Lembrete
              <input
                type="date"
                value={formulario.data_retorno}
                onChange={(event) =>
                  onFormularioChange({
                    ...formulario,
                    data_retorno: event.target.value
                  })
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-500"
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h5 className="text-sm font-bold text-slate-900">
            Registros salvos
          </h5>

          {carregando ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <LoadingSpinner label="Carregando registros do orçamento..." />
            </div>
          ) : null}

          {!carregando && interacoes.length === 0 ? (
            <div
              role="status"
              className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600"
            >
              Ainda não há registros manuais para este orçamento.
            </div>
          ) : null}

          {!carregando && interacoes.length > 0 ? (
            <div className="mt-4 space-y-3">
              {interacoes.map((interacao) => {
                const acaoNecessaria =
                  obterAcaoNecessariaVisivel(interacao);

                return (
                  <article
                    key={interacao.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"
                  >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-900">
                        Registro do orçamento
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatarDataHora(interacao.created_at)}
                        {interacao.criado_por_email
                          ? ` por ${interacao.criado_por_email}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-slate-700">
                    {interacao.observacao}
                  </p>

                  {acaoNecessaria || interacao.data_retorno ? (
                    <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
                      {acaoNecessaria ? (
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">
                            Ação necessária
                          </p>
                          <p className="font-medium text-slate-700">
                            {acaoNecessaria}
                          </p>
                        </div>
                      ) : null}

                      {interacao.data_retorno ? (
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">
                            Lembrete
                          </p>
                          <p className="font-medium text-slate-700">
                            {formatarData(interacao.data_retorno)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
