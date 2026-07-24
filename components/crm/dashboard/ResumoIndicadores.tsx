import { Cliente } from '../../../types';

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
      label: 'Com localizaÃ§Ã£o',
      valor: comCoordenadas,
      apoio: 'DisponÃ­veis no mapa'
    },
    {
      label: 'Ativos',
      valor: ativos,
      apoio: 'Com atividade recente'
    }
  ];

  return (
    <section
      className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Resumo de clientes"
    >
      {indicadores.map((indicador) => (
        <div
          key={indicador.label}
          className="crm-card flex h-[58px] items-center justify-between gap-3 rounded-2xl px-4 py-2"
          aria-label={`${indicador.label}: ${indicador.valor.toLocaleString(
            'pt-BR'
          )}. ${indicador.apoio}.`}
        >
          <div className="min-w-0">
            <p className="crm-label truncate text-[10px] leading-3">
              {indicador.label}
            </p>
            <p className="mt-1 text-2xl font-extrabold leading-6 tracking-tight text-slate-950">
              {indicador.valor.toLocaleString('pt-BR')}
            </p>
          </div>

          <span
            className="h-1.5 w-8 shrink-0 rounded-full bg-[#c58a2a]"
            aria-hidden="true"
          />
        </div>
      ))}
    </section>
  );
}

