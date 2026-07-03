'use client';

import { FiltrosAuditoria } from '../../../hooks/useAuditoria';
import Button from '../../ui/Button';

type AuditoriaFiltrosProps = {
  filtros: FiltrosAuditoria;
  tabelas: string[];
  acoes: string[];
  origens: string[];
  loading?: boolean;
  onChange: (filtros: FiltrosAuditoria) => void;
  onAtualizar?: () => void;
};

const filtrosLimpos: FiltrosAuditoria = {
  dataInicio: '',
  dataFim: '',
  usuario: '',
  tabela: '',
  acao: '',
  origem: '',
  busca: '',
  limite: 500
};

function valorSelectTodas(valor: string) {
  return valor || '';
}

export default function AuditoriaFiltros({
  filtros,
  tabelas,
  acoes,
  origens,
  loading = false,
  onChange
}: AuditoriaFiltrosProps) {
  function alterarFiltro<K extends keyof FiltrosAuditoria>(
    campo: K,
    valor: FiltrosAuditoria[K]
  ) {
    onChange({
      ...filtros,
      [campo]: valor
    });
  }

  function limparFiltros() {
    onChange({
      ...filtrosLimpos,
      limite: filtros.limite || filtrosLimpos.limite
    });
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="auditoria-filtros-titulo"
    >
      <div className="mb-3">
        <h3
          id="auditoria-filtros-titulo"
          className="text-sm font-bold uppercase tracking-widest text-slate-500"
        >
          Filtros de auditoria
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Refine a lista de eventos por data, usuário, tabela, ação, origem ou texto.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-6">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Data inicial
          </span>
          <input
            type="date"
            value={filtros.dataInicio}
            disabled={loading}
            onChange={(event) =>
              alterarFiltro('dataInicio', event.target.value)
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            aria-label="Data inicial do filtro de auditoria"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Data final
          </span>
          <input
            type="date"
            value={filtros.dataFim}
            disabled={loading}
            onChange={(event) => alterarFiltro('dataFim', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            aria-label="Data final do filtro de auditoria"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Usuário
          </span>
          <input
            type="text"
            value={filtros.usuario}
            disabled={loading}
            onChange={(event) => alterarFiltro('usuario', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            placeholder="email"
            autoComplete="off"
            aria-label="Filtrar auditoria por usuário ou e-mail"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Tabela
          </span>
          <select
            value={filtros.tabela}
            disabled={loading}
            onChange={(event) =>
              alterarFiltro('tabela', valorSelectTodas(event.target.value))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            aria-label="Filtrar auditoria por tabela"
          >
            <option value="">Todas</option>
            {tabelas.map((tabela) => (
              <option key={tabela} value={tabela}>
                {tabela}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Ação
          </span>
          <select
            value={filtros.acao}
            disabled={loading}
            onChange={(event) =>
              alterarFiltro('acao', valorSelectTodas(event.target.value))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            aria-label="Filtrar auditoria por ação"
          >
            <option value="">Todas</option>
            {acoes.map((acao) => (
              <option key={acao} value={acao}>
                {acao}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Origem
          </span>
          <select
            value={filtros.origem}
            disabled={loading}
            onChange={(event) =>
              alterarFiltro('origem', valorSelectTodas(event.target.value))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            aria-label="Filtrar auditoria por origem"
          >
            <option value="">Todas</option>
            {origens.map((origem) => (
              <option key={origem} value={origem}>
                {origem}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-end">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Busca geral
          </span>
          <input
            type="search"
            value={filtros.busca}
            disabled={loading}
            onChange={(event) => alterarFiltro('busca', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            placeholder="buscar por texto"
            autoComplete="off"
            aria-label="Busca geral nos eventos de auditoria"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Limite
          </span>
          <select
            value={String(filtros.limite || 500)}
            disabled={loading}
            onChange={(event) =>
              alterarFiltro('limite', Number(event.target.value))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            aria-label="Quantidade máxima de eventos de auditoria"
          >
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
          </select>
        </label>

        <Button
          type="button"
          variant="secondary"
          onClick={limparFiltros}
          disabled={loading}
          aria-label="Limpar todos os filtros de auditoria"
        >
          Limpar
        </Button>
      </div>
    </section>
  );
}
