'use client';

import { useEffect, useRef, useState } from 'react';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import {
  FILTROS_FUNIL_ORCAMENTOS,
  FunilMetaVendedor,
  FunilOrcamentoResumoStatus,
  FunilMetasResumo,
  useFunilOrcamentos
} from '../../../hooks/useFunilOrcamentos';

type FunilOrcamentosProps = {
  isAdmin: boolean;
  refreshKey?: number;
};

type OpcaoFiltroMultiplo = {
  valor: string;
  rotulo: string;
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

function formatarPercentual(valor: number) {
  return `${formatarNumero(valor)}%`;
}

function classeSaldo(valor: number) {
  if (valor >= 0) {
    return 'text-green-700';
  }

  return 'text-red-700';
}

function descreverFiltroMultiplo(
  valores: string[],
  opcoes: OpcaoFiltroMultiplo[],
  valorTodos: string,
  rotuloTodos: string
) {
  if (valores.includes(valorTodos) || valores.length === 0) {
    return rotuloTodos;
  }

  if (valores.length === 1) {
    return (
      opcoes.find((opcao) => opcao.valor === valores[0])?.rotulo || valores[0]
    );
  }

  return `${valores.length} selecionados`;
}

function ordenarSelecaoPorOpcoes(
  valores: string[],
  opcoes: OpcaoFiltroMultiplo[]
) {
  const ordem = new Map(opcoes.map((opcao, indice) => [opcao.valor, indice]));

  return [...valores].sort(
    (a, b) => (ordem.get(a) ?? 999) - (ordem.get(b) ?? 999)
  );
}

function FiltroMultiplo({
  label,
  ariaLabel,
  valores,
  opcoes,
  valorTodos,
  rotuloTodos,
  incluirTodos = true,
  onChange
}: {
  label: string;
  ariaLabel: string;
  valores: string[];
  opcoes: OpcaoFiltroMultiplo[];
  valorTodos: string;
  rotuloTodos: string;
  incluirTodos?: boolean;
  onChange: (valores: string[]) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const todosSelecionados = valores.includes(valorTodos) || valores.length === 0;
  const textoBotao = descreverFiltroMultiplo(
    valores,
    opcoes,
    valorTodos,
    rotuloTodos
  );

  useEffect(() => {
    if (!aberto) {
      return;
    }

    function fecharAoClicarFora(event: MouseEvent) {
      const alvo = event.target;

      if (
        alvo instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(alvo)
      ) {
        setAberto(false);
      }
    }

    document.addEventListener('mousedown', fecharAoClicarFora);

    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora);
    };
  }, [aberto]);

  function alternarTodos() {
    onChange([valorTodos]);
  }

  function alternarValor(valor: string) {
    if (todosSelecionados) {
      onChange([valor]);
      return;
    }

    if (valores.includes(valor)) {
      const proximaSelecao = valores.filter((item) => item !== valor);

      if (proximaSelecao.length === 0) {
        onChange(incluirTodos ? [valorTodos] : [valor]);
        return;
      }

      onChange(ordenarSelecaoPorOpcoes(proximaSelecao, opcoes));
      return;
    }

    onChange(ordenarSelecaoPorOpcoes([...valores, valor], opcoes));
  }

  return (
    <div className="relative" ref={containerRef}>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <button
        type="button"
        className="flex h-[30px] w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-[10px] py-0 text-left text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        aria-label={ariaLabel}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        onClick={() => setAberto((valorAtual) => !valorAtual)}
      >
        <span className="min-w-0 truncate">{textoBotao}</span>
        <span className="text-xs text-slate-500" aria-hidden="true">
          v
        </span>
      </button>

      {aberto ? (
        <div
          className="absolute right-0 z-30 mt-1 max-h-72 w-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
          role="listbox"
          aria-label={ariaLabel}
        >
          {incluirTodos ? (
            <label className="flex cursor-pointer items-center gap-2 px-3 py-2 font-semibold text-slate-900 hover:bg-slate-50">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                checked={todosSelecionados}
                onChange={alternarTodos}
              />
              <span>{rotuloTodos}</span>
            </label>
          ) : null}

          {opcoes.map((opcao) => (
            <label
              key={opcao.valor}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 font-medium text-slate-800 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                checked={!todosSelecionados && valores.includes(opcao.valor)}
                onChange={() => alternarValor(opcao.valor)}
              />
              <span className="truncate">{opcao.rotulo}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MetaIndicador({
  titulo,
  valor,
  apoio,
  destaque
}: {
  titulo: string;
  valor: string;
  apoio: string;
  destaque?: string;
}) {
  return (
    <div className="min-h-[70px] rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
        {titulo}
      </p>
      <p className={`mt-1 text-lg font-extrabold leading-none ${destaque || 'text-slate-950'}`}>
        {valor}
      </p>
      <p className="mt-1 truncate text-[11px] font-medium text-slate-500">
        {apoio}
      </p>
    </div>
  );
}

function MetasResumo({ metas }: { metas: FunilMetasResumo }) {
  return (
    <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetaIndicador
          titulo="Meta global"
          valor={formatarMoeda(metas.metaGlobal)}
          apoio="Soma das metas dos vendedores"
        />
        <MetaIndicador
          titulo="Realizado"
          valor={formatarMoeda(metas.realizadoGlobal)}
          apoio="Orçamentos fechados"
        />
        <MetaIndicador
          titulo="Atingimento"
          valor={formatarPercentual(metas.percentualGlobal)}
          apoio="Realizado dividido pela meta"
          destaque={
            metas.percentualGlobal >= 100 ? 'text-green-700' : 'text-slate-950'
          }
        />
        <MetaIndicador
          titulo="Saldo"
          valor={formatarMoeda(metas.saldoGlobal)}
          apoio={metas.saldoGlobal >= 0 ? 'Acima da meta' : 'Faltante'}
          destaque={classeSaldo(metas.saldoGlobal)}
        />
      </div>
    </div>
  );
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

function LinhaMetaVendedor({ item }: { item: FunilMetaVendedor }) {
  const largura = Math.min(Math.max(item.percentual, item.realizado > 0 ? 4 : 0), 100);

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-bold text-slate-900">{item.vendedorEmail}</p>
        <p className="mt-1 text-[11px] font-medium text-slate-500">
          UF: {item.estados.length ? item.estados.join(', ') : 'Todos'}
        </p>
      </td>
      <td className="px-4 py-3 text-right font-semibold text-slate-700">
        {formatarMoeda(item.meta)}
      </td>
      <td className="px-4 py-3 text-right font-semibold text-slate-700">
        {formatarMoeda(item.realizado)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                item.percentual >= 100 ? 'bg-green-700' : 'bg-amber-600'
              }`}
              style={{ width: `${largura}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="w-12 text-right text-xs font-extrabold text-slate-700">
            {formatarPercentual(item.percentual)}
          </span>
        </div>
      </td>
      <td className={`px-4 py-3 text-right font-bold ${classeSaldo(item.saldo)}`}>
        {formatarMoeda(item.saldo)}
      </td>
    </tr>
  );
}

function MetasPorVendedor({ metas }: { metas: FunilMetasResumo }) {
  if (metas.vendedores.length === 0) {
    return (
      <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500">
        Nenhuma meta por vendedor encontrada para os filtros atuais.
      </p>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
          Meta por vendedor
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Relação de metas, realizado e atingimento por vendedor.
          </caption>
          <thead className="border-b border-slate-200 bg-white text-xs text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 text-left font-bold">
                Vendedor
              </th>
              <th scope="col" className="px-4 py-2 text-right font-bold">
                Meta
              </th>
              <th scope="col" className="px-4 py-2 text-right font-bold">
                Realizado
              </th>
              <th scope="col" className="px-4 py-2 text-right font-bold">
                Ating.
              </th>
              <th scope="col" className="px-4 py-2 text-right font-bold">
                Saldo
              </th>
            </tr>
          </thead>
          <tbody>
            {metas.vendedores.map((item) => (
              <LinhaMetaVendedor key={item.vendedorEmail} item={item} />
            ))}
          </tbody>
        </table>
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
    setFiltroPeriodos,
    setFiltroMeses,
    carregarFunilOrcamentos
  } = useFunilOrcamentos(isAdmin, refreshKey);
  const opcoesPeriodos = opcoes.periodos.map((periodo) => ({
    valor: periodo,
    rotulo: periodo
  }));
  const opcoesMeses = opcoes.meses.map((mes) => ({
    valor: mes,
    rotulo: FILTROS_FUNIL_ORCAMENTOS.MESES_NOMES[mes] || mes
  }));

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

        <div className="grid gap-2 sm:grid-cols-[170px_170px_170px_auto] sm:items-end">
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

          <FiltroMultiplo
            label="Ano"
            ariaLabel="Filtrar funil por um ou mais anos"
            valores={filtros.periodos}
            opcoes={opcoesPeriodos}
            valorTodos={FILTROS_FUNIL_ORCAMENTOS.TODOS_PERIODOS}
            rotuloTodos="Todos"
            incluirTodos={isAdmin}
            onChange={setFiltroPeriodos}
          />

          <FiltroMultiplo
            label="Mês"
            ariaLabel="Filtrar funil por um ou mais meses"
            valores={filtros.meses}
            opcoes={opcoesMeses}
            valorTodos={FILTROS_FUNIL_ORCAMENTOS.TODOS_MESES}
            rotuloTodos="Todos"
            onChange={setFiltroMeses}
          />

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

      <MetasResumo metas={resumo.metas} />

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

      <MetasPorVendedor metas={resumo.metas} />

      {resumo.totalOrcamentos === 0 && !error ? (
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
          Nenhum orçamento encontrado para os filtros atuais.
        </p>
      ) : null}
    </section>
  );
}



