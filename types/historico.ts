import type { HistoricoOrcamento } from './index';

export type StatusFiltro = 'todos' | HistoricoOrcamento['status'];

export type ColunaOrdenacao =
  | 'numero_orcamento'
  | 'data_emissao'
  | 'pedido_venda'
  | 'data_fechamento';

export type DirecaoOrdenacao = 'asc' | 'desc';

export type HistoricoOrcamentoAgrupado = {
  id: string;
  chave: string;
  data_emissao: string;
  data_fechamento: string | null;
  numero_orcamento: string;
  pedido_venda: string | null;
  status: HistoricoOrcamento['status'];
  status_descricao: string;
  cancelamento_solicitado?: boolean;
  motivo_cancelamento?: string | null;
  cancelamento_solicitado_em?: string | null;
  quantidade_itens: number;
  itens: HistoricoOrcamento[];
};

export type OrcamentoInteracao = {
  id: string;
  cliente_id: string;
  numero_orcamento: string;
  pedido_venda: string | null;
  status_comercial: string | null;
  responsavel_email: string | null;
  observacao: string;
  proximo_passo: string | null;
  data_retorno: string | null;
  criado_por: string | null;
  criado_por_email: string | null;
  created_at: string;
  updated_at: string;
};

export type FormularioInteracaoOrcamento = {
  observacao: string;
  proximo_passo: string;
  data_retorno: string;
};

export const formularioInteracaoInicial: FormularioInteracaoOrcamento = {
  observacao: '',
  proximo_passo: '',
  data_retorno: ''
};
