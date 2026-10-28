import { useCallback, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Contato } from '../types';
import {
  CACHE_TTL_CURTO_MS,
  lerCacheSessao,
  salvarCacheSessao
} from '../utils/sessionCache';

type NovoContato = Omit<Contato, 'id' | 'created_at' | 'updated_at'>;

type ErroSupabase = {
  code?: string;
  message?: string;
};

function mensagemErroContato(
  erro: ErroSupabase,
  mensagemPadrao: string
) {
  if (erro.code === '42501' || erro.message?.includes('row-level security')) {
    return 'Você não tem permissão para alterar os contatos deste cliente.';
  }

  if (erro.code === '23503') {
    return 'Este cliente não está mais disponível para receber contatos.';
  }

  return mensagemPadrao;
}

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
    setError(null);

    const { data, error: erroCriacao } = await supabase
      .from('contatos_clientes')
      .insert([
        {
          ...novoContato,
          endereco_padrao: novoContato.endereco_padrao ?? false
        }
      ])
      .select()
      .single();

    if (erroCriacao) {
      setError(
        mensagemErroContato(
          erroCriacao,
          'Não foi possível adicionar o contato. Tente novamente.'
        )
      );
      return null;
    }

    const contatoCriado = data as Contato;
    atualizarContatosEmTela([...contatosRef.current, contatoCriado]);
    return contatoCriado;
  };

  const atualizarContato = async (id: string, dados: Partial<Contato>) => {
    setError(null);

    const { data, error: erroAtualizacao } = await supabase
      .from('contatos_clientes')
      .update(dados)
      .eq('id', id)
      .select()
      .single();

    if (erroAtualizacao) {
      setError(
        mensagemErroContato(
          erroAtualizacao,
          'Não foi possível atualizar o contato. Tente novamente.'
        )
      );
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
    setError(null);

    const { error: erroExclusao } = await supabase
      .from('contatos_clientes')
      .delete()
      .eq('id', id);

    if (erroExclusao) {
      setError(
        mensagemErroContato(
          erroExclusao,
          'Não foi possível excluir o contato. Tente novamente.'
        )
      );
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
