const CACHE_PREFIXO = 'friese-crm:cache:';
const PREFIXO_SCROLL_CRM = 'friese-crm:scroll:';
const CHAVE_NAVEGACAO_CRM = 'friese-crm:navegacao-atual';
const CACHE_TTL_PADRAO_MS = 10 * 60 * 1000;

type CacheEnvelope<T> = {
  salvoEm: number;
  valor: T;
};

function montarChave(chave: string) {
  return `${CACHE_PREFIXO}${chave}`;
}

export function lerCacheSessao<T>(
  chave: string,
  ttlMs = CACHE_TTL_PADRAO_MS
): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const bruto = window.sessionStorage.getItem(montarChave(chave));

    if (!bruto) {
      return null;
    }

    const envelope = JSON.parse(bruto) as CacheEnvelope<T>;

    if (!envelope || typeof envelope.salvoEm !== 'number') {
      return null;
    }

    const expirou = Date.now() - envelope.salvoEm > ttlMs;

    if (expirou) {
      window.sessionStorage.removeItem(montarChave(chave));
      return null;
    }

    return envelope.valor;
  } catch (erro) {
    console.warn('Não foi possível ler cache de sessão:', chave, erro);
    return null;
  }
}

export function salvarCacheSessao<T>(chave: string, valor: T) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const envelope: CacheEnvelope<T> = {
      salvoEm: Date.now(),
      valor
    };

    window.sessionStorage.setItem(montarChave(chave), JSON.stringify(envelope));
  } catch (erro) {
    console.warn('Não foi possível salvar cache de sessão:', chave, erro);
  }
}

export function removerCacheSessao(chave: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(montarChave(chave));
}

export function limparCachesCRM() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const chavesParaRemover: string[] = [];

    for (let indice = 0; indice < window.sessionStorage.length; indice += 1) {
      const chave = window.sessionStorage.key(indice);

      if (
        chave &&
        (chave.startsWith(CACHE_PREFIXO) ||
          chave.startsWith(PREFIXO_SCROLL_CRM) ||
          chave === CHAVE_NAVEGACAO_CRM)
      ) {
        chavesParaRemover.push(chave);
      }
    }

    chavesParaRemover.forEach((chave) => {
      window.sessionStorage.removeItem(chave);
    });
  } catch (erro) {
    console.warn('Não foi possível limpar caches do CRM:', erro);
  }
}

export const CACHE_TTL_CURTO_MS = 5 * 60 * 1000;
export const CACHE_TTL_MEDIO_MS = 10 * 60 * 1000;
