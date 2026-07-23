'use client';

export type ClienteModalSecao =
  | 'dados'
  | 'contatos'
  | 'historico'
  | 'observacoes';

type ClienteModalNavProps = {
  secaoAtiva: ClienteModalSecao;
  onChange: (secao: ClienteModalSecao) => void;
};

const secoes: Array<{
  id: ClienteModalSecao;
  label: string;
  descricao: string;
}> = [
  {
    id: 'dados',
    label: 'Dados',
    descricao: 'cadastro'
  },
  {
    id: 'contatos',
    label: 'Contatos',
    descricao: 'pessoas'
  },
  {
    id: 'historico',
    label: 'Histórico',
    descricao: 'orçamentos'
  },
  {
    id: 'observacoes',
    label: 'Observações',
    descricao: 'anotações'
  }
];

export default function ClienteModalNav({
  secaoAtiva,
  onChange
}: ClienteModalNavProps) {
  return (
    <nav
      aria-label="Seções do cliente"
      className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-sm lg:overflow-visible"
    >
      <div className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
        {secoes.map((secao) => {
          const ativo = secaoAtiva === secao.id;

          return (
            <button
              key={secao.id}
              type="button"
              onClick={() => onChange(secao.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                ativo
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-bold">{secao.label}</span>
              <span
                className={`mt-0.5 hidden text-xs lg:block ${
                  ativo ? 'text-slate-200' : 'text-slate-400'
                }`}
              >
                {secao.descricao}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
