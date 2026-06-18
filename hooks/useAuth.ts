import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado.';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarPerfil = useCallback(async (userId: string, email: string) => {
    try {
      setError(null);

      const { data, error: erroBusca } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (
        erroBusca &&
        (erroBusca.code === 'PGRST116' || erroBusca.message.includes('no rows'))
      ) {
        const novoPerfil = {
          id: userId,
          email,
          role: 'vendedor',
          segmentos_permitidos: [],
          estados_permitidos: []
        };

        const { data: createdData, error: createError } = await supabase
          .from('profiles')
          .insert([novoPerfil])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        setProfile(createdData as Profile);
        return;
      }

      if (erroBusca) {
        throw erroBusca;
      }

      setProfile(data as Profile);
    } catch (err) {
      setError(mensagemErro(err));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const verificarSessao = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
        await carregarPerfil(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    verificarSessao();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setLoading(true);
        setUser(session.user);
        await carregarPerfil(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [carregarPerfil]);

  const isAdmin = profile?.role === 'admin';

  return { user, profile, loading, error, isAdmin };
}
