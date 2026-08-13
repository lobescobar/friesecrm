import type { HistoricoOrcamento } from '../types';
import type {
  ColunaOrdenacao,
  DirecaoOrdenacao,
  HistoricoOrcamentoAgrupado
} from '../types/historico';

export const rotulosOrdenacao: Record<ColunaOrdenacao, string> = {
  numero_orcamento: 'Orçamento',
  data_emissao: 'Emissão',
  pedido_venda: 'Pedido de venda',
  data_fechamento: 'Data de fechamento'
};

export function formatarData(data?: string | null) {
  if (!data) return '-';

  const partes = data.split('-');

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return data;
}

export function formatarDataHora(data?: string | null) {
  if (!data) return '-';

  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return data;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(dataConvertida);
}

export function formatarQuantidade(valor?: number | null) {
  if (valor === null || valor === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(valor);
}

export function obterClasseStatus(status: HistoricoOrcamento['status']) {
  if (status === 'A') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  if (status === 'B') {
    return 'border-green-200 bg-green-50 text-green-700';
  }

  return 'border-red-200 bg-red-50 text-red-700';
}

export function obterClasseStatusOrcamento(
  orcamento: Pick<HistoricoOrcamentoAgrupado, 'status' | 'cancelamento_solicitado'>
) {
  if (orcamento.cancelamento_solicitado) {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return obterClasseStatus(orcamento.status);
}

export function obterDescricaoStatus(status: HistoricoOrcamento['status']) {
  if (status === 'A') return 'Aberto';
  if (status === 'B') return 'Fechado';
  return 'Cancelado';
}

export function obterDescricaoStatusOrcamento(
  orcamento: Pick<
    HistoricoOrcamentoAgrupado,
    'status' | 'status_descricao' | 'cancelamento_solicitado'
  >
) {
  if (orcamento.cancelamento_solicitado) {
    return 'Cancelamento solicitado';
  }

  return orcamento.status_descricao;
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

export function ordenarItensOrcamento(itens: HistoricoOrcamento[]) {
  return [...itens].sort((a, b) =>
    a.numero_it_completo.localeCompare(b.numero_it_completo, 'pt-BR', {
      numeric: true,
      sensitivity: 'base'
    })
  );
}

export function agruparPorNumeroPrincipal(
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
        cancelamento_solicitado: Boolean(item.cancelamento_solicitado),
        motivo_cancelamento: item.motivo_cancelamento || null,
        cancelamento_solicitado_em: item.cancelamento_solicitado_em || null,
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
      pedido_venda: escolherPedidoVenda(
        existente.pedido_venda,
        item.pedido_venda
      ),
      status: statusEscolhido,
      status_descricao: obterDescricaoStatus(statusEscolhido),
      cancelamento_solicitado:
        existente.cancelamento_solicitado ||
        Boolean(item.cancelamento_solicitado),
      motivo_cancelamento:
        existente.motivo_cancelamento || item.motivo_cancelamento || null,
      cancelamento_solicitado_em:
        existente.cancelamento_solicitado_em ||
        item.cancelamento_solicitado_em ||
        null,
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

export function ordenarHistorico(
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

export function obterAriaSort(
  colunaAtual: ColunaOrdenacao,
  direcaoAtual: DirecaoOrdenacao,
  coluna: ColunaOrdenacao
) {
  if (colunaAtual !== coluna) {
    return 'none' as const;
  }

  return direcaoAtual === 'asc' ? ('ascending' as const) : ('descending' as const);
}

export function obterIconeOrdenacao(
  colunaAtual: ColunaOrdenacao,
  direcaoAtual: DirecaoOrdenacao,
  coluna: ColunaOrdenacao
) {
  if (colunaAtual !== coluna) return '↕';

  return direcaoAtual === 'asc' ? '↑' : '↓';
}
