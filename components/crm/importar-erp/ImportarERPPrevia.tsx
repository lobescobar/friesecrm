import { ClienteImportacao } from '../../../types/importacaoERP';

type ImportarERPPreviaProps = {
  clientes: ClienteImportacao[];
};

export default function ImportarERPPrevia({ clientes }: ImportarERPPreviaProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-2">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-900">
          Prévia dos primeiros 20 registros
        </h3>
      </div>

      <div className="max-h-72 overflow-auto">
        <table className="w-full text-xs">
          <caption className="sr-only">
            Prévia dos primeiros vinte clientes identificados na planilha ERP.
          </caption>
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">
                Código
              </th>
              <th scope="col" className="px-3 py-2 text-left">
                Cliente
              </th>
              <th scope="col" className="px-3 py-2 text-left">
                CNPJ
              </th>
              <th scope="col" className="px-3 py-2 text-left">
                Segmento
              </th>
              <th scope="col" className="px-3 py-2 text-left">
                Cidade/UF
              </th>
            </tr>
          </thead>
          <tbody>
            {clientes.slice(0, 20).map((cliente) => (
              <tr key={cliente.codigo_cliente} className="border-t">
                <td className="px-3 py-2 font-mono">
                  {cliente.codigo_cliente}
                </td>
                <td className="px-3 py-2">{cliente.empresa}</td>
                <td className="px-3 py-2">{cliente.cnpj || '-'}</td>
                <td className="px-3 py-2">{cliente.segmento || '-'}</td>
                <td className="px-3 py-2">
                  {[cliente.cidade, cliente.estado].filter(Boolean).join(' - ') || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
