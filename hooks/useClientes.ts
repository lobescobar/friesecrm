import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Cliente, Profile } from "../types";

export function useClientes(profile: Profile | null) {

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarClientes = useCallback(async () => {

    if (!profile) {
      setClientes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from("clientes")
      .select("*");

    // ADMIN vê todos os clientes
    // VENDEDOR vê somente os liberados

    if (profile.role !== "admin") {

      if (
        profile.estados_permitidos &&
        profile.estados_permitidos.length > 0
      ) {
        query = query.in(
          "estado",
          profile.estados_permitidos
        );
      }

      if (
        profile.segmentos_permitidos &&
        profile.segmentos_permitidos.length > 0
      ) {
        query = query.in(
          "segmento",
          profile.segmentos_permitidos
        );
      }
    }

    const { data, error } = await query.order(
      "empresa",
      { ascending: true }
    );

    if (error) {

      console.warn(
        "Erro ao carregar clientes:",
        error?.message || error
      );

      setError(
        error.message ||
        "Erro ao carregar clientes."
      );

      setClientes([]);
      setLoading(false);
      return;
    }

    setClientes((data || []) as Cliente[]);
    setLoading(false);

  }, [profile]);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  return {
    clientes,
    setClientes,
    loading,
    error,
    carregarClientes,
  };
}

export function useFiltragemClientes(
  clientes: Cliente[]
) {

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState("Todos");

  const [filtroEstado, setFiltroEstado] =
    useState("Todos");

  const [filtroSegmento, setFiltroSegmento] =
    useState("Todos");

  const clientesFiltrados = clientes.filter(
    (cliente) => {

      const textoBusca =
        busca.toLowerCase();

      const passaBusca =
        !busca ||

        cliente.empresa
          ?.toLowerCase()
          .includes(textoBusca) ||

        cliente.cidade
          ?.toLowerCase()
          .includes(textoBusca) ||

        cliente.estado
          ?.toLowerCase()
          .includes(textoBusca) ||

        cliente.codigo_cliente
          ?.toLowerCase()
          .includes(textoBusca);

      const passaStatus =
        filtroStatus === "Todos" ||
        cliente.status === filtroStatus;

      const passaEstado =
        filtroEstado === "Todos" ||
        cliente.estado === filtroEstado;

      const passaSegmento =
        filtroSegmento === "Todos" ||
        cliente.segmento === filtroSegmento;

      return (
        passaBusca &&
        passaStatus &&
        passaEstado &&
        passaSegmento
      );
    }
  );

  const segmentosUnicos = Array.from(
    new Set(
      clientes
        .map((cliente) => cliente.segmento)
        .filter(Boolean)
    )
  );

  const estadosUnicos = Array.from(
    new Set(
      clientes
        .map((cliente) => cliente.estado)
        .filter(Boolean)
    )
  );

  return {

    busca,
    setBusca,

    filtroStatus,
    setFiltroStatus,

    filtroEstado,
    setFiltroEstado,

    filtroSegmento,
    setFiltroSegmento,

    clientesFiltrados,

    segmentosUnicos,
    estadosUnicos,
  };
}
