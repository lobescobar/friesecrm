type LoadingSpinnerProps = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  surface?: 'none' | 'card';
};

const sizes = {
  sm: {
    container: 'gap-2 p-3',
    spinner: 'h-4 w-4',
    text: 'text-xs'
  },
  md: {
    container: 'gap-3 p-6',
    spinner: 'h-5 w-5',
    text: 'text-sm'
  },
  lg: {
    container: 'gap-3 p-8',
    spinner: 'h-6 w-6',
    text: 'text-base'
  }
};

export default function LoadingSpinner({
  label = 'Carregando...',
  size = 'md',
  surface = 'card'
}: LoadingSpinnerProps) {
  const estilos = sizes[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center text-slate-500 ${
        estilos.container
      } ${surface === 'card' ? 'rounded-2xl bg-white' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block animate-spin rounded-full border-2 border-slate-400 border-r-transparent ${estilos.spinner}`}
      />
      <span className={`font-medium ${estilos.text}`}>{label}</span>
    </div>
  );
}
