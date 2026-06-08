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

    let query = supabase.from("clientes").select("*");

    if (profile.role !== "admin") {
      const semEstados =
        !profile.estados_permitidos ||
        profile.estados_permitidos.length === 0;

      const semSegmentos =
        !profile.segmentos_permitidos ||
        profile.segmentos_permitidos.length === 0;

      if (semEstados || semSegmentos) {
        setClientes([]);
        setLoading(false);
        return;
      }

      query = query.in("estado", profile.estados_permitidos);
      query = query.in("segmento", profile.segmentos_permitidos);
    }

    const { data, error } = await query.order("empresa", {
      ascending: true,
    });

    if (error) {
      console.warn("Erro ao carregar clientes:", error?.message || error);
      setError(error.message || "Erro ao carregar clientes.");
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