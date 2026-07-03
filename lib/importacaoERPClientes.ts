import { supabase } from './supabase';
import { Cliente } from '../types';
import { ClienteImportacao } from '../types/importacaoERP';
import { lotes } from '../utils/importacaoERP';

export async function buscarClientesExistentesERP(codigos: string[]) {
  const existentes = new Map<
    string,
    Pick<Cliente, 'codigo_cliente' | 'segmento' | 'status'>
  >();

  for (const lote of lotes(codigos, 500)) {
    const { data, error } = await supabase
      .from('clientes')
      .select('codigo_cliente, segmento, status')
      .in('codigo_cliente', lote);

    if (error) {
      throw error;
    }

    (data || []).forEach((item) => {
      const codigo = String(item.codigo_cliente || '');

      if (codigo) {
        existentes.set(codigo, {
          codigo_cliente: codigo,
          segmento: item.segmento || null,
          status:
            item.status === 'Ativo' || item.status === 'Inativo'
              ? item.status
              : 'Inativo'
        });
      }
    });
  }

  return existentes;
}

export async function buscarCodigosExistentesERP(codigos: string[]) {
  return new Set((await buscarClientesExistentesERP(codigos)).keys());
}

export function preservarDadosManuaisClienteERP(
  cliente: ClienteImportacao,
  clienteAtualBanco?: Pick<Cliente, 'codigo_cliente' | 'segmento' | 'status'>
): ClienteImportacao {
  return {
    ...cliente,
    segmento: cliente.segmento || clienteAtualBanco?.segmento || null,
    status:
      clienteAtualBanco?.status === 'Ativo' ||
      clienteAtualBanco?.status === 'Inativo'
        ? clienteAtualBanco.status
        : 'Inativo'
  };
}
