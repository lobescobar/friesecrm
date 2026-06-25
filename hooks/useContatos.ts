import { useCallback, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Contato } from '../types';
import {
  CACHE_TTL_CURTO_MS,
  lerCacheSessao,
  salvarCacheSessao
} from '../utils/sessionCache';

type NovoContato = Omit<Contato, 'id' | 'created_at' | 'updated_at'>;

function montarChaveCacheContatos(clienteId: string) {
  return `contatos-cliente:${clienteId}`;
}

export function useContatos() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const contatosRef = useRef<Contato[]>([]);
  const clienteAtualRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atualizarContatosEmTela = useCallback((novosContatos: Contato[]) => {
    contatosRef.current = novosContatos;
    setContatos(novosContatos);

    if (clienteAtualRef.current) {
      salvarCacheSessao(
        montarChaveCacheContatos(clienteAtualRef.current),
        novosContatos
      );
    }
  }, []);

  const carregarContatos = useCallback(
    async (id: string) => {
      clienteAtualRef.current = id;
      const cacheKey = montarChaveCacheContatos(id);
      const contatosEmCache = lerCacheSessao<Contato[]>(
        cacheKey,
        CACHE_TTL_CURTO_MS
      );

      if (contatosEmCache && contatosRef.current.length === 0) {
        contatosRef.current = contatosEmCache;
        setContatos(contatosEmCache);
      }

      const possuiDadosEmTela =
        contatosRef.current.length > 0 || Boolean(contatosEmCache);

      setLoading(!possuiDadosEmTela);
      setError(null);

      const { data, error: erroBusca } = await supabase
        .from('contatos_clientes')
        .select('*')
        .eq('cliente_id', id)
        .order('nome', { ascending: true });

      if (erroBusca) {
        setError(erroBusca.message);

        if (contatosRef.current.length === 0) {
          setContatos([]);
        }
      } else {
        const contatosAtualizados = (data || []) as Contato[];
        contatosRef.current = contatosAtualizados;
        setContatos(contatosAtualizados);
        salvarCacheSessao(cacheKey, contatosAtualizados);
      }

      setLoading(false);
    },
    []
  );

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
    atualizarContatosEmTela([...contatosRef.current, contatoCriado]);
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
    atualizarContatosEmTela(
      contatosRef.current.map((contato) =>
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

    atualizarContatosEmTela(
      contatosRef.current.filter((contato) => contato.id !== id)
    );
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
