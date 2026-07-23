import { ReactNode } from 'react';

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export default function SectionCard({
  title,
  subtitle,
  children,
  actions,
  className = '',
  bodyClassName = ''
}: SectionCardProps) {
  const hasHeader = Boolean(title || subtitle || actions);

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? (
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                {title}
              </h3>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}

      <div className={bodyClassName || 'p-5'}>{children}</div>
    </section>
  );
}
