export const MESES_STATUS_CLIENTE_ATIVO = 18;
export const MESES_HISTORICO_ORCAMENTOS = 18;

export const STATUS_COLORS = {
  Ativo: {
    hex: '#22c55e',
    classes: 'text-green-700 bg-green-50 border-green-200'
  },
  Inativo: {
    hex: '#ef4444',
    classes: 'text-red-700 bg-red-50 border-red-200'
  }
} as const;

export type StatusType = keyof typeof STATUS_COLORS;

export const STATUS_OPTIONS = Object.keys(STATUS_COLORS) as StatusType[];

export const SEGMENTOS_CLIENTES = [
  'Agroindustria',
  'Corrugados',
  'Tempera Indutiva',
  'Tratamento Termico'
] as const;

export type SegmentoCliente = (typeof SEGMENTOS_CLIENTES)[number];

export const ESTADOS_BRASIL = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO'
] as const;
