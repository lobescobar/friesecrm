import { StatusType } from '../utils/constants';

export interface Cliente {
  id: string;
  codigo_cliente?: string;
  empresa: string;
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  segmento?: string;
  cidade: string;
  estado: string;
  status: StatusType | string;
  endereco?: string;
  observacoes?: string;
  latitude?: string;
  longitude?: string;
  telefone?: string;
}

export interface Contato {
  id: string;
  cliente_id: string;
  nome: string;
  cargo?: string;
  telefone?: string;
  email?: string;
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
}
