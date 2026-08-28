import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  buscarOrigemImportacaoOrcamentosAtual,
  montarSufixoCacheOrigemImportacao
} from '../lib/origemImportacaoOrcamentos';
import {
  CACHE_TTL_CURTO_MS,
  lerCacheSessao,
  salvarCacheSessao
} from '../utils/sessionCache';
import type { Cliente, MetaComercial, Profile } from '../types';

export type StatusFunilOrcamento = 'A' | 'B' | 'C';

export type FunilOrcamentoResumoStatus = {
  status: StatusFunilOrcamento;
  titulo: string;
  descricao: string;
  quantidadeOrcamentos: number;
  quantidadeItens: number;
  quantidadeClientes: number;
  percentual: number;
  valorTotal: number;
  ticketMedio: number;
};

export type FunilOrcamentosResumo = {
  totalOrcamentos: number;
  totalItens: number;
  totalClientes: number;
  valorTotal: number;
  ticketMedio: number;
  periodoDescricao: string;
  status: FunilOrcamentoResumoStatus[];
  metas: FunilMetasResumo;
};

export type FunilMetaVendedor = {
  vendedorEmail: string;
  estados: string[];
  meta: number;
  realizado: number;
  percentual: number;
  saldo: number;
};

export type FunilMetasResumo = {
  metaGlobal: number;
  realizadoGlobal: number;
  percentualGlobal: number;
  saldoGlobal: number;
  vendedores: FunilMetaVendedor[];
};

export type FiltrosFunilOrcamentos = {
  area: string;
  periodos: string[];
  meses: string[];
};

export type OpcoesFunilOrcamentos = {
  areas: string[];
  periodos: string[];
  meses: string[];
};

type LinhaFunilBase = {
  id: string;
  cliente_id: string | null;
  codigo_cliente_loja: string | null;
  numero_orcamento: string | null;
  numero_it_completo: string | null;
  status: StatusFunilOrcamento;
  ramo?: string | null;
  valor_total: number | string | null;
  data_emissao?: string | null;
  data_fechamento?: string | null;
  data_cancelamento?: string | null;
};

type LinhaClienteEstado = Pick<Cliente, 'id' | 'estado'>;

type EstadoFunilOrcamentos = {
  resumo: FunilOrcamentosResumo;
  opcoes: OpcoesFunilOrcamentos;
  loading: boolean;
  error: string | null;
};

type CacheFunilOrcamentos = {
  resumo: FunilOrcamentosResumo;
  opcoes: OpcoesFunilOrcamentos;
};

const TAMANHO_PAGINA_SUPABASE = 1000;
const CACHE_TTL_OPCOES_MS = 30 * 60 * 1000;
const FILTRO_TODAS_AREAS = 'todas';
const FILTRO_TODOS_PERIODOS = 'todos';
const FILTRO_TODOS_MESES = 'todos';

const STATUS_CONFIG: Record<
  StatusFunilOrcamento,
  Pick<FunilOrcamentoResumoStatus, 'titulo' | 'descricao'>
> = {
  A: {
    titulo: 'Abertos',
    descricao: 'Status A, filtrado pela data de emissão'
  },
  B: {
    titulo: 'Fechados',
    descricao: 'Status B, filtrado pela data de fechamento'
  },
  C: {
    titulo: 'Cancelados',
    descricao: 'Status C, filtrado pela data de cancelamento'
  }
};

const STATUS_ORDEM: StatusFunilOrcamento[] = ['A', 'B', 'C'];

type CampoDataFunil =
  | 'data_emissao'
  | 'data_fechamento'
  | 'data_cancelamento';

const DATA_REFERENCIA_STATUS: Record<StatusFunilOrcamento, CampoDataFunil> = {
  A: 'data_emissao',
  B: 'data_fechamento',
  C: 'data_cancelamento'
};

const MESES_NOMES: Record<string, string> = {
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Março',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro'
};

const metasVazias: FunilMetasResumo = {
  metaGlobal: 0,
  realizadoGlobal: 0,
  percentualGlobal: 0,
  saldoGlobal: 0,
  vendedores: []
};

const resumoVazio: FunilOrcamentosResumo = {
  totalOrcamentos: 0,
  totalItens: 0,
  totalClientes: 0,
  valorTotal: 0,
  ticketMedio: 0,
  periodoDescricao: '',
  metas: metasVazias,
  status: STATUS_ORDEM.map((status) => ({
    status,
    titulo: STATUS_CONFIG[status].titulo,
    descricao: STATUS_CONFIG[status].descricao,
    quantidadeOrcamentos: 0,
    quantidadeItens: 0,
    quantidadeClientes: 0,
    percentual: 0,
    valorTotal: 0,
    ticketMedio: 0
  }))
};

const opcoesVazias: OpcoesFunilOrcamentos = {
  areas: [],
  periodos: [],
  meses: Object.keys(MESES_NOMES)
};

function normalizarTexto(valor?: string | null) {
  return String(valor || '').trim();
}

function calcularAnoCorrente() {
  return String(new Date().getFullYear());
}

function montarFiltrosIniciais(isAdmin: boolean): FiltrosFunilOrcamentos {
  return {
    area: FILTRO_TODAS_AREAS,
    periodos: [isAdmin ? FILTRO_TODOS_PERIODOS : calcularAnoCorrente()],
    meses: [FILTRO_TODOS_MESES]
  };
}

function montarPeriodoDescricao() {
  return 'Volume financeiro';
}

function montarChaveCache(
  isAdmin: boolean,
  filtros: FiltrosFunilOrcamentos,
  origemImportacao: string | null
) {
  const alcance = isAdmin ? 'admin-todos' : `vendedor-${calcularAnoCorrente()}`;
  const area = filtros.area || FILTRO_TODAS_AREAS;
  const periodos = normalizarFiltroMultiplo(
    filtros.periodos,
    FILTRO_TODOS_PERIODOS
  ).join(',');
  const meses = normalizarFiltroMultiplo(
    filtros.meses,
    FILTRO_TODOS_MESES
  ).join(',');
  const origem = montarSufixoCacheOrigemImportacao(origemImportacao);

  return `funil-orcamentos:v21-metas-lote-atual-${origem}:${alcance}:area-${area}:periodos-${periodos}:meses-${meses}`;
}

function montarChaveCacheOpcoes(
  isAdmin: boolean,
  origemImportacao: string | null
) {
  const alcance = isAdmin ? 'admin-todos' : `vendedor-${calcularAnoCorrente()}`;
  const origem = montarSufixoCacheOrigemImportacao(origemImportacao);

  return `funil-orcamentos:opcoes:v3-lote-atual-${origem}:${alcance}`;
}

function extrairPartesData(data?: string | null) {
  const valor = normalizarTexto(data);

  if (!valor) {
    return { ano: '', mes: '' };
  }

  const iso = valor.match(/^(\d{4})-(\d{2})-/);

  if (iso) {
    return { ano: iso[1], mes: iso[2] };
  }

  const brasileira = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (brasileira) {
    return {
      ano: brasileira[3],
      mes: brasileira[2].padStart(2, '0')
    };
  }

  const ano = valor.match(/(\d{4})/)?.[1] || '';

  return { ano, mes: '' };
}

function ordenarDecrescente(a: string, b: string) {
  return b.localeCompare(a, 'pt-BR', { numeric: true });
}

function normalizarFiltroMultiplo(
  valores: string[] | string | undefined,
  valorTodos: string
) {
  const lista = Array.isArray(valores) ? valores : valores ? [valores] : [];
  const filtrados = Array.from(
    new Set(lista.map((valor) => normalizarTexto(valor)).filter(Boolean))
  );

  if (filtrados.length === 0 || filtrados.includes(valorTodos)) {
    return [valorTodos];
  }

  return filtrados;
}

function obterValoresSelecionados(
  valores: string[] | string | undefined,
  valorTodos: string
) {
  const normalizados = normalizarFiltroMultiplo(valores, valorTodos);

  if (normalizados.includes(valorTodos)) {
    return [];
  }

  return normalizados;
}

function normalizarValorMonetario(valor: number | string | null | undefined) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0;
  }

  const textoValor = normalizarTexto(valor);

  if (!textoValor) {
    return 0;
  }

  const numero = Number(textoValor.replace(/\./g, '').replace(',', '.'));

  return Number.isFinite(numero) ? numero : 0;
}

function obterNumeroPrincipal(linha: LinhaFunilBase) {
  const numeroOrcamento = normalizarTexto(linha.numero_orcamento);

  if (numeroOrcamento) {
    return numeroOrcamento;
  }

  return normalizarTexto(linha.numero_it_completo).split('-')[0] || '';
}

function obterChaveOrcamento(linha: LinhaFunilBase) {
  const codigoClienteLoja = normalizarTexto(linha.codigo_cliente_loja);
  const numeroOrcamento = obterNumeroPrincipal(linha);

  if (!codigoClienteLoja || !numeroOrcamento) {
    return '';
  }

  return `${codigoClienteLoja}|${numeroOrcamento}`;
}

function montarIntervaloData(filtros: FiltrosFunilOrcamentos) {
  const periodos = obterValoresSelecionados(
    filtros.periodos,
    FILTRO_TODOS_PERIODOS
  );
  const meses = obterValoresSelecionados(filtros.meses, FILTRO_TODOS_MESES);

  if (periodos.length === 0) {
    return null;
  }

  const anosNumericos = periodos
    .map(Number)
    .filter((ano) => Number.isInteger(ano) && ano > 0);

  if (anosNumericos.length === 0) {
    return null;
  }

  const mesesNumericos = meses
    .map(Number)
    .filter((mes) => Number.isInteger(mes) && mes >= 1 && mes <= 12);
  const menorAno = Math.min(...anosNumericos);
  const maiorAno = Math.max(...anosNumericos);
  const menorMes = mesesNumericos.length > 0 ? Math.min(...mesesNumericos) : 1;
  const maiorMes = mesesNumericos.length > 0 ? Math.max(...mesesNumericos) : 12;
  const proximoAno = maiorMes === 12 ? maiorAno + 1 : maiorAno;
  const proximoMes = maiorMes === 12 ? 1 : maiorMes + 1;

  return {
    inicio: `${menorAno}-${String(menorMes).padStart(2, '0')}-01`,
    fim: `${proximoAno}-${String(proximoMes).padStart(2, '0')}-01`
  };
}

function filtroDataEstaAtivo(filtros: FiltrosFunilOrcamentos) {
  return (
    obterValoresSelecionados(filtros.periodos, FILTRO_TODOS_PERIODOS).length >
      0 ||
    obterValoresSelecionados(filtros.meses, FILTRO_TODOS_MESES).length > 0
  );
}

function linhaDentroFiltrosData(
  data: string | null | undefined,
  filtros: FiltrosFunilOrcamentos
) {
  const periodos = obterValoresSelecionados(
    filtros.periodos,
    FILTRO_TODOS_PERIODOS
  );
  const meses = obterValoresSelecionados(filtros.meses, FILTRO_TODOS_MESES);

  if (periodos.length === 0 && meses.length === 0) {
    return true;
  }

  const partes = extrairPartesData(data);

  if (!partes.ano) {
    return false;
  }

  if (periodos.length > 0 && !periodos.includes(partes.ano)) {
    return false;
  }

  if (meses.length > 0 && !meses.includes(partes.mes)) {
    return false;
  }

  return true;
}

function descreverErroSupabase(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }

  if (err && typeof err === 'object') {
    const erro = err as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    const partes = [erro.message, erro.details, erro.hint, erro.code].filter(Boolean);

    if (partes.length > 0) {
      return partes.join(' | ');
    }

    try {
      return JSON.stringify(err);
    } catch {
      return 'Não foi possível carregar o funil comercial.';
    }
  }

  return 'Não foi possível carregar o funil comercial.';
}

type ConsultaPaginadaSupabase = {
  order: (
    coluna: string,
    opcoes?: { ascending?: boolean }
  ) => ConsultaPaginadaSupabase;
  limit: (quantidade: number) => ConsultaPaginadaSupabase;
  gt: (coluna: string, valor: string) => ConsultaPaginadaSupabase;
  then: PromiseLike<{
    data: unknown[] | null;
    error: unknown;
  }>['then'];
};

async function buscarTodasAsPaginas<T extends { id: string }>(
  montarConsulta: () => ConsultaPaginadaSupabase
) {
  const linhas: T[] = [];
  let ultimoId = '';

  while (true) {
    let query = montarConsulta()
      .order('id', { ascending: true })
      .limit(TAMANHO_PAGINA_SUPABASE);

    if (ultimoId) {
      query = query.gt('id', ultimoId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const pagina = (data || []) as T[];
    linhas.push(...pagina);

    if (pagina.length < TAMANHO_PAGINA_SUPABASE) {
      break;
    }

    const novoUltimoId = pagina[pagina.length - 1]?.id;

    if (!novoUltimoId || novoUltimoId === ultimoId) {
      break;
    }

    ultimoId = novoUltimoId;
  }

  return linhas;
}

type LinhaOpcoesFunil = {
  id: string;
  status: StatusFunilOrcamento;
  ramo: string | null;
  data_emissao?: string | null;
  data_fechamento?: string | null;
  data_cancelamento?: string | null;
};

async function buscarOpcoesFunilOrcamentos(
  isAdmin: boolean,
  origemImportacao: string | null
) {
  const linhas: LinhaOpcoesFunil[] = [];

  for (const status of STATUS_ORDEM) {
    const campoData = DATA_REFERENCIA_STATUS[status];

    const linhasStatus = await buscarTodasAsPaginas<LinhaOpcoesFunil>(() => {
      let query = supabase
        .from('orcamentos_historico')
        .select(`id, status, ramo, ${campoData}`)
        .eq('status', status);

      if (origemImportacao) {
        query = query.eq('origem_importacao', origemImportacao);
      }

      return query;
    });

    linhas.push(...linhasStatus);
  }

  const areas = new Set<string>();
  const periodos = new Set<string>();

  linhas.forEach((linha) => {
    const area = normalizarTexto(linha.ramo);

    if (area) {
      areas.add(area);
    }

    const campoData = DATA_REFERENCIA_STATUS[linha.status];
    const { ano } = extrairPartesData(linha[campoData] as string | null);

    if (ano) {
      periodos.add(ano);
    }
  });

  return {
    areas: Array.from(areas).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    periodos: isAdmin
      ? Array.from(periodos).sort(ordenarDecrescente)
      : [calcularAnoCorrente()],
    meses: Object.keys(MESES_NOMES)
  };
}

async function buscarLinhasPorStatus(
  status: StatusFunilOrcamento,
  filtros: FiltrosFunilOrcamentos,
  origemImportacao: string | null
) {
  const campoData = DATA_REFERENCIA_STATUS[status] as string;
  const intervalo = montarIntervaloData(filtros);
  const filtroDataAtivo = filtroDataEstaAtivo(filtros);

  const buscarPorCampoData = (campo: string, exigirData = true) =>
    buscarTodasAsPaginas<LinhaFunilBase>(() => {
      let query = supabase
        .from('orcamentos_historico')
        .select(
          `id, cliente_id, codigo_cliente_loja, numero_orcamento, numero_it_completo, status, valor_total, ${campo}`
        )
        .eq('status', status);

      if (filtros.area !== FILTRO_TODAS_AREAS) {
        query = query.eq('ramo', filtros.area);
      }

      if (origemImportacao) {
        query = query.eq('origem_importacao', origemImportacao);
      }

      if (filtroDataAtivo && exigirData) {
        query = query.not(campo, 'is', null);
      }

      if (intervalo) {
        query = query.gte(campo, intervalo.inicio).lt(campo, intervalo.fim);
      }

      return query;
    });

  const linhas = await buscarPorCampoData(campoData);

  return linhas.filter((linha) =>
    linhaDentroFiltrosData(linha[campoData as CampoDataFunil], filtros)
  );
}

async function buscarLinhasTotalOrcado(
  filtros: FiltrosFunilOrcamentos,
  origemImportacao: string | null
) {
  const intervalo = montarIntervaloData(filtros);
  const filtroDataAtivo = filtroDataEstaAtivo(filtros);

  const linhas = await buscarTodasAsPaginas<LinhaFunilBase>(() => {
    let query = supabase
      .from('orcamentos_historico')
      .select(
        'id, cliente_id, codigo_cliente_loja, numero_orcamento, numero_it_completo, status, valor_total, data_emissao'
      )
      .in('status', ['A', 'B', 'C']);

    if (filtros.area !== FILTRO_TODAS_AREAS) {
      query = query.eq('ramo', filtros.area);
    }

    if (origemImportacao) {
      query = query.eq('origem_importacao', origemImportacao);
    }

    if (filtroDataAtivo) {
      query = query.not('data_emissao', 'is', null);
    }

    if (intervalo) {
      query = query
        .gte('data_emissao', intervalo.inicio)
        .lt('data_emissao', intervalo.fim);
    }

    return query;
  });

  return linhas.filter((linha) =>
    linhaDentroFiltrosData(linha.data_emissao, filtros)
  );
}

async function buscarMetasComerciais(filtros: FiltrosFunilOrcamentos) {
  const periodos = obterValoresSelecionados(
    filtros.periodos,
    FILTRO_TODOS_PERIODOS
  )
    .map(Number)
    .filter((ano) => Number.isInteger(ano) && ano > 0);
  const meses = obterValoresSelecionados(filtros.meses, FILTRO_TODOS_MESES)
    .map(Number)
    .filter((mes) => Number.isInteger(mes) && mes >= 1 && mes <= 12);
  let query = supabase
    .from('metas_comerciais')
    .select('*')
    .order('vendedor_email', { ascending: true });

  if (periodos.length > 0) {
    query = query.in('ano', periodos);
  }

  if (meses.length > 0) {
    query = query.in('mes', meses);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as MetaComercial[];
}

async function buscarVendedoresFunil() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,role,segmentos_permitidos,estados_permitidos')
    .eq('role', 'vendedor')
    .order('email', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as Profile[];
}

function dividirEmLotes<T>(itens: T[], tamanho: number) {
  const lotes: T[][] = [];

  for (let indice = 0; indice < itens.length; indice += tamanho) {
    lotes.push(itens.slice(indice, indice + tamanho));
  }

  return lotes;
}

async function buscarEstadosClientes(clienteIds: string[]) {
  const estadosPorCliente = new Map<string, string>();
  const idsUnicos = Array.from(new Set(clienteIds.filter(Boolean)));

  for (const lote of dividirEmLotes(idsUnicos, 500)) {
    const { data, error } = await supabase
      .from('clientes')
      .select('id,estado')
      .in('id', lote);

    if (error) {
      throw error;
    }

    ((data || []) as LinhaClienteEstado[]).forEach((cliente) => {
      estadosPorCliente.set(
        cliente.id,
        normalizarTexto(cliente.estado).toUpperCase()
      );
    });
  }

  return estadosPorCliente;
}



function calcularResumoStatus(
  status: StatusFunilOrcamento,
  linhas: LinhaFunilBase[]
): FunilOrcamentoResumoStatus {
  const orcamentosUnicos = new Set<string>();
  const clientesUnicos = new Set<string>();
  let valorTotal = 0;

  linhas.forEach((linha) => {
    const chave = obterChaveOrcamento(linha);

    if (chave) {
      orcamentosUnicos.add(chave);
    }

    if (linha.cliente_id) {
      clientesUnicos.add(linha.cliente_id);
    }

    valorTotal += normalizarValorMonetario(linha.valor_total);
  });

  const quantidadeOrcamentos = orcamentosUnicos.size || linhas.length;

  return {
    status,
    titulo: STATUS_CONFIG[status].titulo,
    descricao: STATUS_CONFIG[status].descricao,
    quantidadeOrcamentos,
    quantidadeItens: linhas.length,
    quantidadeClientes: clientesUnicos.size,
    percentual: 0,
    valorTotal,
    ticketMedio: quantidadeOrcamentos > 0 ? valorTotal / quantidadeOrcamentos : 0
  };
}


function calcularTotalAnalisadoPorEmissao(linhas: LinhaFunilBase[]) {
  const orcamentosUnicos = new Set<string>();
  const clientesUnicos = new Set<string>();
  let valorTotal = 0;

  linhas.forEach((linha) => {
    const chave = obterChaveOrcamento(linha);

    if (chave) {
      orcamentosUnicos.add(chave);
    }

    if (linha.cliente_id) {
      clientesUnicos.add(linha.cliente_id);
    }

    valorTotal += normalizarValorMonetario(linha.valor_total);
  });

  return {
    totalOrcamentos: orcamentosUnicos.size || linhas.length,
    totalItens: linhas.length,
    totalClientes: clientesUnicos.size,
    valorTotal
  };
}

function calcularPercentualMeta(realizado: number, meta: number) {
  if (meta <= 0) {
    return realizado > 0 ? 100 : 0;
  }

  return Math.round((realizado / meta) * 100);
}

function calcularResumoMetas(
  metas: MetaComercial[],
  vendedores: Profile[],
  linhasFechadas: LinhaFunilBase[],
  estadosPorCliente: Map<string, string>,
  realizadoGlobal: number
): FunilMetasResumo {
  const metaPorEmail = new Map<string, number>();

  metas.forEach((meta) => {
    const email = normalizarTexto(meta.vendedor_email).toLowerCase();
    const valorAtual = metaPorEmail.get(email) || 0;

    metaPorEmail.set(
      email,
      valorAtual + normalizarValorMonetario(meta.valor_meta)
    );
  });

  const vendedoresResumo = vendedores.map((vendedor) => {
    const vendedorEmail = normalizarTexto(vendedor.email).toLowerCase();
    const estados = (vendedor.estados_permitidos || [])
      .map((estado) => normalizarTexto(estado).toUpperCase())
      .filter(Boolean);
    const todosEstados = estados.length === 0;
    const meta = metaPorEmail.get(vendedorEmail) || 0;
    let realizado = 0;

    linhasFechadas.forEach((linha) => {
      const estadoCliente = linha.cliente_id
        ? estadosPorCliente.get(linha.cliente_id) || ''
        : '';

      if (todosEstados || estados.includes(estadoCliente)) {
        realizado += normalizarValorMonetario(linha.valor_total);
      }
    });

    return {
      vendedorEmail: vendedor.email,
      estados,
      meta,
      realizado,
      percentual: calcularPercentualMeta(realizado, meta),
      saldo: realizado - meta
    };
  });

  const metaGlobal = vendedoresResumo.reduce(
    (total, vendedor) => total + vendedor.meta,
    0
  );

  return {
    metaGlobal,
    realizadoGlobal,
    percentualGlobal: calcularPercentualMeta(realizadoGlobal, metaGlobal),
    saldoGlobal: realizadoGlobal - metaGlobal,
    vendedores: vendedoresResumo.sort((a, b) => b.percentual - a.percentual)
  };
}

function calcularResumo(
  linhasPorStatus: Record<StatusFunilOrcamento, LinhaFunilBase[]>,
  linhasTotalAnalisado: LinhaFunilBase[],
  periodoDescricao: string
): FunilOrcamentosResumo {
  const statusSemPercentual = STATUS_ORDEM.map((status) =>
    calcularResumoStatus(status, linhasPorStatus[status])
  );

  const valorTotalStatus = statusSemPercentual.reduce(
    (total, item) => total + item.valorTotal,
    0
  );
  const quantidadeTotalStatus = statusSemPercentual.reduce(
    (total, item) => total + item.quantidadeOrcamentos,
    0
  );

  const clientesUnicos = new Set<string>();
  STATUS_ORDEM.forEach((status) => {
    linhasPorStatus[status].forEach((linha) => {
      if (linha.cliente_id) {
        clientesUnicos.add(linha.cliente_id);
      }
    });
  });

  const totalAnalisado = calcularTotalAnalisadoPorEmissao(
    linhasTotalAnalisado
  );

  const status = statusSemPercentual.map((item) => ({
    ...item,
    percentual:
      valorTotalStatus > 0
        ? Math.round((item.valorTotal / valorTotalStatus) * 100)
        : quantidadeTotalStatus > 0
          ? Math.round((item.quantidadeOrcamentos / quantidadeTotalStatus) * 100)
          : 0
  }));

  return {
    totalOrcamentos: totalAnalisado.totalOrcamentos,
    totalItens: totalAnalisado.totalItens,
    totalClientes: totalAnalisado.totalClientes,
    valorTotal: totalAnalisado.valorTotal,
    ticketMedio:
      totalAnalisado.totalOrcamentos > 0
        ? totalAnalisado.valorTotal / totalAnalisado.totalOrcamentos
        : 0,
    periodoDescricao,
    metas: metasVazias,
    status
  };
}


export function useFunilOrcamentos(isAdmin: boolean, refreshKey = 0) {
  const [filtros, setFiltros] = useState<FiltrosFunilOrcamentos>(() =>
    montarFiltrosIniciais(isAdmin)
  );


  const periodoDescricao = useMemo(() => montarPeriodoDescricao(), []);
  const resumoInicial = useMemo(
    () => ({
      ...resumoVazio,
      periodoDescricao
    }),
    [periodoDescricao]
  );

  const [estado, setEstado] = useState<EstadoFunilOrcamentos>({
    resumo: resumoInicial,
    opcoes: opcoesVazias,
    loading: false,
    error: null
  });
  const resumoRef = useRef<FunilOrcamentosResumo>(resumoInicial);
  const opcoesRef = useRef<OpcoesFunilOrcamentos>(opcoesVazias);
  const numeroRequisicaoRef = useRef(0);

  useEffect(() => {
    resumoRef.current = estado.resumo;
  }, [estado.resumo]);

  useEffect(() => {
    opcoesRef.current = estado.opcoes;
  }, [estado.opcoes]);

  const carregarFunilOrcamentos = useCallback(async () => {
    const numeroRequisicao = numeroRequisicaoRef.current + 1;
    numeroRequisicaoRef.current = numeroRequisicao;

    setEstado((estadoAtual) => ({
      ...estadoAtual,
      loading: resumoRef.current.totalOrcamentos === 0,
      error: null
    }));

    try {
      const origemImportacao = await buscarOrigemImportacaoOrcamentosAtual();
      const cacheKey = montarChaveCache(isAdmin, filtros, origemImportacao);
      const cacheOpcoesKey = montarChaveCacheOpcoes(
        isAdmin,
        origemImportacao
      );
      const cache = lerCacheSessao<CacheFunilOrcamentos>(
        cacheKey,
        CACHE_TTL_CURTO_MS
      );
      const opcoesEmCache = lerCacheSessao<OpcoesFunilOrcamentos>(
        cacheOpcoesKey,
        CACHE_TTL_OPCOES_MS
      );

      if (cache && resumoRef.current.totalOrcamentos === 0) {
        resumoRef.current = cache.resumo;
        opcoesRef.current = cache.opcoes;

        setEstado({
          resumo: cache.resumo,
          opcoes: cache.opcoes,
          loading: false,
          error: null
        });
      } else if (
        opcoesEmCache &&
        opcoesRef.current.areas.length === 0
      ) {
        opcoesRef.current = opcoesEmCache;

        setEstado((estadoAtual) => ({
          ...estadoAtual,
          opcoes: opcoesEmCache
        }));
      }

      const possuiDadosEmTela =
        resumoRef.current.totalOrcamentos > 0 ||
        Boolean(cache?.resumo.totalOrcamentos);

      setEstado((estadoAtual) => ({
        ...estadoAtual,
        loading: !possuiDadosEmTela,
        error: null
      }));

      const promessaOpcoes =
        opcoesEmCache
          ? Promise.resolve(opcoesEmCache)
          : buscarOpcoesFunilOrcamentos(isAdmin, origemImportacao);

      const [
        opcoes,
        abertos,
        fechados,
        cancelados,
        totalAnalisado,
        metas,
        vendedores
      ] =
        await Promise.all([
          promessaOpcoes,
          buscarLinhasPorStatus('A', filtros, origemImportacao),
          buscarLinhasPorStatus('B', filtros, origemImportacao),
          buscarLinhasPorStatus('C', filtros, origemImportacao),
          buscarLinhasTotalOrcado(filtros, origemImportacao),
          buscarMetasComerciais(filtros),
          buscarVendedoresFunil()
        ]);

      const estadosPorCliente = await buscarEstadosClientes(
        fechados
          .map((linha) => linha.cliente_id)
          .filter((clienteId): clienteId is string => Boolean(clienteId))
      );

      if (numeroRequisicao !== numeroRequisicaoRef.current) {
        return;
      }

      const resumoBase = calcularResumo(
        {
          A: abertos,
          B: fechados,
          C: cancelados
        },
        totalAnalisado,
        periodoDescricao
      );
      const realizadoGlobal =
        resumoBase.status.find((item) => item.status === 'B')?.valorTotal || 0;
      const resumo: FunilOrcamentosResumo = {
        ...resumoBase,
        metas: calcularResumoMetas(
          metas,
          vendedores,
          fechados,
          estadosPorCliente,
          realizadoGlobal
        )
      };

      const cacheAtualizado = { resumo, opcoes };

      resumoRef.current = resumo;
      opcoesRef.current = opcoes;

      salvarCacheSessao(cacheKey, cacheAtualizado);
      salvarCacheSessao(cacheOpcoesKey, opcoes);

      setEstado({
        resumo,
        opcoes,
        loading: false,
        error: null
      });
    } catch (err) {
      if (numeroRequisicao !== numeroRequisicaoRef.current) {
        return;
      }

      const mensagem = descreverErroSupabase(err);

      console.error('Erro ao carregar funil de orçamentos:', mensagem, err);

      setEstado((estadoAtual) => ({
        resumo: estadoAtual.resumo,
        opcoes: estadoAtual.opcoes,
        loading: false,
        error: mensagem
      }));
    }
  }, [
    filtros,
    isAdmin,
    periodoDescricao
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarFunilOrcamentos();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [carregarFunilOrcamentos, refreshKey]);

  return {
    resumo: estado.resumo,
    opcoes: estado.opcoes,
    filtros,
    loading: estado.loading,
    error: estado.error,
    setFiltroArea: (area: string) =>
      setFiltros((filtrosAtuais) => ({
        ...filtrosAtuais,
        area
      })),
    setFiltroPeriodos: (periodos: string[]) =>
      setFiltros((filtrosAtuais) => ({
        ...filtrosAtuais,
        periodos: normalizarFiltroMultiplo(periodos, FILTRO_TODOS_PERIODOS)
      })),
    setFiltroMeses: (meses: string[]) =>
      setFiltros((filtrosAtuais) => ({
        ...filtrosAtuais,
        meses: normalizarFiltroMultiplo(meses, FILTRO_TODOS_MESES)
      })),
    carregarFunilOrcamentos
  };
}

export const FILTROS_FUNIL_ORCAMENTOS = {
  TODAS_AREAS: FILTRO_TODAS_AREAS,
  TODOS_PERIODOS: FILTRO_TODOS_PERIODOS,
  TODOS_MESES: FILTRO_TODOS_MESES,
  MESES_NOMES
};
