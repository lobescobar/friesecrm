import { ReactNode } from 'react';

type EmptyStateVariant = 'default' | 'info' | 'warning' | 'danger' | 'success';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  variant?: EmptyStateVariant;
  compact?: boolean;
  role?: 'status' | 'alert';
};

const variants: Record<EmptyStateVariant, string> = {
  default: 'border-slate-300 bg-slate-50 text-slate-600',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-700'
};

const titleVariants: Record<EmptyStateVariant, string> = {
  default: 'text-slate-900',
  info: 'text-blue-950',
  warning: 'text-amber-950',
  danger: 'text-red-950',
  success: 'text-green-950'
};

export default function EmptyState({
  title,
  description,
  action,
  icon = '🔎',
  variant = 'default',
  compact = false,
  role = 'status'
}: EmptyStateProps) {
  return (
    <div
      role={role}
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center ${
        compact ? 'py-6' : 'py-10'
      } ${variants[variant]}`}
    >
      <div className="mb-3 text-3xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className={`text-base font-bold ${titleVariants[variant]}`}>
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
