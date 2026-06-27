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
    {
      label: 'Clientes cadastrados',
      valor: total,
      apoio: 'Base total importada'
    },
    {
      label: 'Exibidos nos filtros',
      valor: filtrados,
      apoio: 'Resultado da busca atual'
    },
    {
      label: 'Com localização',
      valor: comCoordenadas,
      apoio: 'Disponíveis no mapa'
    },
    {
      label: 'Ativos',
      valor: ativos,
      apoio: 'Com atividade recente'
    }
  ];

  return (
    <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {indicadores.map((indicador) => (
        <div
          key={indicador.label}
          className="crm-card rounded-2xl p-4"
        >
          <p className="crm-label">{indicador.label}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-3xl font-extrabold tracking-tight text-slate-950">
              {indicador.valor.toLocaleString('pt-BR')}
            </p>
            <span className="h-2 w-10 rounded-full bg-[#c58a2a]" />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {indicador.apoio}
          </p>
        </div>
      ))}
    </section>
  );
}
