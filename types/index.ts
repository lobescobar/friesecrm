import { StatusType } from '../utils/constants';

export interface Cliente {
  id: string;
  codigo_cliente?: string | null;
  empresa: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  segmento?: string | null;
  cidade?: string | null;
  estado?: string | null;
  status: StatusType | string;
  endereco?: string | null;
  observacoes?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  telefone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Contato {
  id: string;
  cliente_id: string;
  nome: string;
  cargo?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco_visita?: string | null;
  endereco_padrao?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Ordenacao {
  coluna: keyof Cliente | 'cliente_nome';
  direcao: 'asc' | 'desc';
}

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'vendedor';
  segmentos_permitidos: string[];
  estados_permitidos: string[];
  created_at?: string | null;
  updated_at?: string | null;
}

export type StatusOrcamentoCodigo = 'A' | 'B' | 'C';

export interface HistoricoOrcamento {
  id: string;
  cliente_id?: string | null;

  codigo_cliente: string;
  loja: string;
  codigo_cliente_loja: string;

  numero_it_completo: string;
  numero_orcamento: string;

  pedido_venda?: string | null;
  descricao_item?: string | null;
  quantidade_item?: number | null;

  data_fechamento?: string | null;

  status: StatusOrcamentoCodigo;
  status_descricao: string;

  data_emissao: string;

  origem_importacao?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type AuditLogAcao =
  | 'insert'
  | 'update'
  | 'delete'
  | 'update_observacoes'
  | 'importacao_erp'
  | 'importacao_orcamentos'
  | string;

export interface AuditLog {
  id: string;
  created_at: string;
  user_id?: string | null;
  user_email?: string | null;
  tabela: string;
  registro_id?: string | null;
  cliente_id?: string | null;
  acao: AuditLogAcao;
  origem: string;
  valor_anterior?: Record<string, unknown> | null;
  valor_novo?: Record<string, unknown> | null;
  detalhes: Record<string, unknown>;
}
