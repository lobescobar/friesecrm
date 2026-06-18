import { Cliente, Ordenacao } from '../../types';
import BadgeStatus from '../ui/BadgeStatus';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import ClienteCardMobile from './ClienteCardMobile';

type TabelaClientesProps = {
  clientes: Cliente[];
  totalClientes: number;
  ordenacao: Ordenacao;
  onOrdenar: (coluna: keyof Cliente | 'cliente_nome') => void;
  onSelecionarCliente: (cliente: Cliente) => void;
  onLimparFiltros: () => void;
};

function IconeSort({
  coluna,
  ordenacao
}: {
  coluna: keyof Cliente | 'cliente_nome';
  ordenacao: Ordenacao;
}) {
  return (
    <span
      className={`ml-1 text-[10px] ${
        ordenacao.coluna === coluna ? 'text-slate-900' : 'opacity-30'
      }`}
    >
      {ordenacao.coluna === coluna
        ? ordenacao.direcao === 'asc'
          ? '▲'
          : '▼'
        : '⇅'}
    </span>
  );
}

export default function TabelaClientes({
  clientes,
  totalClientes,
  ordenacao,
  onOrdenar,
  onSelecionarCliente,
  onLimparFiltros
}: TabelaClientesProps) {
  if (totalClientes === 0) {
    return (
      <div className="p-5">
        <EmptyState
          title="Nenhum cliente cadastrado"
          description="Importe uma planilha ERP ou cadastre clientes para começar a usar o CRM."
        />
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          title="Nenhum cliente encontrado com estes filtros"
          description="Ajuste a busca, remova filtros ou limpe todos os filtros ativos."
          action={
            <Button type="button" variant="secondary" onClick={onLimparFiltros}>
              Limpar filtros
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 p-4 md:hidden">
        {clientes.map((cliente) => (
          <ClienteCardMobile
            key={cliente.id}
            cliente={cliente}
            onSelecionar={onSelecionarCliente}
          />
        ))}
      </div>

      <div className="hidden overflow-auto md:block md:max-h-[540px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
            <tr>
              <th
                className="cursor-pointer px-4 py-3 text-left font-semibold hover:bg-slate-100"
                onClick={() => onOrdenar('codigo_cliente')}
              >
                Cód. ERP <IconeSort coluna="codigo_cliente" ordenacao={ordenacao} />
              </th>

              <th
                className="cursor-pointer px-4 py-3 text-left font-semibold hover:bg-slate-100"
                onClick={() => onOrdenar('segmento')}
              >
                Segmento <IconeSort coluna="segmento" ordenacao={ordenacao} />
              </th>

              <th
                className="cursor-pointer px-4 py-3 text-left font-semibold hover:bg-slate-100"
                onClick={() => onOrdenar('cliente_nome')}
              >
                Cliente <IconeSort coluna="cliente_nome" ordenacao={ordenacao} />
              </th>

              <th
                className="cursor-pointer px-4 py-3 text-left font-semibold hover:bg-slate-100"
                onClick={() => onOrdenar('cidade')}
              >
                Cidade <IconeSort coluna="cidade" ordenacao={ordenacao} />
              </th>

              <th
                className="cursor-pointer px-4 py-3 text-left font-semibold hover:bg-slate-100"
                onClick={() => onOrdenar('status')}
              >
                Status <IconeSort coluna="status" ordenacao={ordenacao} />
              </th>
            </tr>
          </thead>

          <tbody>
            {clientes.map((cliente) => (
              <tr
                key={cliente.id}
                onClick={() => onSelecionarCliente(cliente)}
                className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {cliente.codigo_cliente || '-'}
                </td>

                <td className="px-4 py-3 font-medium text-slate-600">
                  {cliente.segmento || '-'}
                </td>

                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{cliente.empresa}</p>
                  {cliente.razao_social && cliente.razao_social !== cliente.empresa ? (
                    <p className="text-xs text-slate-400">{cliente.razao_social}</p>
                  ) : null}
                </td>

                <td className="px-4 py-3">
                  {[cliente.cidade, cliente.estado].filter(Boolean).join(' - ') || '-'}
                </td>

                <td className="px-4 py-3">
                  <BadgeStatus status={cliente.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
