import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-[#0b1225] bg-[#0b1225] text-white shadow-sm hover:bg-[#172033] hover:border-[#172033]',
  secondary:
    'border-slate-300 bg-white text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50',
  danger:
    'border-red-600 bg-red-600 text-white shadow-sm hover:border-red-700 hover:bg-red-700',
  ghost:
    'border-transparent bg-transparent text-slate-700 hover:bg-slate-100',
  success:
    'border-green-600 bg-green-600 text-white shadow-sm hover:border-green-700 hover:bg-green-700'
};

export default function Button({
  variant = 'primary',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
