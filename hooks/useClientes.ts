import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { Cliente, Ordenacao, Profile } from "../types";

const normalizarTexto = (valor?: string | null) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const somenteNumeros = (valor?: string | null) =>
  String(valor || "").replace(/\D/g, "");

export function useClientes(profile: Profile | null) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarClientes = useCallback(async () => {
    if (!profile) {
      setClientes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const todos: Cliente[] = [];
      const tamanhoPagina = 1000;
      let inicio = 0;

      while (true) {
        let query = supabase
          .from("clientes")
          .select("*")
          .order("empresa", { ascending: true })
          .range(inicio, inicio + tamanhoPagina - 1);

        // Aplicar filtros de alçada se não for admin
        if (profile.role !== "admin") {
          if (
            profile.segmentos_permitidos &&
            profile.segmentos_permitidos.length > 0
          ) {
            query = query.in("segmento", profile.segmentos_permitidos);
          }

          if (
            profile.estados_permitidos &&
            profile.estados_permitidos.length > 0
          ) {
            query = query.in("estado", profile.estados_permitidos);
          }
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        const pagina = (data || []) as Cliente[];
        todos.push(...pagina);

        if (pagina.length < tamanhoPagina) {
          break;
        }

        inicio += tamanhoPagina;
      }

      setClientes(todos);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar clientes:", err);
      setError(err?.message || "Erro ao carregar clientes.");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  return { clientes, loading, error, carregarClientes, setClientes };
}

export function useFiltragemClientes(clientes: Cliente[]) {
  const [buscaEmpresa, setBuscaEmpresa] = useState("");
  const [buscaCodigo, setBuscaCodigo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroSegmento, setFiltroSegmento] = useState("Todos");

  const [ordenacao, setOrdenacao] = useState<Ordenacao>({
    coluna: "empresa",
    direcao: "asc",
  });

  const alternarOrdenacao = (coluna: keyof Cliente | "cliente_nome") => {
    setOrdenacao((prev) => ({
      coluna,
      direcao:
        prev.coluna === coluna && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };

  const clientesFiltrados = useMemo(() => {
    const termoBusca = normalizarTexto(buscaEmpresa);
    const termoBuscaNumeros = somenteNumeros(buscaEmpresa);
    const termoCodigo = normalizarTexto(buscaCodigo);

    return clientes
      .filter((cliente) => {
        const empresa = normalizarTexto(cliente.empresa);
        const nomeFantasia = normalizarTexto(cliente.nome_fantasia);
        const razaoSocial = normalizarTexto(cliente.razao_social);
        const cnpjTexto = normalizarTexto(cliente.cnpj);
        const cnpjNumeros = somenteNumeros(cliente.cnpj);

        const matchEmpresa =
          !termoBusca ||
          empresa.includes(termoBusca) ||
          nomeFantasia.includes(termoBusca) ||
          razaoSocial.includes(termoBusca) ||
          cnpjTexto.includes(termoBusca) ||
          (!!termoBuscaNumeros && cnpjNumeros.includes(termoBuscaNumeros));

        const matchCodigo =
          !termoCodigo ||
          normalizarTexto(cliente.codigo_cliente).includes(termoCodigo);

        const matchStatus =
          filtroStatus === "Todos" || cliente.status === filtroStatus;

        const matchEstado =
          filtroEstado === "Todos" || cliente.estado === filtroEstado;

        const matchSegmento =
          filtroSegmento === "Todos" || cliente.segmento === filtroSegmento;

        return (
          matchEmpresa &&
          matchCodigo &&
          matchStatus &&
          matchEstado &&
          matchSegmento
        );
      })
      .sort((a, b) => {
        const valA = normalizarTexto(
          ordenacao.coluna === "cliente_nome"
            ? a.empresa
            : String(a[ordenacao.coluna as keyof Cliente] || "")
        );

        const valB = normalizarTexto(
          ordenacao.coluna === "cliente_nome"
            ? b.empresa
            : String(b[ordenacao.coluna as keyof Cliente] || "")
        );

        const comparacao = valA.localeCompare(valB, "pt-BR", {
          numeric: true,
          sensitivity: "base",
        });

        return ordenacao.direcao === "asc" ? comparacao : -comparacao;
      });
  }, [
    clientes,
    buscaEmpresa,
    buscaCodigo,
    filtroStatus,
    filtroEstado,
    filtroSegmento,
    ordenacao,
  ]);

  const estadosUnicos = useMemo(
    () =>
      Array.from(
        new Set(clientes.map((cliente) => cliente.estado).filter(Boolean))
      ).sort(),
    [clientes]
  );

  const segmentosUnicos = useMemo(
    () =>
      Array.from(
        new Set(clientes.map((cliente) => cliente.segmento).filter(Boolean))
      ).sort(),
    [clientes]
  );

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
  };
}