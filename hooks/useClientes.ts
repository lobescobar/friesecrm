import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Cliente, Ordenacao, Profile } from '../types';

export function useClientes(profile: Profile | null) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarClientes = useCallback(async () => {
    if (!profile) return;
    
    setLoading(true);
    let query = supabase.from('clientes').select('*');

    // Aplicar filtros de alçada se não for admin
    if (profile.role !== 'admin') {
      if (profile.segmentos_permitidos && profile.segmentos_permitidos.length > 0) {
        query = query.in('segmento', profile.segmentos_permitidos);
      }
      if (profile.estados_permitidos && profile.estados_permitidos.length > 0) {
        query = query.in('estado', profile.estados_permitidos);
      }
    }

    const { data, error } = await query.order('empresa', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setClientes(data || []);
      setError(null);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  return { clientes, loading, error, carregarClientes, setClientes };
}

export function useFiltragemClientes(clientes: Cliente[]) {
  const [buscaEmpresa, setBuscaEmpresa] = useState('');
  const [buscaCodigo, setBuscaCodigo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroSegmento, setFiltroSegmento] = useState('Todos');
  const [ordenacao, setOrdenacao] = useState<Ordenacao>({ coluna: 'empresa', direcao: 'asc' });

  const alternarOrdenacao = (coluna: keyof Cliente | 'cliente_nome') => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Otimização: Só filtra se o array de clientes mudar ou se os termos de busca mudarem
  const clientesFiltrados = useMemo(() => {
    return clientes
      .filter((cliente) => {
        const termoBusca = buscaEmpresa.toLowerCase();
        const termoCodigo = buscaCodigo.toLowerCase();
      
      const matchEmpresa = (cliente.empresa || '').toLowerCase().includes(termoBusca) || 
                          (cliente.cnpj || '').toLowerCase().includes(termoBusca);
      const matchCodigo = (cliente.codigo_cliente || '').toLowerCase().includes(termoCodigo);
      const matchStatus = filtroStatus === 'Todos' || cliente.status === filtroStatus;
      const matchEstado = filtroEstado === 'Todos' || cliente.estado === filtroEstado;
      const matchSegmento = filtroSegmento === 'Todos' || cliente.segmento === filtroSegmento;
      
      return matchEmpresa && matchCodigo && matchStatus && matchEstado && matchSegmento;
    })
    .sort((a, b) => {
      let valA = String(ordenacao.coluna === 'cliente_nome' ? (a.empresa || '') : (a[ordenacao.coluna as keyof Cliente] || '')).toLowerCase();
      let valB = String(ordenacao.coluna === 'cliente_nome' ? (b.empresa || '') : (b[ordenacao.coluna as keyof Cliente] || '')).toLowerCase();
      
      if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });
  }, [clientes, buscaEmpresa, buscaCodigo, filtroStatus, filtroEstado, filtroSegmento, ordenacao]);

  const estadosUnicos = useMemo(() => Array.from(new Set(clientes.map(c => c.estado).filter(Boolean))).sort(), [clientes]);
  const segmentosUnicos = useMemo(() => Array.from(new Set(clientes.map(c => c.segmento).filter(Boolean))).sort(), [clientes]);

  return {
    buscaEmpresa, setBuscaEmpresa,
    buscaCodigo, setBuscaCodigo,
    filtroStatus, setFiltroStatus,
    filtroEstado, setFiltroEstado,
    filtroSegmento, setFiltroSegmento,
    ordenacao, alternarOrdenacao,
    clientesFiltrados,
    estadosUnicos,
    segmentosUnicos
  };
}
