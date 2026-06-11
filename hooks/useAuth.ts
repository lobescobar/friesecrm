import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfil = useCallback(async (userId: string, email: string) => {
    // Tenta buscar o perfil
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Se não existir (erro PGRST116 é "no rows found"), cria um perfil na hora
    if (error && (error.code === 'PGRST116' || error.message.includes('no rows'))) {
      const novoPerfil = {
        id: userId,
        email: email,
        role: 'vendedor',
        segmentos_permitidos: [],
        estados_permitidos: []
      };
      
      const { data: createdData, error: createError } = await supabase
        .from('profiles')
        .insert([novoPerfil])
        .select()
        .single();
        
      if (!createError) {
        setProfile(createdData as Profile);
      }
    } else if (!error && data) {
      setProfile(data as Profile);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await carregarPerfil(session.user.id, session.user.email || '');
      } else {
        setLoading(false);
      }
    };

    verificarSessao();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
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

  const isAdmin = !!profile && profile.role === 'admin';

  return { user, profile, loading, isAdmin };
}
