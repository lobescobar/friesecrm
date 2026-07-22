import { ReactNode } from 'react';

type StatusMessageVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

type StatusMessageProps = {
  children: ReactNode;
  title?: string;
  variant?: StatusMessageVariant;
  live?: 'polite' | 'assertive' | 'off';
  className?: string;
};

const variants: Record<StatusMessageVariant, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700'
};

export default function StatusMessage({
  children,
  title,
  variant = 'neutral',
  live,
  className = ''
}: StatusMessageProps) {
  const role = variant === 'danger' ? 'alert' : 'status';

  return (
    <div
      role={role}
      aria-live={live || (variant === 'danger' ? 'assertive' : 'polite')}
      className={`rounded-2xl border px-4 py-3 text-sm ${variants[variant]} ${className}`}
    >
      {title ? <p className="font-bold">{title}</p> : null}
      <div className={title ? 'mt-1' : ''}>{children}</div>
    </div>
  );
}
