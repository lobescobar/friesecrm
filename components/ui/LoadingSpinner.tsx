type LoadingSpinnerProps = {
  label?: string;
};

export default function LoadingSpinner({ label = 'Carregando...' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-8 text-slate-500">
      <span className="animate-spin text-2xl">⏳</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
