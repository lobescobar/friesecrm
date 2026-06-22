'use client';

import { useState } from 'react';
import {
  OrcamentoAbertoResumo,
  useOrcamentosAbertos
} from '../../hooks/useOrcamentosAbertos';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

type AlertaOrcamentosAbertosProps = {
  refreshKey?: number;
  onSelecionarOrcamento?: (orcamento: OrcamentoAbertoResumo) => void;
};

function formatarData(data?: string | null) {
  if (!data) return '-';

  const partes = data.split('-');

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return data;
}

export default function AlertaOrcamentosAbertos({
  refreshKey = 0,
  onSelecionarOrcamento
}: AlertaOrcamentosAbertosProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const { orcamentos, loading, error, carregarOrcamentosAbertos } =
    useOrcamentosAbertos(refreshKey);

  const selecionarOrcamento = (orcamento: OrcamentoAbertoResumo) => {
    setModalAberto(false);
    onSelecionarOrcamento?.(orcamento);
  };

  if (loading && orcamentos.length === 0) {
    return null;
  }

  if (error) {
    return (
      <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <strong>Não foi possível verificar orçamentos em aberto.</strong>
            <p className="mt-1">{error}</p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={carregarOrcamentosAbertos}
          >
            Tentar novamente
          </Button>
        </div>
      </section>
    );
  }

  if (orcamentos.length === 0) {
    return null;
  }

  return (
    <>
      <section className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-bold text-blue-900">
              Existem {orcamentos.length} orçamentos em aberto.
            </h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={carregarOrcamentosAbertos}
              disabled={loading}
            >
              Atualizar
            </Button>

            <Button type="button" onClick={() => setModalAberto(true)}>
              Visualizar abertos
            </Button>
          </div>
        </div>
      </section>

      {modalAberto ? (
        <Modal
          title="Orçamentos em aberto"
          subtitle="Clique em um orçamento para abrir o histórico do cliente"
          onClose={() => setModalAberto(false)}
          footer={
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalAberto(false)}
              >
                Fechar
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              Existem <strong>{orcamentos.length}</strong> orçamentos em aberto.
              A lista abaixo usa o número principal do orçamento, sem discriminar
              item por item.
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Nº Cliente</th>
                    <th className="px-4 py-3 text-left">Nome</th>
                    <th className="px-4 py-3 text-left">Nº Orçamento</th>
                    <th className="px-4 py-3 text-left">Data de emissão</th>
                    <th className="px-4 py-3 text-left">Ação</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {orcamentos.map((orcamento) => (
                    <LinhaOrcamentoAberto
                      key={orcamento.chave}
                      orcamento={orcamento}
                      onSelecionar={selecionarOrcamento}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {orcamentos.map((orcamento) => (
                <button
                  key={orcamento.chave}
                  type="button"
                  onClick={() => selecionarOrcamento(orcamento)}
                  className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Nº Cliente
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {orcamento.codigo_cliente_loja}
                  </p>

                  <p className="mt-3 text-xs font-bold uppercase text-slate-400">
                    Nome
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {orcamento.nome_cliente}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Orçamento
                      </p>
                      <p className="font-semibold text-slate-800">
                        {orcamento.numero_orcamento}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Emissão
                      </p>
                      <p className="font-semibold text-slate-800">
                        {formatarData(orcamento.data_emissao)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm font-bold text-blue-700">
                    Abrir histórico do cliente
                  </p>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function LinhaOrcamentoAberto({
  orcamento,
  onSelecionar
}: {
  orcamento: OrcamentoAbertoResumo;
  onSelecionar: (orcamento: OrcamentoAbertoResumo) => void;
}) {
  return (
    <tr className="hover:bg-blue-50">
      <td className="px-4 py-3 font-semibold text-slate-800">
        {orcamento.codigo_cliente_loja}
      </td>
      <td className="px-4 py-3 text-slate-700">{orcamento.nome_cliente}</td>
      <td className="px-4 py-3 font-semibold text-slate-900">
        {orcamento.numero_orcamento}
      </td>
      <td className="px-4 py-3 text-slate-700">
        {formatarData(orcamento.data_emissao)}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onSelecionar(orcamento)}
          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
        >
          Abrir histórico
        </button>
      </td>
    </tr>
  );
}
