'use client';

import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import {
  FILTROS_FUNIL_ORCAMENTOS,
  FunilOrcamentoResumoStatus,
  useFunilOrcamentos
} from '../../hooks/useFunilOrcamentos';

type FunilOrcamentosProps = {
  isAdmin: boolean;
  refreshKey?: number;
};

const STATUS_VISUAL: Record<
  FunilOrcamentoResumoStatus['status'],
  {
    barra: string;
    texto: string;
    fundo: string;
    borda: string;
  }
> = {
  A: {
    barra: 'bg-blue-700',
    texto: 'text-blue-800',
    fundo: 'bg-blue-50',
    borda: 'border-blue-200'
  },
  B: {
    barra: 'bg-green-700',
    texto: 'text-green-800',
    fundo: 'bg-green-50',
    borda: 'border-green-200'
  },
  C: {
    barra: 'bg-red-700',
    texto: 'text-red-800',
    fundo: 'bg-red-50',
    borda: 'border-red-200'
  }
};

function formatarNumero(valor: number) {
  return valor.toLocaleString('pt-BR');
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
}

function FunilStatusCard({ item }: { item: FunilOrcamentoResumoStatus }) {
  const visual = STATUS_VISUAL[item.status];

  return (
    <article
      className={`h-[58px] rounded-2xl border ${visual.borda} ${visual.fundo} px-4 py-2`}
      aria-label={`${item.titulo}: ${formatarMoeda(
        item.valorTotal
      )}, ${formatarNumero(item.quantidadeOrcamentos)} orçamento(s), ${item.percentual}% do volume financeiro`}
    >
      <div className="flex h-full items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`truncate text-xs font-bold uppercase tracking-wide ${visual.texto}`}>
            {item.titulo}
          </h3>
          <p className="truncate text-[11px] font-medium text-slate-500">
            {formatarNumero(item.quantidadeOrcamentos)} orçamento(s)
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-extrabold leading-none text-slate-900">
            {formatarMoeda(item.valorTotal)}
          </p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            {item.percentual}%
          </p>
        </div>
      </div>
    </article>
  );
}

function FunilBarra({ item }: { item: FunilOrcamentoResumoStatus }) {
  const visual = STATUS_VISUAL[item.status];
  const largura = Math.max(item.percentual, item.quantidadeOrcamentos > 0 ? 6 : 0);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
        <span>{item.titulo}</span>
        <span>
          {formatarMoeda(item.valorTotal)} · {formatarNumero(item.quantidadeOrcamentos)} orçamento(s) · {item.percentual}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${visual.barra}`}
          style={{ width: `${largura}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default function FunilOrcamentos({
  isAdmin,
  refreshKey = 0
}: FunilOrcamentosProps) {
  const {
    resumo,
    opcoes,
    filtros,
    loading,
    error,
    setFiltroArea,
    setFiltroPeriodo,
    setFiltroMes,
    carregarFunilOrcamentos
  } = useFunilOrcamentos(isAdmin, refreshKey);

  if (loading && resumo.totalOrcamentos === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <LoadingSpinner label="Carregando funil comercial..." />
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="funil-orcamentos-titulo"
    >
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2
            id="funil-orcamentos-titulo"
            className="text-sm font-extrabold uppercase tracking-widest text-slate-800"
          >
            Funil comercial
          </h2>
          <p className="text-xs font-medium text-slate-500">
            Volume financeiro
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[170px_130px_140px_auto] sm:items-end">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Área
            </span>
            <select
              className="h-[30px] w-full rounded-lg border border-slate-300 bg-white px-[10px] py-0 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={filtros.area}
              onChange={(event) => setFiltroArea(event.target.value)}
              aria-label="Filtrar funil por área, coluna P ramo"
            >
              <option value={FILTROS_FUNIL_ORCAMENTOS.TODAS_AREAS}>
                Todas
              </option>
              {opcoes.areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Período
            </span>
            <select
              className="h-[30px] w-full rounded-lg border border-slate-300 bg-white px-[10px] py-0 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={filtros.periodo}
              onChange={(event) => setFiltroPeriodo(event.target.value)}
              aria-label="Filtrar funil por ano do período"
            >
              {isAdmin ? (
                <option value={FILTROS_FUNIL_ORCAMENTOS.TODOS_PERIODOS}>
                  Todos
                </option>
              ) : null}
              {opcoes.periodos.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Mês
            </span>
            <select
              className="h-[30px] w-full rounded-lg border border-slate-300 bg-white px-[10px] py-0 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={filtros.mes}
              onChange={(event) => setFiltroMes(event.target.value)}
              aria-label="Refinar funil por mês"
            >
              <option value={FILTROS_FUNIL_ORCAMENTOS.TODOS_MESES}>
                Todos
              </option>
              {opcoes.meses.map((mes) => (
                <option key={mes} value={mes}>
                  {FILTROS_FUNIL_ORCAMENTOS.MESES_NOMES[mes] || mes}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={carregarFunilOrcamentos}
            loading={loading}
            loadingText="Atualizando..."
          >
            Atualizar funil
          </Button>
        </div>
      </div>

      {error ? (
        <div
          className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
          role="alert"
        >
          Não foi possível atualizar o funil agora. Detalhe: {error}
        </div>
      ) : null}

      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        {resumo.status.map((item) => (
          <FunilStatusCard key={item.status} item={item} />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-3">
            {resumo.status.map((item) => (
              <FunilBarra key={item.status} item={item} />
            ))}
          </div>
        </div>

        <div className="h-[58px] rounded-2xl border border-slate-200 bg-white px-4 py-2">
          <div className="flex h-full items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-xs font-bold uppercase tracking-wide text-slate-600">
                Total analisado
              </h3>
              <p className="truncate text-[11px] font-medium text-slate-500">
                {formatarNumero(resumo.totalOrcamentos)} orçamento(s)
              </p>
            </div>
            <p className="shrink-0 text-base font-extrabold leading-none text-slate-900">
              {formatarMoeda(resumo.valorTotal)}
            </p>
          </div>
        </div>
      </div>

      {resumo.totalOrcamentos === 0 && !error ? (
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
          Nenhum orçamento encontrado para os filtros atuais.
        </p>
      ) : null}
    </section>
  );
}
