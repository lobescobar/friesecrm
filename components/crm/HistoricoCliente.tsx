'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistoricoCliente } from '../../hooks/useHistoricoCliente';
import { useAuth } from '../../hooks/useAuth';
import { HistoricoOrcamento } from '../../types';
import { MESES_HISTORICO_ORCAMENTOS } from '../../utils/constants';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import Modal from '../ui/Modal';

type HistoricoClienteProps = {
  clienteId: string;
  aberto: boolean;
  orcamentoFocoInicial?: string | null;
  onOrcamentoDetalheChange?: (numeroOrcamento: string | null) => void;
};

type StatusFiltro = 'todos' | HistoricoOrcamento['status'];
type ColunaOrdenacao =
  | 'numero_orcamento'
  | 'data_emissao'
  | 'pedido_venda'
  | 'data_fechamento';
type DirecaoOrdenacao = 'asc' | 'desc';

type HistoricoOrcamentoAgrupado = {
  id: string;
  chave: string;
  data_emissao: string;
  data_fechamento: string | null;
  numero_orcamento: string;
  pedido_venda: string | null;
  status: HistoricoOrcamento['status'];
  status_descricao: string;
  quantidade_itens: number;
  itens: HistoricoOrcamento[];
};

const rotulosOrdenacao: Record<ColunaOrdenacao, string> = {
  numero_orcamento: 'Orçamento',
  data_emissao: 'Emissão',
  pedido_venda: 'Pedido de venda',
  data_fechamento: 'Data de fechamento'
};

function formatarData(data?: string | null) {
  if (!data) return '-';

  const partes = data.split('-');

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return data;
}

function formatarQuantidade(valor?: number | null) {
  if (valor === null || valor === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(valor);
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

function montarUrlEmailCancelamento(params: {
  numeroOrcamento: string;
  solicitante: string;
  motivo: string;
}) {
  const assunto = `Solicitação de cancelamento do orçamento ${params.numeroOrcamento}`;
  const corpo = [
    'Favor cancelar o orçamento a seguir.',
    '',
    `Número do orçamento: ${params.numeroOrcamento}`,
    `Vendedor/Solicitante CRM: ${params.solicitante}`,
    `Motivo: ${params.motivo}`,
    '',
    'Solicitação enviada pelo Painel de Gestão Comercial.'
  ].join('\n');

  return `mailto:vendas.ai@friese.com.br?subject=${encodeURIComponent(
    assunto
  )}&body=${encodeURIComponent(corpo)}`;
}

function escolherStatus(
  statusAtual: HistoricoOrcamento['status'],
  novoStatus: HistoricoOrcamento['status']
) {
  const prioridade: Record<HistoricoOrcamento['status'], number> = {
    B: 3,
    A: 2,
    C: 1
  };

  return prioridade[novoStatus] > prioridade[statusAtual]
    ? novoStatus
    : statusAtual;
}

function escolherDataFechamento(
  dataAtual?: string | null,
  novaData?: string | null
) {
  if (!dataAtual) return novaData || null;
  if (!novaData) return dataAtual;

  return novaData > dataAtual ? novaData : dataAtual;
}

function escolherPedidoVenda(
  pedidoAtual?: string | null,
  novoPedido?: string | null
) {
  if (pedidoAtual) return pedidoAtual;
  if (novoPedido) return novoPedido;

  return null;
}

function ordenarItensOrcamento(itens: HistoricoOrcamento[]) {
  return [...itens].sort((a, b) =>
    a.numero_it_completo.localeCompare(b.numero_it_completo, 'pt-BR', {
      numeric: true,
      sensitivity: 'base'
    })
  );
}

function agruparPorNumeroPrincipal(
  historico: HistoricoOrcamento[]
): HistoricoOrcamentoAgrupado[] {
  const mapa = new Map<string, HistoricoOrcamentoAgrupado>();

  historico.forEach((item) => {
    const chave = `${item.codigo_cliente_loja}|${item.numero_orcamento}`;
    const existente = mapa.get(chave);

    if (!existente) {
      mapa.set(chave, {
        id: item.id,
        chave,
        data_emissao: item.data_emissao,
        data_fechamento: item.data_fechamento || null,
        numero_orcamento: item.numero_orcamento,
        pedido_venda: item.pedido_venda || null,
        status: item.status,
        status_descricao: obterDescricaoStatus(item.status),
        quantidade_itens: 1,
        itens: [item]
      });
      return;
    }

    const statusEscolhido = escolherStatus(existente.status, item.status);
    const itens = ordenarItensOrcamento([...existente.itens, item]);

    mapa.set(chave, {
      ...existente,
      data_emissao:
        item.data_emissao > existente.data_emissao
          ? item.data_emissao
          : existente.data_emissao,
      data_fechamento: escolherDataFechamento(
        existente.data_fechamento,
        item.data_fechamento
      ),
      pedido_venda: escolherPedidoVenda(existente.pedido_venda, item.pedido_venda),
      status: statusEscolhido,
      status_descricao: obterDescricaoStatus(statusEscolhido),
      quantidade_itens: itens.length,
      itens
    });
  });

  return Array.from(mapa.values());
}

function compararTexto(a: string | null, b: string | null) {
  return (a || '').localeCompare(b || '', 'pt-BR', {
    numeric: true,
    sensitivity: 'base'
  });
}

function compararDatas(a: string | null, b: string | null) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  return a.localeCompare(b);
}

function ordenarHistorico(
  lista: HistoricoOrcamentoAgrupado[],
  coluna: ColunaOrdenacao,
  direcao: DirecaoOrdenacao
) {
  const multiplicador = direcao === 'asc' ? 1 : -1;

  return [...lista].sort((a, b) => {
    let comparacao = 0;

    if (coluna === 'numero_orcamento') {
      comparacao = compararTexto(a.numero_orcamento, b.numero_orcamento);
    }

    if (coluna === 'data_emissao') {
      comparacao = compararDatas(a.data_emissao, b.data_emissao);
    }

    if (coluna === 'pedido_venda') {
      comparacao = compararTexto(a.pedido_venda, b.pedido_venda);
    }

    if (coluna === 'data_fechamento') {
      comparacao = compararDatas(a.data_fechamento, b.data_fechamento);
    }

    if (comparacao === 0) {
      comparacao = compararTexto(a.numero_orcamento, b.numero_orcamento);
    }

    return comparacao * multiplicador;
  });
}

export default function HistoricoCliente({
  clienteId,
  aberto,
  orcamentoFocoInicial = null,
  onOrcamentoDetalheChange
}: HistoricoClienteProps) {
  const { historico, loading, error, carregarHistorico } = useHistoricoCliente(
    clienteId,
    aberto
  );
  const { user, profile } = useAuth();
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('todos');
  const [colunaOrdenacao, setColunaOrdenacao] =
    useState<ColunaOrdenacao>('data_emissao');
  const [direcaoOrdenacao, setDirecaoOrdenacao] =
    useState<DirecaoOrdenacao>('desc');
  const [orcamentoDetalhado, setOrcamentoDetalhado] =
    useState<HistoricoOrcamentoAgrupado | null>(null);
  const [orcamentoCancelamento, setOrcamentoCancelamento] =
    useState<HistoricoOrcamentoAgrupado | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [erroCancelamento, setErroCancelamento] = useState<string | null>(null);
  const [mensagemCancelamento, setMensagemCancelamento] = useState<string | null>(
    null
  );
  const orcamentoDetalhadoRef =
    useRef<HistoricoOrcamentoAgrupado | null>(null);
  const historicoAgrupadoRef =
    useRef<HistoricoOrcamentoAgrupado[]>([]);
  const orcamentoFocoInicialRef = useRef<string | null>(
    orcamentoFocoInicial
  );

  const historicoAgrupado = useMemo(
    () => agruparPorNumeroPrincipal(historico),
    [historico]
  );

  const historicoFiltradoOrdenado = useMemo(() => {
    const filtrado =
      statusFiltro === 'todos'
        ? historicoAgrupado
        : historicoAgrupado.filter((item) => item.status === statusFiltro);

    return ordenarHistorico(filtrado, colunaOrdenacao, direcaoOrdenacao);
  }, [historicoAgrupado, statusFiltro, colunaOrdenacao, direcaoOrdenacao]);

  useEffect(() => {
    historicoAgrupadoRef.current = historicoAgrupado;
  }, [historicoAgrupado]);

  useEffect(() => {
    orcamentoDetalhadoRef.current = orcamentoDetalhado;
  }, [orcamentoDetalhado]);

  useEffect(() => {
    orcamentoFocoInicialRef.current = orcamentoFocoInicial;
  }, [orcamentoFocoInicial]);

  const resumo = useMemo(() => {
    return {
      total: historicoAgrupado.length,
      abertos: historicoAgrupado.filter((item) => item.status === 'A').length,
      fechados: historicoAgrupado.filter((item) => item.status === 'B').length,
      cancelados: historicoAgrupado.filter((item) => item.status === 'C').length
    };
  }, [historicoAgrupado]);

  useEffect(() => {
    if (!orcamentoFocoInicial) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const orcamentoEncontrado = historicoAgrupado.find(
        (item) => item.numero_orcamento === orcamentoFocoInicial
      );

      if (!orcamentoEncontrado) {
        return;
      }

      setOrcamentoDetalhado((atual) =>
        atual?.numero_orcamento === orcamentoEncontrado.numero_orcamento
          ? atual
          : orcamentoEncontrado
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [historicoAgrupado, orcamentoFocoInicial]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const restaurarDetalheDoOrcamento = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      const numeroOrcamento = orcamentoFocoInicialRef.current;

      if (!numeroOrcamento || orcamentoDetalhadoRef.current) {
        return;
      }

      const orcamentoEncontrado = historicoAgrupadoRef.current.find(
        (item) => item.numero_orcamento === numeroOrcamento
      );

      if (orcamentoEncontrado) {
        setOrcamentoDetalhado(orcamentoEncontrado);
      }
    };

    const aoVoltarParaPagina = () => {
      window.setTimeout(restaurarDetalheDoOrcamento, 0);
    };

    const aoMudarVisibilidade = () => {
      if (!document.hidden) {
        aoVoltarParaPagina();
      }
    };

    window.addEventListener('focus', aoVoltarParaPagina);
    window.addEventListener('pageshow', aoVoltarParaPagina);
    document.addEventListener('visibilitychange', aoMudarVisibilidade);

    return () => {
      window.removeEventListener('focus', aoVoltarParaPagina);
      window.removeEventListener('pageshow', aoVoltarParaPagina);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    };
  }, []);

  const alternarOrdenacao = (coluna: ColunaOrdenacao) => {
    if (colunaOrdenacao === coluna) {
      setDirecaoOrdenacao((direcaoAtual) =>
        direcaoAtual === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setColunaOrdenacao(coluna);
    setDirecaoOrdenacao(coluna.includes('data') ? 'desc' : 'asc');
  };

  const iconeOrdenacao = (coluna: ColunaOrdenacao) => {
    if (colunaOrdenacao !== coluna) return '↕';

    return direcaoOrdenacao === 'asc' ? '↑' : '↓';
  };

  const abrirDetalhes = (item: HistoricoOrcamentoAgrupado) => {
    setOrcamentoDetalhado(item);
    onOrcamentoDetalheChange?.(item.numero_orcamento);
  };

  const fecharDetalhes = () => {
    setOrcamentoDetalhado(null);
    onOrcamentoDetalheChange?.(null);
  };

  const abrirSolicitacaoCancelamento = (item: HistoricoOrcamentoAgrupado) => {
    setOrcamentoCancelamento(item);
    setMotivoCancelamento('');
    setErroCancelamento(null);
    setMensagemCancelamento(null);
  };

  const fecharSolicitacaoCancelamento = () => {
    setOrcamentoCancelamento(null);
    setMotivoCancelamento('');
    setErroCancelamento(null);
  };

  const confirmarSolicitacaoCancelamento = () => {
    if (!orcamentoCancelamento) return;

    const motivo = motivoCancelamento.trim();

    if (motivo.length < 5) {
      setErroCancelamento(
        'Informe um motivo com pelo menos 5 caracteres para solicitar o cancelamento.'
      );
      return;
    }

    const solicitante =
      profile?.email || user?.email || 'Usuário não identificado no CRM';

    window.location.href = montarUrlEmailCancelamento({
      numeroOrcamento: orcamentoCancelamento.numero_orcamento,
      solicitante,
      motivo
    });

    setMensagemCancelamento(
      `E-mail de solicitação preparado para o orçamento ${orcamentoCancelamento.numero_orcamento}. Confirme o envio no seu aplicativo de e-mail.`
    );
    fecharSolicitacaoCancelamento();
  };

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
            Orçamentos dos últimos {MESES_HISTORICO_ORCAMENTOS} meses agrupados pelo número principal.
          </p>
          {orcamentoFocoInicial ? (
            <p className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
              Orçamento selecionado pelo alerta: {orcamentoFocoInicial}
            </p>
          ) : null}
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

      {mensagemCancelamento ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          {mensagemCancelamento}
        </div>
      ) : null}

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

      {!loading && !error && historicoAgrupado.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          Ainda não há orçamentos importados para este cliente nos últimos {MESES_HISTORICO_ORCAMENTOS}
          meses.
        </div>
      ) : null}

      {!loading && !error && historicoAgrupado.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setStatusFiltro('todos')}
              className={`rounded-2xl p-4 text-left transition ${
                statusFiltro === 'todos'
                  ? 'ring-2 ring-slate-500'
                  : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <p className="text-xs font-semibold uppercase text-slate-400">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {resumo.total}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFiltro('A')}
              className={`rounded-2xl p-4 text-left transition ${
                statusFiltro === 'A'
                  ? 'ring-2 ring-blue-500'
                  : 'bg-blue-50 hover:bg-blue-100'
              }`}
            >
              <p className="text-xs font-semibold uppercase text-blue-500">
                Abertos
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-700">
                {resumo.abertos}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFiltro('B')}
              className={`rounded-2xl p-4 text-left transition ${
                statusFiltro === 'B'
                  ? 'ring-2 ring-green-500'
                  : 'bg-green-50 hover:bg-green-100'
              }`}
            >
              <p className="text-xs font-semibold uppercase text-green-500">
                Fechados
              </p>
              <p className="mt-1 text-2xl font-bold text-green-700">
                {resumo.fechados}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFiltro('C')}
              className={`rounded-2xl p-4 text-left transition ${
                statusFiltro === 'C'
                  ? 'ring-2 ring-red-500'
                  : 'bg-red-50 hover:bg-red-100'
              }`}
            >
              <p className="text-xs font-semibold uppercase text-red-500">
                Cancelados
              </p>
              <p className="mt-1 text-2xl font-bold text-red-700">
                {resumo.cancelados}
              </p>
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-end md:justify-between">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Status
                <select
                  value={statusFiltro}
                  onChange={(event) =>
                    setStatusFiltro(event.target.value as StatusFiltro)
                  }
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-700"
                >
                  <option value="todos">Todos</option>
                  <option value="A">Abertos</option>
                  <option value="B">Fechados</option>
                  <option value="C">Cancelados</option>
                </select>
              </label>

              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Ordenar por
                <select
                  value={colunaOrdenacao}
                  onChange={(event) =>
                    setColunaOrdenacao(event.target.value as ColunaOrdenacao)
                  }
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-700"
                >
                  <option value="numero_orcamento">Orçamento</option>
                  <option value="data_emissao">Data de emissão</option>
                  <option value="pedido_venda">Pedido de venda</option>
                  <option value="data_fechamento">Data de fechamento</option>
                </select>
              </label>

              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Direção
                <select
                  value={direcaoOrdenacao}
                  onChange={(event) =>
                    setDirecaoOrdenacao(event.target.value as DirecaoOrdenacao)
                  }
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-700"
                >
                  <option value="asc">Crescente</option>
                  <option value="desc">Decrescente</option>
                </select>
              </label>
            </div>

            <p className="text-sm text-slate-500">
              Exibindo{' '}
              <strong className="text-slate-800">
                {historicoFiltradoOrdenado.length}
              </strong>{' '}
              de{' '}
              <strong className="text-slate-800">{historicoAgrupado.length}</strong>{' '}
              orçamento(s).
            </p>
          </div>

          {historicoFiltradoOrdenado.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              Nenhum orçamento encontrado com o filtro selecionado.
            </div>
          ) : null}

          {historicoFiltradoOrdenado.length > 0 ? (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => alternarOrdenacao('numero_orcamento')}
                          className="inline-flex items-center gap-1 font-bold"
                        >
                          Orçamento {iconeOrdenacao('numero_orcamento')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => alternarOrdenacao('data_emissao')}
                          className="inline-flex items-center gap-1 font-bold"
                        >
                          Data de emissão {iconeOrdenacao('data_emissao')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => alternarOrdenacao('pedido_venda')}
                          className="inline-flex items-center gap-1 font-bold"
                        >
                          Pedido de venda {iconeOrdenacao('pedido_venda')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => alternarOrdenacao('data_fechamento')}
                          className="inline-flex items-center gap-1 font-bold"
                        >
                          Data de fechamento {iconeOrdenacao('data_fechamento')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {historicoFiltradoOrdenado.map((item) => {
                      const destacado =
                        orcamentoFocoInicial === item.numero_orcamento;

                      return (
                        <tr
                          key={item.chave}
                          className={destacado ? 'bg-blue-50' : 'hover:bg-slate-50'}
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => abrirDetalhes(item)}
                              className="font-semibold text-blue-700 underline-offset-4 hover:underline"
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
                              className={`rounded-full border px-2 py-1 text-xs font-bold ${obterClasseStatus(
                                item.status
                              )}`}
                            >
                              {item.status_descricao}
                            </span>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {historicoFiltradoOrdenado.map((item) => {
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
                          <p className="text-base font-bold text-blue-700">
                            {item.numero_orcamento}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-bold ${obterClasseStatus(
                            item.status
                          )}`}
                        >
                          {item.status_descricao}
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
                          variant="secondary"
                          className="w-full"
                          onClick={() => abrirDetalhes(item)}
                        >
                          Ver itens do orçamento
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {!loading && !error && historicoAgrupado.length > 0 ? (
        <p className="mt-4 text-xs text-slate-400">
          Ordenação atual: {rotulosOrdenacao[colunaOrdenacao]} /{' '}
          {direcaoOrdenacao === 'asc' ? 'crescente' : 'decrescente'}. Clique no
          número do orçamento para visualizar os itens e descrições.
        </p>
      ) : null}

      {orcamentoDetalhado ? (
        <Modal
          title={`Orçamento ${orcamentoDetalhado.numero_orcamento}`}
          subtitle="Itens, descrições e quantidades importados da planilha"
          onClose={fecharDetalhes}
          scrollKey={`orcamento:${clienteId}:${orcamentoDetalhado.numero_orcamento}`}
          footer={
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {orcamentoDetalhado.status === 'A' ? (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    fecharDetalhes();
                    abrirSolicitacaoCancelamento(orcamentoDetalhado);
                  }}
                >
                  Solicitar cancelamento
                </Button>
              ) : null}

              <Button
                type="button"
                variant="secondary"
                onClick={fecharDetalhes}
              >
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
                  {formatarData(orcamentoDetalhado.data_emissao)}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Pedido venda
                </p>
                <p className="font-semibold text-slate-800">
                  {orcamentoDetalhado.pedido_venda || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Fechamento
                </p>
                <p className="font-semibold text-slate-800">
                  {formatarData(orcamentoDetalhado.data_fechamento)}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Status
                </p>
                <span
                  className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-bold ${obterClasseStatus(
                    orcamentoDetalhado.status
                  )}`}
                >
                  {orcamentoDetalhado.status_descricao}
                </span>
              </div>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Número item</th>
                    <th className="px-4 py-3 text-left">Descrição</th>
                    <th className="px-4 py-3 text-left">Quantidade</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {ordenarItensOrcamento(orcamentoDetalhado.itens).map((item) => (
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
              {ordenarItensOrcamento(orcamentoDetalhado.itens).map((item) => (
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
      ) : null}

      {orcamentoCancelamento ? (
        <Modal
          title={`Solicitar cancelamento do orçamento ${orcamentoCancelamento.numero_orcamento}`}
          subtitle="O CRM abrirá um e-mail pronto para envio ao time de vendas."
          onClose={fecharSolicitacaoCancelamento}
          scrollKey={`cancelamento:${clienteId}:${orcamentoCancelamento.numero_orcamento}`}
          footer={
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={fecharSolicitacaoCancelamento}
              >
                Voltar
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={confirmarSolicitacaoCancelamento}
              >
                Preparar e-mail
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
                Ela prepara um e-mail para solicitar o cancelamento ao endereço
                vendas.ai@friese.com.br. O envio será confirmado no seu
                aplicativo de e-mail.
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Orçamento
                </p>
                <p className="font-semibold text-slate-900">
                  {orcamentoCancelamento.numero_orcamento}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Solicitante
                </p>
                <p className="break-all font-semibold text-slate-900">
                  {profile?.email || user?.email || 'Usuário não identificado'}
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
                value={motivoCancelamento}
                onChange={(event) => {
                  setMotivoCancelamento(event.target.value);
                  setErroCancelamento(null);
                }}
                rows={5}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-500"
                placeholder="Descreva o motivo do cancelamento..."
              />
            </label>

            {erroCancelamento ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {erroCancelamento}
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
