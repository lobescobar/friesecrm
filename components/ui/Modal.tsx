'use client';

import { ReactNode, useEffect, useId, useMemo, useRef } from 'react';

type ModalProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  bloquearFechamento?: boolean;
  scrollKey?: string;
};

const SELETOR_FOCO =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function lerScrollSalvo(scrollKey?: string) {
  if (!scrollKey || typeof window === 'undefined') {
    return 0;
  }

  const valor = window.sessionStorage.getItem(`friese-crm:scroll:${scrollKey}`);
  const numero = Number(valor);

  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

function salvarScroll(scrollKey: string | undefined, scrollTop: number) {
  if (!scrollKey || typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(
    `friese-crm:scroll:${scrollKey}`,
    String(scrollTop)
  );
}

function elementoVisivel(elemento: HTMLElement) {
  return Boolean(
    elemento.offsetWidth ||
      elemento.offsetHeight ||
      elemento.getClientRects().length
  );
}

function obterElementosFocaveis(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(SELETOR_FOCO)).filter(
    (elemento) =>
      !elemento.hasAttribute('disabled') &&
      elemento.getAttribute('aria-hidden') !== 'true' &&
      elemento.tabIndex !== -1 &&
      elementoVisivel(elemento)
  );
}

export default function Modal({
  title,
  subtitle,
  children,
  footer,
  onClose,
  bloquearFechamento = false,
  scrollKey
}: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const conteudoRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const elementoFocadoAntesDoModalRef = useRef<HTMLElement | null>(null);
  const chaveScroll = useMemo(() => scrollKey, [scrollKey]);
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    elementoFocadoAntesDoModalRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      const elementoAnterior = elementoFocadoAntesDoModalRef.current;

      if (elementoAnterior && document.contains(elementoAnterior)) {
        window.setTimeout(() => {
          elementoAnterior.focus();
        }, 0);
      }
    };
  }, []);

  useEffect(() => {
    if (!chaveScroll) {
      return undefined;
    }

    const restaurarScroll = () => {
      window.setTimeout(() => {
        const elemento = conteudoRef.current;

        if (!elemento) {
          return;
        }

        elemento.scrollTop = lerScrollSalvo(chaveScroll);
      }, 0);
    };

    restaurarScroll();

    window.addEventListener('pageshow', restaurarScroll);
    window.addEventListener('focus', restaurarScroll);

    return () => {
      window.removeEventListener('pageshow', restaurarScroll);
      window.removeEventListener('focus', restaurarScroll);
    };
  }, [chaveScroll]);

  useEffect(() => {
    if (!chaveScroll) {
      return undefined;
    }

    const salvarScrollAtual = () => {
      const elemento = conteudoRef.current;

      if (elemento) {
        salvarScroll(chaveScroll, elemento.scrollTop);
      }
    };

    window.addEventListener('blur', salvarScrollAtual);
    window.addEventListener('pagehide', salvarScrollAtual);

    const aoMudarVisibilidade = () => {
      if (document.hidden) {
        salvarScrollAtual();
      }
    };

    document.addEventListener('visibilitychange', aoMudarVisibilidade);

    return () => {
      window.removeEventListener('blur', salvarScrollAtual);
      window.removeEventListener('pagehide', salvarScrollAtual);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    };
  }, [chaveScroll]);

  const tentarFechar = () => {
    if (!bloquearFechamento) {
      onCloseRef.current();
      return;
    }

    const confirmar = window.confirm(
      'Existem alterações não salvas. Deseja sair sem salvar?'
    );

    if (confirmar) {
      onCloseRef.current();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !bloquearFechamento) {
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const elementosFocaveis = obterElementosFocaveis(modalRef.current);

      if (!elementosFocaveis.length) {
        event.preventDefault();
        return;
      }

      const primeiro = elementosFocaveis[0];
      const ultimo = elementosFocaveis[elementosFocaveis.length - 1];
      const elementoAtivo = document.activeElement;

      if (!modalRef.current?.contains(elementoAtivo)) {
        primeiro.focus();
        event.preventDefault();
        return;
      }

      if (event.shiftKey && elementoAtivo === primeiro) {
        ultimo.focus();
        event.preventDefault();
        return;
      }

      if (!event.shiftKey && elementoAtivo === ultimo) {
        primeiro.focus();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bloquearFechamento]);

  const salvarScrollDoConteudo = () => {
    const elemento = conteudoRef.current;

    if (elemento) {
      salvarScroll(chaveScroll, elemento.scrollTop);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      <section
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div>
            <h2 id={titleId} className="text-xl font-bold text-slate-900">
              {title}
            </h2>
            {subtitle ? (
              <p id={subtitleId} className="mt-1 text-sm text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={tentarFechar}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            aria-label={`Fechar ${title}`}
          >
            ✕
          </button>
        </header>

        <div
          ref={conteudoRef}
          className="flex-1 overflow-y-auto p-6"
          onScroll={salvarScrollDoConteudo}
        >
          {children}
        </div>

        {footer ? (
          <footer className="border-t border-slate-100 bg-white px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
