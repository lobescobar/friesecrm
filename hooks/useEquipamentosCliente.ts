import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { EquipamentoCliente } from '../types';

type NovoEquipamento = Omit<
  EquipamentoCliente,
  'id' | 'created_at' | 'updated_at'
>;

export function useEquipamentosCliente(clienteId: string) {
  const [equipamentos, setEquipamentos] = useState<EquipamentoCliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('equipamentos_clientes')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('modelo_maquina', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao carregar equipamentos do cliente:', error);
      setEquipamentos([]);
      setErro('Não foi possível carregar os equipamentos.');
    } else {
      setErro(null);
      setEquipamentos((data || []) as EquipamentoCliente[]);
    }

    setCarregando(false);
  }, [clienteId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregar();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [carregar]);

  const adicionar = async (novoEquipamento: NovoEquipamento) => {
    setErro(null);

    const { data, error } = await supabase
      .from('equipamentos_clientes')
      .insert(novoEquipamento)
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar equipamento:', error);
      setErro('Não foi possível cadastrar o equipamento.');
      return null;
    }

    const equipamento = data as EquipamentoCliente;
    setEquipamentos((atuais) =>
      [...atuais, equipamento].sort((a, b) =>
        a.modelo_maquina.localeCompare(b.modelo_maquina, 'pt-BR')
      )
    );
    return equipamento;
  };

  const atualizar = async (
    id: string,
    dados: Partial<Omit<EquipamentoCliente, 'id' | 'cliente_id'>>
  ) => {
    setErro(null);

    const { data, error } = await supabase
      .from('equipamentos_clientes')
      .update(dados)
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar equipamento:', error);
      setErro('Não foi possível atualizar o equipamento.');
      return null;
    }

    const equipamento = data as EquipamentoCliente;
    setEquipamentos((atuais) =>
      atuais
        .map((item) => (item.id === id ? equipamento : item))
        .sort((a, b) =>
          a.modelo_maquina.localeCompare(b.modelo_maquina, 'pt-BR')
        )
    );
    return equipamento;
  };

  const excluir = async (id: string) => {
    setErro(null);

    const { error } = await supabase
      .from('equipamentos_clientes')
      .delete()
      .eq('id', id)
      .eq('cliente_id', clienteId);

    if (error) {
      console.error('Erro ao excluir equipamento:', error);
      setErro('Não foi possível excluir o equipamento.');
      return false;
    }

    setEquipamentos((atuais) => atuais.filter((item) => item.id !== id));
    return true;
  };

  return {
    equipamentos,
    carregando,
    erro,
    adicionar,
    atualizar,
    excluir
  };
}
