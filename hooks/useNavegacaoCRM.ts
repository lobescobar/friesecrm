'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AtualizacaoParametros,
  EstadoNavegacaoCRM
} from '../types/crmNavegacao';
import {
  escreverNavegacaoNaUrl,
  lerNavegacaoDaUrl,
  lerNavegacaoInicial,
  lerNavegacaoSalva,
  limparNavegacaoSalva,
  montarProximaNavegacao,
  navegacaoInicialPadrao,
  navegacoesIguais,
  salvarNavegacao,
  temParametrosDeNavegacaoNaUrl
} from '../utils/crmNavegacao';

export function useNavegacaoCRM() {
  const [navegacaoCRM, setNavegacaoCRM] =
    useState<EstadoNavegacaoCRM>(navegacaoInicialPadrao);
  const [navegacaoInicialCarregada, setNavegacaoInicialCarregada] =
    useState(false);
  const navegacaoCRMRef = useRef<EstadoNavegacaoCRM>(navegacaoCRM);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNavegacaoCRM(lerNavegacaoInicial());
      setNavegacaoInicialCarregada(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    navegacaoCRMRef.current = navegacaoCRM;

    if (!navegacaoInicialCarregada) {
      return;
    }

    if (navegacaoCRM.cliente) {
      salvarNavegacao(navegacaoCRM);
    }
  }, [navegacaoCRM, navegacaoInicialCarregada]);

  const atualizarParametrosNavegacao = useCallback(
    (atualizacoes: AtualizacaoParametros) => {
      const proximaNavegacao = montarProximaNavegacao(atualizacoes);

      escreverNavegacaoNaUrl(proximaNavegacao);
      salvarNavegacao(proximaNavegacao);
      setNavegacaoCRM(proximaNavegacao);
    },
    []
  );

  const resetarNavegacao = useCallback(() => {
    limparNavegacaoSalva();
    escreverNavegacaoNaUrl(navegacaoInicialPadrao);
    setNavegacaoCRM(navegacaoInicialPadrao);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const salvarEstadoAtualDaTela = () => {
      const navegacaoAtual = navegacaoCRMRef.current;

      if (navegacaoAtual.cliente) {
        salvarNavegacao(navegacaoAtual);
      }
    };

    const restaurarNavegacaoSalva = () => {
      const navegacaoUrl = lerNavegacaoDaUrl();
      const temNavegacaoUrl =
        navegacaoUrl.cliente || temParametrosDeNavegacaoNaUrl();
      const navegacaoRestaurada = temNavegacaoUrl
        ? navegacaoUrl
        : lerNavegacaoSalva();

      if (!navegacaoRestaurada.cliente) {
        return;
      }

      if (!temNavegacaoUrl) {
        escreverNavegacaoNaUrl(navegacaoRestaurada);
      }

      salvarNavegacao(navegacaoRestaurada);

      if (!navegacoesIguais(navegacaoCRMRef.current, navegacaoRestaurada)) {
        setNavegacaoCRM(navegacaoRestaurada);
      }
    };

    const aoMudarVisibilidade = () => {
      if (document.hidden) {
        salvarEstadoAtualDaTela();
        return;
      }

      window.setTimeout(restaurarNavegacaoSalva, 0);
    };

    const aoMostrarPagina = () => {
      window.setTimeout(restaurarNavegacaoSalva, 0);
    };

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.addEventListener('blur', salvarEstadoAtualDaTela);
    window.addEventListener('pagehide', salvarEstadoAtualDaTela);
    window.addEventListener('focus', aoMostrarPagina);
    window.addEventListener('pageshow', aoMostrarPagina);
    document.addEventListener('visibilitychange', aoMudarVisibilidade);

    return () => {
      window.removeEventListener('blur', salvarEstadoAtualDaTela);
      window.removeEventListener('pagehide', salvarEstadoAtualDaTela);
      window.removeEventListener('focus', aoMostrarPagina);
      window.removeEventListener('pageshow', aoMostrarPagina);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    };
  }, []);

  return {
    navegacaoCRM,
    navegacaoInicialCarregada,
    atualizarParametrosNavegacao,
    resetarNavegacao
  };
}
