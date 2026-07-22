import * as React from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary: ação principal — salvar, confirmar, cadastrar.
   * secondary: ação neutra — fechar, cancelar, voltar, limpar.
   * success: ação positiva/importação — importar, concluir, ativar.
   * danger: ação destrutiva/crítica — excluir, remover, desativar.
   * ghost: ação discreta — editar, abrir, histórico, detalhes.
   */
  variant?: ButtonVariant;
  /**
   * sm: ações compactas em tabela/linha.
   * md: padrão geral do CRM.
   * lg: ação principal destacada.
   */
  size?: ButtonSize;
  /**
   * Exibe estado de carregamento, bloqueia novo clique e mantém o botão acessível.
   */
  loading?: boolean;
  /**
   * Texto exibido durante o carregamento.
   * Exemplo: "Salvando...", "Importando...".
   */
  loadingText?: string;
  /**
   * Ocupa 100% da largura disponível quando necessário em mobile/cards.
   */
  fullWidth?: boolean;
  /**
   * Ícone ou elemento antes do texto.
   */
  leftIcon?: React.ReactNode;
  /**
   * Ícone ou elemento depois do texto.
   */
  rightIcon?: React.ReactNode;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold " +
  "transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58A2A] focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-[#0F172A] bg-[#0F172A] text-white shadow-sm " +
    "hover:bg-[#111827] hover:border-[#111827] active:bg-[#020617]",
  secondary:
    "border-slate-300 bg-white text-slate-800 shadow-sm " +
    "hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100",
  success:
    "border-[#16A34A] bg-[#16A34A] text-white shadow-sm " +
    "hover:bg-[#15803D] hover:border-[#15803D] active:bg-[#166534]",
  danger:
    "border-[#DC2626] bg-[#DC2626] text-white shadow-sm " +
    "hover:bg-[#B91C1C] hover:border-[#B91C1C] active:bg-[#991B1B]",
  ghost:
    "border-transparent bg-transparent text-slate-700 " +
    "hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200",
};

const compactButtonClasses =
  "h-[30px] min-h-[30px] px-[10px] py-0 text-sm leading-none whitespace-nowrap";

const sizeClasses: Record<ButtonSize, string> = {
  sm: compactButtonClasses,
  md: compactButtonClasses,
  lg: compactButtonClasses,
};

function joinClasses(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      fullWidth = false,
      leftIcon,
      loading = false,
      loadingText,
      rightIcon,
      size = "md",
      type = "button",
      variant = "primary",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const visibleText = loading ? loadingText ?? "Carregando..." : children;

    return (
      <button
        ref={ref}
        type={type}
        className={joinClasses(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
            />
          </svg>
        ) : (
          leftIcon
        )}

        {visibleText ? <span>{visibleText}</span> : null}

        {!loading ? rightIcon : null}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
