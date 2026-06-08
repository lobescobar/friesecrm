export const STATUS_COLORS = {
  Novo: {
    hex: '#3b82f6',
    classes: 'text-blue-700 bg-blue-50 border-blue-200'
  },
  Ativo: {
    hex: '#22c55e',
    classes: 'text-green-700 bg-green-50 border-green-200'
  },
  Proposta: {
    hex: '#eab308',
    classes: 'text-yellow-700 bg-yellow-50 border-yellow-200'
  },
  Inativo: {
    hex: '#ef4444',
    classes: 'text-red-700 bg-red-50 border-red-200'
  }
} as const;

export type StatusType = keyof typeof STATUS_COLORS;
