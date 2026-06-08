import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfil = useCallback(async (userId: string, email: string) => {

    try {

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Se não existir perfil no banco
      if (!data) {

        const perfilTemporario = {
          id: userId,
          email,
          role: 'admin',
          segmentos_permitidos: [],
          estados_permitidos: []
        };

        setProfile(perfilTemporario as Profile);
        setLoading(false);
        return;
      }

      setProfile(data as Profile);

    } catch (err) {

      console.error('Erro geral:', err);

      const perfilTemporario = {
        id: userId,
        email,
        role: 'admin',
        segmentos_permitidos: [],
        estados_permitidos: []
      };

      setProfile(perfilTemporario as Profile);
    }

    setLoading(false);

  }, []);

  useEffect(() => {

    const verificarSessao = async () => {

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {

        setUser(session.user);

        await carregarPerfil(
          session.user.id,
          session.user.email || ''
        );

      } else {
        setLoading(false);
      }
    };

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {

      if (session) {

        setUser(session.user);

        await carregarPerfil(
          session.user.id,
          session.user.email || ''
        );

      } else {

        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();

  }, [carregarPerfil]);

  const isAdmin = !!profile && profile.role === 'admin';

  return {
    user,
    profile,
    loading,
    isAdmin
  };
}
