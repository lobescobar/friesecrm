'use client';

import { useMemo } from 'react';
import { useHistoricoCliente } from '../../hooks/useHistoricoCliente';
import { HistoricoOrcamento } from '../../types';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

type HistoricoClienteProps = {
  clienteId: string;
  aberto: boolean;
};

function formatarData(data?: string | null) {
  if (!data) return '-';

  const partes = data.split('-');

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return data;
}

function obterClasseStatus(status: HistoricoOrcamento['status']) {
  if (status === 'A') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  if (status === 'B') {
    return 'border-green-200 bg-green-50 text-green-700';
  }

  return 'border-red-200 bg-red-50 text-red-700';
}

function obterDescricaoStatus(status: HistoricoOrcamento['status']) {
  if (status === 'A') return 'Aberto';
  if (status === 'B') return 'Fechado';
  return 'Cancelado';
}

export default function HistoricoCliente({
  clienteId,
  aberto
}: HistoricoClienteProps) {
  const { historico, loading, error, carregarHistorico } = useHistoricoCliente(
    clienteId,
    aberto
  );

  const resumo = useMemo(() => {
    return {
      total: historico.length,
      abertos: historico.filter((item) => item.status === 'A').length,
      fechados: historico.filter((item) => item.status === 'B').length,
      cancelados: historico.filter((item) => item.status === 'C').length
    };
  }, [historico]);

  if (!aberto) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Histórico do Cliente
          </h4>
          <p className="mt-1 text-sm text-slate-500">
            Orçamentos dos últimos 36 meses vinculados ao cliente.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={carregarHistorico}
          disabled={loading}
        >
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <LoadingSpinner label="Carregando histórico do cliente..." />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Erro ao carregar histórico.</strong>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {!loading && !error && historico.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          Ainda não há orçamentos importados para este cliente nos últimos 36
          meses.
        </div>
      ) : null}

      {!loading && !error && historico.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {resumo.total}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase text-blue-500">
                Abertos
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-700">
                {resumo.abertos}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-xs font-semibold uppercase text-green-500">
                Fechados
              </p>
              <p className="mt-1 text-2xl font-bold text-green-700">
                {resumo.fechados}
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase text-red-500">
                Cancelados
              </p>
              <p className="mt-1 text-2xl font-bold text-red-700">
                {resumo.cancelados}
              </p>
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Data emissão</th>
                  <th className="px-4 py-3 text-left">Orçamento</th>
                  <th className="px-4 py-3 text-left">Pedido venda</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {historico.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {formatarData(item.data_emissao)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.numero_it_completo}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.pedido_venda || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-bold ${obterClasseStatus(
                          item.status
                        )}`}
                      >
                        {obterDescricaoStatus(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {historico.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Orçamento
                    </p>
                    <p className="text-base font-bold text-slate-900">
                      {item.numero_it_completo}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-bold ${obterClasseStatus(
                      item.status
                    )}`}
                  >
                    {obterDescricaoStatus(item.status)}
                  </span>
                </div>

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
                      Pedido venda
                    </p>
                    <p className="font-medium text-slate-700">
                      {item.pedido_venda || '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
