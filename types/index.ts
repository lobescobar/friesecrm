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
  principal?: boolean | null;
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
