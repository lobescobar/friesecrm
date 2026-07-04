'use client';

import type { AreaCRM, AreaNavegacaoCRM } from '../../../types/crmNavegacao';

const areasCRM: AreaNavegacaoCRM[] = [
  {
    id: 'orcamentos',
    titulo: 'Orçamentos',
    descricao: 'Abertos'
  },
  {
    id: 'clientes',
    titulo: 'Clientes',
    descricao: 'Filtros e cadastro'
  },
  {
    id: 'mapa',
    titulo: 'Mapa',
    descricao: 'Localização'
  },
  {
    id: 'administracao',
    titulo: 'Administração',
    descricao: 'Usuários',
    adminOnly: true
  },
  {
    id: 'auditoria',
    titulo: 'Auditoria',
    descricao: 'Registros',
    adminOnly: true
  }
];

type NavegacaoAreasCRMProps = {
  areaAtiva: AreaCRM;
  isAdmin: boolean;
  onChange: (area: AreaCRM) => void;
};

export default function NavegacaoAreasCRM({
  areaAtiva,
  isAdmin,
  onChange
}: NavegacaoAreasCRMProps) {
  const areasVisiveis = areasCRM.filter((area) => !area.adminOnly || isAdmin);

  return (
    <nav
      aria-label="Áreas do CRM"
      className="crm-card mb-4 rounded-3xl p-3"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {areasVisiveis.map((area) => {
          const ativa = areaAtiva === area.id;

          return (
            <button
              key={area.id}
              type="button"
              onClick={() => onChange(area.id)}
              aria-current={ativa ? 'page' : undefined}
              className={`min-h-20 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                ativa
                  ? 'border-[#c58a2a] bg-[#fff7e8] text-slate-950 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-extrabold">
                {area.titulo}
              </span>
              <span className="mt-1 block text-xs font-medium text-slate-500">
                {area.descricao}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
