import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Cliente, Ordenacao, Profile } from '../types';
import { normalizarTexto, somenteNumeros } from '../utils/formatters';
import { CACHE_TTL_MEDIO_MS, lerCacheSessao, salvarCacheSessao } from '../utils/sessionCache';

function valorOrdenacao(cliente: Cliente, coluna: keyof Cliente | 'cliente_nome') {
  if (coluna === 'cliente_nome') {
    return cliente.empresa || cliente.nome_fantasia || cliente.razao_social || '';
  }

  return String(cliente[coluna] ?? '');
}

function montarChaveCacheClientes(profile: Profile | null) {
  if (!profile) {
    return null;
  }

  const segmentos = [...(profile.segmentos_permitidos || [])]
    .sort()
    .join(',');
  const estados = [...(profile.estados_permitidos || [])].sort().join(',');

  return `clientes:${profile.id}:${profile.role}:${segmentos}:${estados}`;
}

export function useClientes(profile: Profile | null) {
  const cacheKey = useMemo(() => montarChaveCacheClientes(profile), [profile]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const clientesRef = useRef<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientesRef.current = clientes;
  }, [clientes]);

  useEffect(() => {
    if (!cacheKey || clientesRef.current.length > 0) {
      return;
    }

    const clientesEmCache = lerCacheSessao<Cliente[]>(
      cacheKey,
      CACHE_TTL_MEDIO_MS
    );

    if (clientesEmCache?.length) {
      setClientes(clientesEmCache);
      setLoading(false);
    }
  }, [cacheKey]);

  const carregarClientes = useCallback(async () => {
    if (!profile || !cacheKey) {
      setClientes([]);
      setLoading(false);
      return;
    }

    const clientesEmCache = lerCacheSessao<Cliente[]>(
      cacheKey,
      CACHE_TTL_MEDIO_MS
    );

    if (clientesEmCache?.length && clientesRef.current.length === 0) {
      setClientes(clientesEmCache);
      clientesRef.current = clientesEmCache;
    }

    const possuiDadosEmTela =
      clientesRef.current.length > 0 || Boolean(clientesEmCache?.length);

    setLoading(!possuiDadosEmTela);
    setError(null);

    try {
      const todos: Cliente[] = [];
      const tamanhoPagina = 1000;
      let inicio = 0;

      while (true) {
        let query = supabase
          .from('clientes')
          .select('*')
          .order('empresa', { ascending: true })
          .range(inicio, inicio + tamanhoPagina - 1);

        if (profile.role !== 'admin') {
          if (profile.segmentos_permitidos?.length) {
            query = query.in('segmento', profile.segmentos_permitidos);
          }

          if (profile.estados_permitidos?.length) {
            query = query.in('estado', profile.estados_permitidos);
          }
        }

        const { data, error: erroBusca } = await query;

        if (erroBusca) {
          throw erroBusca;
        }

        const pagina = (data || []) as Cliente[];
        todos.push(...pagina);

        if (pagina.length < tamanhoPagina) {
          break;
        }

        inicio += tamanhoPagina;
      }

      setClientes(todos);
      clientesRef.current = todos;
      salvarCacheSessao(cacheKey, todos);
    } catch (err) {
      const mensagem =
        err instanceof Error ? err.message : 'Erro ao carregar clientes.';
      console.error('Erro ao carregar clientes:', err);
      setError(mensagem);

      if (clientesRef.current.length === 0) {
        setClientes([]);
      }
    } finally {
      setLoading(false);
    }
  }, [profile, cacheKey]);

  const atualizarCliente = useCallback(
    async (id: string, dados: Partial<Cliente>) => {
      const { data, error: erroAtualizacao } = await supabase
        .from('clientes')
        .update(dados)
        .eq('id', id)
        .select()
        .single();

      if (erroAtualizacao) {
        throw erroAtualizacao;
      }

      const clienteAtualizado = data as Cliente;

      setClientes((atuais) => {
        const atualizados = atuais.map((cliente) =>
          cliente.id === id ? { ...cliente, ...clienteAtualizado } : cliente
        );

        clientesRef.current = atualizados;

        if (cacheKey) {
          salvarCacheSessao(cacheKey, atualizados);
        }

        return atualizados;
      });

      return clienteAtualizado;
    },
    [cacheKey]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void carregarClientes();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [carregarClientes]);

  return {
    clientes,
    loading,
    error,
    carregarClientes,
    atualizarCliente,
    setClientes
  };
}

export function useFiltragemClientes(clientes: Cliente[]) {
  const [buscaEmpresa, setBuscaEmpresa] = useState('');
  const [buscaCodigo, setBuscaCodigo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroSegmento, setFiltroSegmento] = useState('Todos');

  const [ordenacao, setOrdenacao] = useState<Ordenacao>({
    coluna: 'empresa',
    direcao: 'asc'
  });

  const segmentosUnicos = useMemo(() => {
    return Array.from(
      new Set(
        clientes
          .map((cliente) => cliente.segmento)
          .filter((segmento): segmento is string => Boolean(segmento))
      )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [clientes]);

  const estadosUnicos = useMemo(() => {
    return Array.from(
      new Set(
        clientes
          .map((cliente) => cliente.estado)
          .filter((estado): estado is string => Boolean(estado))
      )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [clientes]);

  const alternarOrdenacao = (coluna: keyof Cliente | 'cliente_nome') => {
    setOrdenacao((atual) => ({
      coluna,
      direcao:
        atual.coluna === coluna && atual.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const limparFiltros = () => {
    setBuscaEmpresa('');
    setBuscaCodigo('');
    setFiltroStatus('Todos');
    setFiltroEstado('Todos');
    setFiltroSegmento('Todos');
  };

  const filtrosAtivos = useMemo(() => {
    const ativos: string[] = [];

    if (buscaEmpresa.trim()) ativos.push(`Busca: ${buscaEmpresa.trim()}`);
    if (buscaCodigo.trim()) ativos.push(`Código: ${buscaCodigo.trim()}`);
    if (filtroStatus !== 'Todos') ativos.push(`Status: ${filtroStatus}`);
    if (filtroEstado !== 'Todos') ativos.push(`UF: ${filtroEstado}`);
    if (filtroSegmento !== 'Todos') ativos.push(`Segmento: ${filtroSegmento}`);

    return ativos;
  }, [buscaEmpresa, buscaCodigo, filtroStatus, filtroEstado, filtroSegmento]);

  const clientesFiltrados = useMemo(() => {
    const buscaTexto = normalizarTexto(buscaEmpresa);
    const buscaTextoNumeros = somenteNumeros(buscaEmpresa);
    const buscaCodigoNormalizada = normalizarTexto(buscaCodigo);

    const filtrados = clientes.filter((cliente) => {
      const cnpjNumeros = somenteNumeros(cliente.cnpj);
      const camposBusca = [
        cliente.empresa,
        cliente.razao_social,
        cliente.nome_fantasia,
        cliente.cnpj,
        cliente.codigo_cliente,
        cliente.cidade,
        cliente.estado
      ]
        .map(normalizarTexto)
        .join(' ');

      const passaEmpresa =
        !buscaTexto ||
        camposBusca.includes(buscaTexto) ||
        (!!buscaTextoNumeros && cnpjNumeros.includes(buscaTextoNumeros));

      const passaCodigo =
        !buscaCodigoNormalizada ||
        normalizarTexto(cliente.codigo_cliente).includes(buscaCodigoNormalizada);

      const passaStatus =
        filtroStatus === 'Todos' || cliente.status === filtroStatus;

      const passaEstado =
        filtroEstado === 'Todos' || cliente.estado === filtroEstado;

      const passaSegmento =
        filtroSegmento === 'Todos' || cliente.segmento === filtroSegmento;

      return (
        passaEmpresa &&
        passaCodigo &&
        passaStatus &&
        passaEstado &&
        passaSegmento
      );
    });

    return [...filtrados].sort((a, b) => {
      const valorA = valorOrdenacao(a, ordenacao.coluna);
      const valorB = valorOrdenacao(b, ordenacao.coluna);

      const comparacao = valorA.localeCompare(valorB, 'pt-BR', {
        numeric: true,
        sensitivity: 'base'
      });

      return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
    });
  }, [
    clientes,
    buscaEmpresa,
    buscaCodigo,
    filtroStatus,
    filtroEstado,
    filtroSegmento,
    ordenacao
  ]);

  return {
    buscaEmpresa,
    setBuscaEmpresa,
    buscaCodigo,
    setBuscaCodigo,
    filtroStatus,
    setFiltroStatus,
    filtroEstado,
    setFiltroEstado,
    filtroSegmento,
    setFiltroSegmento,
    ordenacao,
    alternarOrdenacao,
    clientesFiltrados,
    estadosUnicos,
    segmentosUnicos,
    filtrosAtivos,
    limparFiltros
  };
}
