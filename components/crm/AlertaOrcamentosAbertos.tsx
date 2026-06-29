'use client';

import { useMemo, useState } from 'react';
import {
  OrcamentoAbertoResumo,
  useOrcamentosAbertos
} from '../../hooks/useOrcamentosAbertos';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

type AlertaOrcamentosAbertosProps = {
  refreshKey?: number;
  mostrarVazio?: boolean;
  onSelecionarOrcamento?: (orcamento: OrcamentoAbertoResumo) => void;
};

type CampoOrdenacaoAbertos =
  | 'data_emissao'
  | 'numero_orcamento'
  | 'codigo_cliente_loja'
  | 'nome_cliente';

type DirecaoOrdenacao = 'asc' | 'desc';

function formatarData(data?: string | null) {
  if (!data) return '-';

  const partes = data.split('-');

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return data;
}

function normalizarTexto(valor?: string | null) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function compararTexto(a?: string | null, b?: string | null) {
  return String(a || '').localeCompare(String(b || ''), 'pt-BR', {
    numeric: true,
    sensitivity: 'base'
  });
}

function compararData(a?: string | null, b?: string | null) {
  const dataA = a ? new Date(`${a}T00:00:00`).getTime() : 0;
  const dataB = b ? new Date(`${b}T00:00:00`).getTime() : 0;

  return dataA - dataB;
}

function ordenarOrcamentosAbertos(
  orcamentos: OrcamentoAbertoResumo[],
  campo: CampoOrdenacaoAbertos,
  direcao: DirecaoOrdenacao
) {
  const multiplicador = direcao === 'asc' ? 1 : -1;

  return [...orcamentos].sort((a, b) => {
    let comparacao = 0;

    if (campo === 'data_emissao') {
      comparacao = compararData(a.data_emissao, b.data_emissao);
    }

    if (campo === 'numero_orcamento') {
      comparacao = compararTexto(a.numero_orcamento, b.numero_orcamento);
    }

    if (campo === 'codigo_cliente_loja') {
      comparacao = compararTexto(
        a.codigo_cliente_loja,
        b.codigo_cliente_loja
      );
    }

    if (campo === 'nome_cliente') {
      comparacao = compararTexto(a.nome_cliente, b.nome_cliente);
    }

    return comparacao * multiplicador;
  });
}

export default function AlertaOrcamentosAbertos({
  refreshKey = 0,
  mostrarVazio = false,
  onSelecionarOrcamento
}: AlertaOrcamentosAbertosProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [ordenarPor, setOrdenarPor] =
    useState<CampoOrdenacaoAbertos>('data_emissao');
  const [direcao, setDirecao] = useState<DirecaoOrdenacao>('desc');

  const { orcamentos, loading, error, carregarOrcamentosAbertos } =
    useOrcamentosAbertos(refreshKey);

  const orcamentosFiltrados = useMemo(() => {
    const termoBusca = normalizarTexto(busca);

    const filtrados = termoBusca
      ? orcamentos.filter((orcamento) => {
          const textoBusca = normalizarTexto(
            [
              orcamento.codigo_cliente_loja,
              orcamento.nome_cliente,
              orcamento.numero_orcamento,
              formatarData(orcamento.data_emissao)
            ].join(' ')
          );

          return textoBusca.includes(termoBusca);
        })
      : orcamentos;

    return ordenarOrcamentosAbertos(filtrados, ordenarPor, direcao);
  }, [busca, direcao, orcamentos, ordenarPor]);

  const selecionarOrcamento = (orcamento: OrcamentoAbertoResumo) => {
    setModalAberto(false);
    onSelecionarOrcamento?.(orcamento);
  };

  const limparFiltrosModal = () => {
    setBusca('');
    setOrdenarPor('data_emissao');
    setDirecao('desc');
  };

  if (loading && orcamentos.length === 0) {
    if (!mostrarVazio) {
      return null;
    }

    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Verificando orçamentos em aberto...
      </section>
    );
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
    if (!mostrarVazio) {
      return null;
    }

    return (
      <section className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-bold text-green-900">
              Nenhum orçamento em aberto encontrado.
            </h2>
            <p className="mt-1">
              A área será preenchida automaticamente quando houver orçamentos
              em aberto na base importada.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={carregarOrcamentosAbertos}
            disabled={loading}
          >
            Atualizar
          </Button>
        </div>
      </section>
    );
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

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-end">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Buscar
                  </span>
                  <input
                    type="search"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Cliente, código ou orçamento..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Ordenar por
                  </span>
                  <select
                    value={ordenarPor}
                    onChange={(event) =>
                      setOrdenarPor(event.target.value as CampoOrdenacaoAbertos)
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="data_emissao">Data de emissão</option>
                    <option value="numero_orcamento">Nº Orçamento</option>
                    <option value="codigo_cliente_loja">Nº Cliente</option>
                    <option value="nome_cliente">Nome</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Direção
                  </span>
                  <select
                    value={direcao}
                    onChange={(event) =>
                      setDirecao(event.target.value as DirecaoOrdenacao)
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="desc">Decrescente</option>
                    <option value="asc">Crescente</option>
                  </select>
                </label>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={limparFiltrosModal}
                >
                  Limpar
                </Button>
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Exibindo <strong>{orcamentosFiltrados.length}</strong> de{' '}
                <strong>{orcamentos.length}</strong> orçamento(s) em aberto.
              </p>
            </div>

            {orcamentosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                Nenhum orçamento em aberto encontrado com os filtros aplicados.
              </div>
            ) : null}

            {orcamentosFiltrados.length > 0 ? (
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
                    {orcamentosFiltrados.map((orcamento) => (
                      <LinhaOrcamentoAberto
                        key={orcamento.chave}
                        orcamento={orcamento}
                        onSelecionar={selecionarOrcamento}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {orcamentosFiltrados.length > 0 ? (
              <div className="space-y-3 md:hidden">
                {orcamentosFiltrados.map((orcamento) => (
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
            ) : null}
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
