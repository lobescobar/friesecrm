import { ReactNode, useEffect, useRef } from 'react';

type ModalProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  bloquearFechamento?: boolean;
};

export default function Modal({
  title,
  subtitle,
  children,
  footer,
  onClose,
  bloquearFechamento = false
}: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !bloquearFechamento) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bloquearFechamento, onClose]);

  const tentarFechar = () => {
    if (!bloquearFechamento) {
      onClose();
      return;
    }

    const confirmar = window.confirm(
      'Existem alterações não salvas. Deseja sair sem salvar?'
    );

    if (confirmar) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={tentarFechar}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={tentarFechar}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {footer ? (
          <footer className="border-t border-slate-100 bg-white px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
