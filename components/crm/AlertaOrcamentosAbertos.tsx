'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import {
  OrcamentoAbertoResumo,
  useOrcamentosAbertos
} from '../../hooks/useOrcamentosAbertos';

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

  const retornoHook =
    useOrcamentosAbertos() as RetornoUseOrcamentosAbertosCompat;

  const orcamentos = useMemo(
    () => obterListaOrcamentos(retornoHook),
    [retornoHook]
  );

  const orcamentosOrdenados = useMemo(() => {
    return [...orcamentos].sort((primeiro, segundo) => {
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
  }, [orcamentos, ordenacao]);

  const total = useMemo(
    () => obterTotalOrcamentos(retornoHook, orcamentos),
    [retornoHook, orcamentos]
  );

  const loading = Boolean(retornoHook.loading || retornoHook.carregando);
  const error = retornoHook.error || retornoHook.erro || null;

  const carregar =
    retornoHook.carregarOrcamentosAbertos ||
    retornoHook.carregar ||
    retornoHook.atualizar ||
    retornoHook.refetch;

  useEffect(() => {
    if (carregar) {
      void carregar();
    }
  }, [carregar, refreshKey]);

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
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">
              Orçamentos em aberto
            </h3>
            <p className="text-xs text-slate-500">
              Clique em um orçamento para abrir o histórico do cliente.
            </p>
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
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
