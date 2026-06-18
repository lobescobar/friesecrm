import { Cliente } from '../../types';

type ResumoIndicadoresProps = {
  clientes: Cliente[];
  clientesFiltrados: Cliente[];
};

export default function ResumoIndicadores({
  clientes,
  clientesFiltrados
}: ResumoIndicadoresProps) {
  const total = clientes.length;
  const filtrados = clientesFiltrados.length;
  const comCoordenadas = clientes.filter(
    (cliente) => cliente.latitude && cliente.longitude
  ).length;
  const ativos = clientes.filter((cliente) => cliente.status === 'Ativo').length;

  const indicadores = [
    { label: 'Clientes cadastrados', valor: total },
    { label: 'Exibidos nos filtros', valor: filtrados },
    { label: 'Com localização', valor: comCoordenadas },
    { label: 'Ativos', valor: ativos }
  ];

  return (
    <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {indicadores.map((indicador) => (
        <div
          key={indicador.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {indicador.label}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {indicador.valor.toLocaleString('pt-BR')}
          </p>
        </div>
      ))}
    </section>
  );
}
