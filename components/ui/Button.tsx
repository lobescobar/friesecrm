import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
  success: 'bg-green-600 text-white hover:bg-green-700 border-green-600'
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
