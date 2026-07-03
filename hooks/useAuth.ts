import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import {
  CACHE_TTL_CURTO_MS,
  lerCacheSessao,
  limparCachesCRM,
  removerCacheSessao,
  salvarCacheSessao
} from '../utils/sessionCache';

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado.';
}

const CHAVE_CACHE_AUTH_PROFILE = 'auth-profile';

function lerPerfilInicial() {
  return lerCacheSessao<Profile>(CHAVE_CACHE_AUTH_PROFILE, CACHE_TTL_CURTO_MS);
}

export function useAuth() {
  const perfilInicial = lerPerfilInicial();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(perfilInicial);
  const [loading, setLoading] = useState(!perfilInicial);
  const [error, setError] = useState<string | null>(null);

  const userIdRef = useRef<string | null>(null);
  const profileRef = useRef<Profile | null>(perfilInicial);
  const requisicaoAtualRef = useRef(0);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const carregarPerfil = useCallback(async (userId: string, email: string) => {
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

      return createdData as Profile;
    }

    if (erroBusca) {
      throw erroBusca;
    }

    return data as Profile;
  }, []);

  const aplicarSessao = useCallback(
    async (session: Session | null, options?: { forcarPerfil?: boolean; mostrarLoading?: boolean }) => {
      const idRequisicao = requisicaoAtualRef.current + 1;
      requisicaoAtualRef.current = idRequisicao;

      if (!session) {
        setUser(null);
        setProfile(null);
        limparCachesCRM();
        removerCacheSessao(CHAVE_CACHE_AUTH_PROFILE);
        setError(null);
        setLoading(false);
        return;
      }

      const mesmoUsuario = userIdRef.current === session.user.id;
      const perfilJaCarregado = Boolean(profileRef.current);

      setUser(session.user);

      if (mesmoUsuario && perfilJaCarregado && !options?.forcarPerfil) {
        setLoading(false);
        return;
      }

      if (options?.mostrarLoading ?? true) {
        if (!profileRef.current) {
          setLoading(true);
        }
      }

      try {
        const perfil = await carregarPerfil(
          session.user.id,
          session.user.email || ''
        );

        if (requisicaoAtualRef.current === idRequisicao) {
          setProfile(perfil);
          salvarCacheSessao(CHAVE_CACHE_AUTH_PROFILE, perfil);
          setError(null);
        }
      } catch (err) {
        if (requisicaoAtualRef.current === idRequisicao) {
          setProfile(null);
          removerCacheSessao(CHAVE_CACHE_AUTH_PROFILE);
          setError(mensagemErro(err));
        }
      } finally {
        if (requisicaoAtualRef.current === idRequisicao) {
          setLoading(false);
        }
      }
    },
    [carregarPerfil]
  );

  useEffect(() => {
    let ativo = true;
    let timerAuth: ReturnType<typeof setTimeout> | null = null;

    async function verificarSessaoInicial() {
      setLoading(true);

      try {
        const {
          data: { session },
          error: erroSessao
        } = await supabase.auth.getSession();

        if (erroSessao) {
          throw erroSessao;
        }

        if (ativo) {
          await aplicarSessao(session, {
            forcarPerfil: true,
            mostrarLoading: !profileRef.current
          });
        }
      } catch (err) {
        if (ativo) {
          setUser(null);
          setProfile(null);
          limparCachesCRM();
          removerCacheSessao(CHAVE_CACHE_AUTH_PROFILE);
          setError(mensagemErro(err));
          setLoading(false);
        }
      }
    }

    verificarSessaoInicial();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (timerAuth) {
        clearTimeout(timerAuth);
      }

      timerAuth = setTimeout(() => {
        if (!ativo) {
          return;
        }

        if (event === 'TOKEN_REFRESHED' && session && profileRef.current) {
          setUser(session.user);
          setLoading(false);
          return;
        }

        void aplicarSessao(session, {
          forcarPerfil: event === 'SIGNED_IN' || event === 'USER_UPDATED',
          mostrarLoading: event !== 'TOKEN_REFRESHED'
        });
      }, 0);
    });

    return () => {
      ativo = false;

      if (timerAuth) {
        clearTimeout(timerAuth);
      }

      subscription.unsubscribe();
    };
  }, [aplicarSessao]);

  const isAdmin = profile?.role === 'admin';

  return { user, profile, loading, error, isAdmin };
}
