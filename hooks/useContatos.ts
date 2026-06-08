import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Contato } from '../types';

export function useContatos(clienteId?: string) {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarContatos = useCallback(async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contatos_clientes')
      .select('*')
      .eq('cliente_id', id);
    
    if (error) {
      setError(error.message);
    } else {
      setContatos(data || []);
      setError(null);
    }
    setLoading(false);
  }, []);

  const adicionarContato = async (novoContato: Omit<Contato, 'id'>) => {
    const { data, error } = await supabase
      .from('contatos_clientes')
      .insert([novoContato])
      .select();

    if (error) {
      setError(error.message);
      return null;
    } else {
      const contatoCriado = data[0];
      setContatos(prev => [...prev, contatoCriado]);
      return contatoCriado;
    }
  };

  return { contatos, loading, error, carregarContatos, adicionarContato, setContatos };
}
