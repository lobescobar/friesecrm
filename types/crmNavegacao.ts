import type { ClienteModalSecao } from '../components/crm/cliente-modal/ClienteModalNav';

export type EstadoNavegacaoCRM = {
  cliente: string | null;
  aba: ClienteModalSecao;
  orcamento: string | null;
};

export type AtualizacaoParametros = {
  cliente?: string | null;
  aba?: ClienteModalSecao | null;
  orcamento?: string | null;
};

export type AreaCRM =
  | 'orcamentos'
  | 'clientes'
  | 'mapa'
  | 'administracao'
  | 'auditoria';

export type AreaNavegacaoCRM = {
  id: AreaCRM;
  titulo: string;
  descricao: string;
  adminOnly?: boolean;
};
