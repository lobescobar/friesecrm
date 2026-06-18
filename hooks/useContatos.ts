import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Contato } from '../types';

type NovoContato = Omit<Contato, 'id' | 'created_at' | 'updated_at'>;

export function useContatos() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarContatos = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const { data, error: erroBusca } = await supabase
      .from('contatos_clientes')
      .select('*')
      .eq('cliente_id', id)
      .order('nome', { ascending: true });

    if (erroBusca) {
      setError(erroBusca.message);
      setContatos([]);
    } else {
      setContatos((data || []) as Contato[]);
    }

    setLoading(false);
  }, []);

  const adicionarContato = async (novoContato: NovoContato) => {
    const { data, error: erroCriacao } = await supabase
      .from('contatos_clientes')
      .insert([novoContato])
      .select()
      .single();

    if (erroCriacao) {
      setError(erroCriacao.message);
      return null;
    }

    const contatoCriado = data as Contato;
    setContatos((atuais) => [...atuais, contatoCriado]);
    return contatoCriado;
  };

  const atualizarContato = async (id: string, dados: Partial<Contato>) => {
    const { data, error: erroAtualizacao } = await supabase
      .from('contatos_clientes')
      .update(dados)
      .eq('id', id)
      .select()
      .single();

    if (erroAtualizacao) {
      setError(erroAtualizacao.message);
      return null;
    }

    const contatoAtualizado = data as Contato;
    setContatos((atuais) =>
      atuais.map((contato) =>
        contato.id === id ? { ...contato, ...contatoAtualizado } : contato
      )
    );

    return contatoAtualizado;
  };

  const excluirContato = async (id: string) => {
    const { error: erroExclusao } = await supabase
      .from('contatos_clientes')
      .delete()
      .eq('id', id);

    if (erroExclusao) {
      setError(erroExclusao.message);
      return false;
    }

    setContatos((atuais) => atuais.filter((contato) => contato.id !== id));
    return true;
  };

  return {
    contatos,
    loading,
    error,
    carregarContatos,
    adicionarContato,
    atualizarContato,
    excluirContato,
    setContatos
  };
}
