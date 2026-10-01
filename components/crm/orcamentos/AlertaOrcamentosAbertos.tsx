'use client';

import { useMemo, useState } from 'react';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import {
  OrcamentoAbertoResumo,
  useOrcamentosAbertos
} from '../../../hooks/useOrcamentosAbertos';

type AlertaOrcamentosAbertosProps = {
  refreshKey?: number;
  mostrarVazio?: boolean;
  onSelecionarOrcamento?: (orcamento: OrcamentoAbertoResumo) => void;
};

type RetornoUseOrcamentosAbertosCompat = {
  orcamentosAbertos?: OrcamentoAbertoResumo[];
  orcamentos?: OrcamentoAbertoResumo[];
  abertos?: OrcamentoAbertoResumo[];
  data?: OrcamentoAbertoResumo[];
  totalAbertos?: number;
  total?: number;
  quantidade?: number;
  loading?: boolean;
  carregando?: boolean;
  error?: string | null;
  erro?: string | null;
  carregarOrcamentosAbertos?: () => void | Promise<void>;
  carregar?: () => void | Promise<void>;
  atualizar?: () => void | Promise<void>;
  refetch?: () => void | Promise<void>;
};

type CampoOrdenacao = 'orcamento' | 'cliente' | 'emissao';
type DirecaoOrdenacao = 'asc' | 'desc';

type OrdenacaoOrcamentos = {
  campo: CampoOrdenacao;
  direcao: DirecaoOrdenacao;
};

const FILTRO_TODOS = 'todos';
const FILTRO_SEM_ESTADO = 'sem-estado';
const FILTRO_SEM_VENDEDOR = 'sem-vendedor';

function obterListaOrcamentos(
  retorno: RetornoUseOrcamentosAbertosCompat
): OrcamentoAbertoResumo[] {
  return (
    retorno.orcamentosAbertos ||
    retorno.orcamentos ||
    retorno.abertos ||
    retorno.data ||
    []
  );
}

function obterTotalOrcamentos(
  retorno: RetornoUseOrcamentosAbertosCompat,
  lista: OrcamentoAbertoResumo[]
) {
  return (
    retorno.totalAbertos ??
    retorno.total ??
    retorno.quantidade ??
    lista.length
  );
}

function lerCampoTexto(
  orcamento: OrcamentoAbertoResumo,
  campos: string[],
  fallback = '-'
) {
  const registro = orcamento as unknown as Record<string, unknown>;

  for (const campo of campos) {
    const valor = registro[campo];

    if (typeof valor === 'string' && valor.trim()) {
      return valor;
    }

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return String(valor);
    }
  }

  return fallback;
}

function formatarData(valor: string) {
  if (!valor || valor === '-') {
    return '-';
  }

  const partes = valor.split('-');

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return valor;
}

function extrairNumeroComparavel(valor: string) {
  const somenteNumeros = valor.replace(/\D/g, '');

  if (!somenteNumeros) {
    return null;
  }

  const numero = Number(somenteNumeros);

  return Number.isFinite(numero) ? numero : null;
}

function obterDataComparavel(valor: string) {
  if (!valor || valor === '-') {
    return 0;
  }

  const texto = valor.trim();

  const dataBrasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

  if (dataBrasileira) {
    const [, dia, mes, ano] = dataBrasileira;
    return new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia)
    ).getTime();
  }

  const timestamp = Date.parse(texto);

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function obterValorOrdenacao(
  orcamento: OrcamentoAbertoResumo,
  campo: CampoOrdenacao
) {
  if (campo === 'orcamento') {
    return lerCampoTexto(orcamento, [
      'numero_orcamento',
      'numero',
      'orcamento',
      'codigo_orcamento'
    ]);
  }

  if (campo === 'cliente') {
    return lerCampoTexto(orcamento, [
      'cliente_nome',
      'nome_cliente',
      'cliente',
      'razao_social',
      'nome_fantasia'
    ]);
  }

  return lerCampoTexto(orcamento, [
    'data_emissao',
    'emissao',
    'data',
    'created_at'
  ]);
}

function compararOrcamentosPorCampo(
  primeiro: OrcamentoAbertoResumo,
  segundo: OrcamentoAbertoResumo,
  campo: CampoOrdenacao
) {
  const valorPrimeiro = obterValorOrdenacao(primeiro, campo);
  const valorSegundo = obterValorOrdenacao(segundo, campo);

  if (campo === 'orcamento') {
    const numeroPrimeiro = extrairNumeroComparavel(valorPrimeiro);
    const numeroSegundo = extrairNumeroComparavel(valorSegundo);

    if (numeroPrimeiro !== null && numeroSegundo !== null) {
      return numeroPrimeiro - numeroSegundo;
    }
  }

  if (campo === 'emissao') {
    return obterDataComparavel(valorPrimeiro) - obterDataComparavel(valorSegundo);
  }

  return valorPrimeiro.localeCompare(valorSegundo, 'pt-BR', {
    numeric: true,
    sensitivity: 'base'
  });
}

function textoOrdenacao(
  campo: CampoOrdenacao,
  ordenacao: OrdenacaoOrcamentos
) {
  if (ordenacao.campo !== campo) {
    return '↕';
  }

  return ordenacao.direcao === 'desc' ? '↓' : '↑';
}

function tituloOrdenacao(
  campo: CampoOrdenacao,
  ordenacao: OrdenacaoOrcamentos
) {
  if (ordenacao.campo !== campo) {
    return 'Clique para ordenar do maior para o menor';
  }

  if (ordenacao.direcao === 'desc') {
    return 'Ordenado do maior para o menor. Clique para inverter.';
  }

  return 'Ordenado do menor para o maior. Clique para inverter.';
}

export default function AlertaOrcamentosAbertos({
  refreshKey = 0,
  mostrarVazio = false,
  onSelecionarOrcamento
}: AlertaOrcamentosAbertosProps) {
  const [listaAberta, setListaAberta] = useState(false);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoOrcamentos>({
    campo: 'orcamento',
    direcao: 'desc'
  });
  const [filtroVendedor, setFiltroVendedor] = useState(FILTRO_TODOS);
  const [filtroEstado, setFiltroEstado] = useState(FILTRO_TODOS);

  const retornoHook =
    useOrcamentosAbertos(refreshKey) as RetornoUseOrcamentosAbertosCompat;

  const orcamentos = useMemo(
    () => obterListaOrcamentos(retornoHook),
    [retornoHook]
  );

  const vendedoresDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        orcamentos.flatMap((orcamento) => orcamento.vendedores_email || [])
      )
    ).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );
  }, [orcamentos]);

  const estadosDisponiveis = useMemo(() => {
    return Array.from(
      new Set(orcamentos.map((orcamento) => orcamento.estado).filter(Boolean))
    ).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );
  }, [orcamentos]);

  const possuiOrcamentoSemVendedor = useMemo(
    () =>
      orcamentos.some(
        (orcamento) => (orcamento.vendedores_email || []).length === 0
      ),
    [orcamentos]
  );

  const possuiOrcamentoSemEstado = useMemo(
    () => orcamentos.some((orcamento) => !orcamento.estado),
    [orcamentos]
  );

  const orcamentosFiltrados = useMemo(() => {
    return orcamentos.filter((orcamento) => {
      const vendedores = orcamento.vendedores_email || [];
      const atendeVendedor =
        filtroVendedor === FILTRO_TODOS ||
        (filtroVendedor === FILTRO_SEM_VENDEDOR
          ? vendedores.length === 0
          : vendedores.includes(filtroVendedor));
      const atendeEstado =
        filtroEstado === FILTRO_TODOS ||
        (filtroEstado === FILTRO_SEM_ESTADO
          ? !orcamento.estado
          : orcamento.estado === filtroEstado);

      return atendeVendedor && atendeEstado;
    });
  }, [filtroEstado, filtroVendedor, orcamentos]);

  const orcamentosOrdenados = useMemo(() => {
    return [...orcamentosFiltrados].sort((primeiro, segundo) => {
      const resultado = compararOrcamentosPorCampo(
        primeiro,
        segundo,
        ordenacao.campo
      );

      const resultadoOrdenado =
        ordenacao.direcao === 'desc' ? resultado * -1 : resultado;

      if (resultadoOrdenado !== 0) {
        return resultadoOrdenado;
      }

      return compararOrcamentosPorCampo(primeiro, segundo, 'orcamento') * -1;
    });
  }, [orcamentosFiltrados, ordenacao]);

  const total = useMemo(
    () => obterTotalOrcamentos(retornoHook, orcamentos),
    [retornoHook, orcamentos]
  );

  const loading = Boolean(retornoHook.loading || retornoHook.carregando);
  const error = retornoHook.error || retornoHook.erro || null;

  const textoQuantidade = useMemo(() => {
    if (total === 1) {
      return 'Existe 1 orçamento em aberto.';
    }

    return `Existem ${total} orçamentos em aberto.`;
  }, [total]);

  function alterarOrdenacao(campo: CampoOrdenacao) {
    setOrdenacao((atual) => {
      if (atual.campo !== campo) {
        return {
          campo,
          direcao: 'desc'
        };
      }

      return {
        campo,
        direcao: atual.direcao === 'desc' ? 'asc' : 'desc'
      };
    });
  }

  function botaoOrdenacao(campo: CampoOrdenacao, texto: string) {
    return (
      <button
        type="button"
        onClick={() => alterarOrdenacao(campo)}
        title={tituloOrdenacao(campo, ordenacao)}
        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-left font-semibold text-slate-900 hover:bg-amber-100"
      >
        <span>{texto}</span>
        <span className="text-xs text-slate-500">
          {textoOrdenacao(campo, ordenacao)}
        </span>
      </button>
    );
  }

  if (loading && total === 0) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <LoadingSpinner label="Carregando orçamentos em aberto..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <strong>Não foi possível carregar os orçamentos em aberto.</strong>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  if (total === 0 && !mostrarVazio) {
    return null;
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Nenhum orçamento em aberto encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 shadow-sm">
        <div className="flex min-h-[58px] flex-col gap-2 py-2 md:h-[58px] md:flex-row md:items-center md:justify-between md:py-0">
          <p className="text-sm font-bold text-blue-900">{textoQuantidade}</p>

          <Button
            type="button"
            onClick={() => setListaAberta((atual) => !atual)}
            className="min-h-9 px-4 py-1.5 text-sm"
          >
            {listaAberta ? 'Ocultar abertos' : 'Visualizar abertos'}
          </Button>
        </div>
      </div>

      {listaAberta ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Orçamentos em aberto
              </h3>
              <p className="text-xs text-slate-500">
                Exibindo {orcamentosFiltrados.length} de {total} orçamento(s).
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block min-w-48">
                <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                  Vendedor
                </span>
                <select
                  value={filtroVendedor}
                  onChange={(event) => setFiltroVendedor(event.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value={FILTRO_TODOS}>Todos os vendedores</option>
                  {vendedoresDisponiveis.map((vendedor) => (
                    <option key={vendedor} value={vendedor}>
                      {vendedor}
                    </option>
                  ))}
                  {possuiOrcamentoSemVendedor ? (
                    <option value={FILTRO_SEM_VENDEDOR}>Não atribuído</option>
                  ) : null}
                </select>
              </label>

              <label className="block min-w-36">
                <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                  Estado
                </span>
                <select
                  value={filtroEstado}
                  onChange={(event) => setFiltroEstado(event.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value={FILTRO_TODOS}>Todos os estados</option>
                  {estadosDisponiveis.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                  {possuiOrcamentoSemEstado ? (
                    <option value={FILTRO_SEM_ESTADO}>Sem estado</option>
                  ) : null}
                </select>
              </label>
            </div>
          </div>

          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b border-slate-200 bg-white">
                <tr>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    aria-sort={
                      ordenacao.campo === 'orcamento'
                        ? ordenacao.direcao === 'desc'
                          ? 'descending'
                          : 'ascending'
                        : 'none'
                    }
                  >
                    {botaoOrdenacao('orcamento', 'Orçamento')}
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    aria-sort={
                      ordenacao.campo === 'cliente'
                        ? ordenacao.direcao === 'desc'
                          ? 'descending'
                          : 'ascending'
                        : 'none'
                    }
                  >
                    {botaoOrdenacao('cliente', 'Cliente')}
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    aria-sort={
                      ordenacao.campo === 'emissao'
                        ? ordenacao.direcao === 'desc'
                          ? 'descending'
                          : 'ascending'
                        : 'none'
                    }
                  >
                    {botaoOrdenacao('emissao', 'Emissão')}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Vendedor
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {orcamentosOrdenados.map((orcamento, indice) => {
                  const numeroOrcamento = lerCampoTexto(orcamento, [
                    'numero_orcamento',
                    'numero',
                    'orcamento',
                    'codigo_orcamento'
                  ]);

                  const cliente = lerCampoTexto(orcamento, [
                    'cliente_nome',
                    'nome_cliente',
                    'cliente',
                    'razao_social',
                    'nome_fantasia'
                  ]);

                  const dataEmissao = formatarData(
                    lerCampoTexto(orcamento, [
                      'data_emissao',
                      'emissao',
                      'data',
                      'created_at'
                    ])
                  );

                  const clienteId = lerCampoTexto(orcamento, [
                    'cliente_id',
                    'codigo_cliente',
                    'codigo'
                  ]);

                  return (
                    <tr
                      key={`${clienteId}:${numeroOrcamento}:${indice}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {numeroOrcamento}
                      </td>

                      <td className="px-4 py-3 text-slate-700">{cliente}</td>

                      <td className="px-4 py-3 text-slate-700">
                        {dataEmissao}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {orcamento.estado || '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {(orcamento.vendedores_email || []).join(', ') ||
                          'Não atribuído'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => onSelecionarOrcamento?.(orcamento)}
                        >
                          Abrir
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {orcamentosOrdenados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Nenhum orçamento corresponde aos filtros selecionados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}



