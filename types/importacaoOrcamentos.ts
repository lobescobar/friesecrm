import { MESES_HISTORICO_ORCAMENTOS } from '../utils/constants';

export type StatusOrcamentoImportacao = 'A' | 'B' | 'C';

export type HistoricoImportacao = {
  cliente_id: string;
  codigo_cliente: string;
  loja: string;
  codigo_cliente_loja: string;
  numero_it_completo: string;
  numero_orcamento: string;
  pedido_venda: string | null;
  descricao_item: string | null;
  quantidade_item: number | null;
  valor_total: number | null;
  status: StatusOrcamentoImportacao;
  status_descricao: string;
  data_emissao: string;
  data_fechamento: string | null;
  data_cancelamento: string | null;
  ramo: string | null;
  origem_importacao: string;
};

export type LinhaProcessada = Omit<HistoricoImportacao, 'cliente_id'>;

export type ClienteLookup = {
  id: string;
  codigo_cliente: string | null;
};

export type ResumoOrcamentos = {
  totalLinhasLidas: number;
  cabecalhosIgnorados: number;
  validosParaImportar: number;
  orcamentosUnicos: number;
  semNumeroIt: number;
  semCodigoCliente: number;
  semClienteEncontrado: number;
  dataInvalida: number;
  foraHistoricoMeses: number;
  statusDDesconsiderado: number;
  statusInvalido: number;
  duplicadosInternos: number;
  abertos: number;
  fechados: number;
  cancelados: number;
};

export type ResultadoImportacao = {
  enviados: number;
  lotes: number;
  clientesAtivos: number;
  origemImportacao?: string;
};

export type IndicesPlanilha = {
  numeroIt: number;
  cliente: number;
  loja: number;
  pedidoVenda: number;
  descricao: number;
  quantidade: number;
  valorTotal: number;
  status: number;
  dataEmissao: number;
  dataFechamento: number;
  dataCancelamento: number;
  ramo: number;
};

export type ProcessamentoPlanilhaOrcamentos = {
  headers: string[];
  resumo: ResumoOrcamentos;
  registros: HistoricoImportacao[];
  preview: HistoricoImportacao[];
};

export const DESCRICAO_PERIODO_HISTORICO_ORCAMENTOS =
  `Histórico dos últimos ${MESES_HISTORICO_ORCAMENTOS} meses por cliente`;
