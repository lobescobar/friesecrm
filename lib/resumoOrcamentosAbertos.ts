import type { SupabaseClient } from '@supabase/supabase-js';
import { MESES_HISTORICO_ORCAMENTOS } from '../utils/constants';

const ORIGEM_IMPORTACAO_PREFIXO = 'planilha_orcamentos_crm:';
const TAMANHO_PAGINA = 1000;

type StatusOrcamento = 'A' | 'B' | 'C';

type ClienteRelacionado = {
  empresa?: string | null;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  estado?: string | null;
  segmento?: string | null;
};

type LinhaOrcamento = {
  cliente_id: string | null;
  codigo_cliente: string | null;
  codigo_cliente_loja: string | null;
  numero_orcamento: string | null;
  numero_it_completo: string | null;
  data_emissao: string | null;
  status: StatusOrcamento;
  clientes?: ClienteRelacionado | ClienteRelacionado[] | null;
};

type VendedorAlcada = {
  email: string;
  estados_permitidos: string[] | null;
  segmentos_permitidos: string[] | null;
};

export type OrcamentoAbertoEmail = {
  chave: string;
  numeroOrcamento: string;
  codigoClienteLoja: string;
  cliente: string;
  estado: string;
  segmento: string;
  dataEmissao: string;
  quantidadeItens: number;
};

export type ResumoOrcamentosAbertosVendedor = {
  vendedorEmail: string;
  orcamentos: OrcamentoAbertoEmail[];
};

export type ResumoOrcamentosAbertos = {
  origemImportacao: string | null;
  totalOrcamentos: number;
  totalSemResponsavel: number;
  vendedores: ResumoOrcamentosAbertosVendedor[];
};

type OrcamentoAgrupado = OrcamentoAbertoEmail & {
  statusFinal: StatusOrcamento;
};

function normalizarTexto(valor?: string | null) {
  return String(valor || '').trim();
}

function normalizarChave(valor?: string | null) {
  return normalizarTexto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function obterCliente(linha: LinhaOrcamento) {
  if (Array.isArray(linha.clientes)) {
    return linha.clientes[0] || null;
  }

  return linha.clientes || null;
}

function obterNumeroOrcamento(linha: LinhaOrcamento) {
  return (
    normalizarTexto(linha.numero_orcamento) ||
    normalizarTexto(linha.numero_it_completo).split('-')[0] ||
    ''
  );
}

export function agruparOrcamentosAbertos(
  linhas: LinhaOrcamento[]
): OrcamentoAbertoEmail[] {
  const mapa = new Map<string, OrcamentoAgrupado>();

  for (const linha of linhas) {
    const codigoClienteLoja = normalizarTexto(linha.codigo_cliente_loja);
    const numeroOrcamento = obterNumeroOrcamento(linha);
    const dataEmissao = normalizarTexto(linha.data_emissao);

    if (!codigoClienteLoja || !numeroOrcamento || !dataEmissao) {
      continue;
    }

    const chave = `${codigoClienteLoja}|${numeroOrcamento}`;
    const cliente = obterCliente(linha);
    const existente = mapa.get(chave);

    if (!existente) {
      mapa.set(chave, {
        chave,
        numeroOrcamento,
        codigoClienteLoja,
        cliente:
          normalizarTexto(cliente?.empresa) ||
          normalizarTexto(cliente?.razao_social) ||
          normalizarTexto(cliente?.nome_fantasia) ||
          'Cliente sem nome',
        estado: normalizarTexto(cliente?.estado).toUpperCase(),
        segmento: normalizarTexto(cliente?.segmento),
        dataEmissao,
        quantidadeItens: 1,
        statusFinal: linha.status
      });
      continue;
    }

    mapa.set(chave, {
      ...existente,
      estado: existente.estado || normalizarTexto(cliente?.estado).toUpperCase(),
      segmento: existente.segmento || normalizarTexto(cliente?.segmento),
      dataEmissao:
        dataEmissao > existente.dataEmissao
          ? dataEmissao
          : existente.dataEmissao,
      quantidadeItens: existente.quantidadeItens + 1,
      statusFinal: linha.status
    });
  }

  return Array.from(mapa.values())
    .filter((orcamento) => orcamento.statusFinal === 'A')
    .map((orcamento) => ({
      chave: orcamento.chave,
      numeroOrcamento: orcamento.numeroOrcamento,
      codigoClienteLoja: orcamento.codigoClienteLoja,
      cliente: orcamento.cliente,
      estado: orcamento.estado,
      segmento: orcamento.segmento,
      dataEmissao: orcamento.dataEmissao,
      quantidadeItens: orcamento.quantidadeItens
    }))
    .sort(
      (a, b) =>
        a.dataEmissao.localeCompare(b.dataEmissao) ||
        a.numeroOrcamento.localeCompare(b.numeroOrcamento, 'pt-BR', {
          numeric: true,
          sensitivity: 'base'
        })
    );
}

function vendedorAtendeOrcamento(
  vendedor: VendedorAlcada,
  orcamento: OrcamentoAbertoEmail
) {
  const estado = normalizarChave(orcamento.estado);
  const segmento = normalizarChave(orcamento.segmento);
  const estados = (vendedor.estados_permitidos || []).map(normalizarChave);
  const segmentos = (vendedor.segmentos_permitidos || []).map(normalizarChave);

  if (!estado) {
    return false;
  }

  const atendeEstado = estados.length === 0 || estados.includes(estado);
  const atendeSegmento =
    segmentos.length === 0 || (segmento !== '' && segmentos.includes(segmento));

  return atendeEstado && atendeSegmento;
}

function calcularDataLimite() {
  const data = new Date();
  data.setMonth(data.getMonth() - MESES_HISTORICO_ORCAMENTOS);
  return data.toISOString().slice(0, 10);
}

async function buscarOrigemAtual(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('orcamentos_historico')
    .select('origem_importacao,updated_at')
    .like('origem_importacao', `${ORIGEM_IMPORTACAO_PREFIXO}%`)
    .not('origem_importacao', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.origem_importacao || null;
}

async function buscarLinhas(
  supabase: SupabaseClient,
  origemImportacao: string | null
) {
  const linhas: LinhaOrcamento[] = [];
  let inicio = 0;

  while (true) {
    const fim = inicio + TAMANHO_PAGINA - 1;
    let query = supabase
      .from('orcamentos_historico')
      .select(
        'cliente_id,codigo_cliente,codigo_cliente_loja,numero_orcamento,numero_it_completo,data_emissao,status,clientes(empresa,razao_social,nome_fantasia,estado,segmento)'
      )
      .in('status', ['A', 'B', 'C'])
      .gte('data_emissao', calcularDataLimite());

    if (origemImportacao) {
      query = query.eq('origem_importacao', origemImportacao);
    }

    const { data, error } = await query
      .order('codigo_cliente_loja', { ascending: true })
      .order('numero_orcamento', { ascending: true })
      .order('numero_it_completo', { ascending: true })
      .range(inicio, fim);

    if (error) throw error;

    const pagina = (data || []) as LinhaOrcamento[];
    linhas.push(...pagina);

    if (pagina.length < TAMANHO_PAGINA) break;
    inicio += TAMANHO_PAGINA;
  }

  return linhas;
}

async function buscarVendedores(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('profiles')
    .select('email,estados_permitidos,segmentos_permitidos')
    .eq('role', 'vendedor')
    .order('email', { ascending: true });

  if (error) throw error;
  return (data || []) as VendedorAlcada[];
}

export async function buscarResumoOrcamentosAbertos(
  supabase: SupabaseClient
): Promise<ResumoOrcamentosAbertos> {
  const origemImportacao = await buscarOrigemAtual(supabase);
  const [linhas, vendedores] = await Promise.all([
    buscarLinhas(supabase, origemImportacao),
    buscarVendedores(supabase)
  ]);
  const orcamentos = agruparOrcamentosAbertos(linhas);
  const porVendedor = new Map<string, OrcamentoAbertoEmail[]>();
  let totalSemResponsavel = 0;

  for (const orcamento of orcamentos) {
    const responsaveis = vendedores.filter((vendedor) =>
      vendedorAtendeOrcamento(vendedor, orcamento)
    );

    if (responsaveis.length === 0) {
      totalSemResponsavel += 1;
      continue;
    }

    for (const vendedor of responsaveis) {
      const email = normalizarTexto(vendedor.email).toLowerCase();
      if (!email) continue;
      porVendedor.set(email, [...(porVendedor.get(email) || []), orcamento]);
    }
  }

  return {
    origemImportacao,
    totalOrcamentos: orcamentos.length,
    totalSemResponsavel,
    vendedores: Array.from(porVendedor.entries())
      .map(([vendedorEmail, itens]) => ({
        vendedorEmail,
        orcamentos: itens
      }))
      .sort((a, b) => a.vendedorEmail.localeCompare(b.vendedorEmail, 'pt-BR'))
  };
}

function formatarData(dataIso: string) {
  const [ano, mes, dia] = dataIso.split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : dataIso;
}

export function montarEmailResumoOrcamentosAbertos(
  resumo: ResumoOrcamentosAbertosVendedor,
  dataReferencia: string
) {
  const linhas = resumo.orcamentos.map(
    (orcamento, indice) =>
      `${indice + 1}. ${orcamento.numeroOrcamento} | ${orcamento.cliente} | ${
        orcamento.estado || '-'
      } | ${orcamento.segmento || '-'} | emissão ${formatarData(
        orcamento.dataEmissao
      )}`
  );

  return [
    'Orçamentos em aberto',
    '',
    `Responsável: ${resumo.vendedorEmail}`,
    `Data do relatório: ${formatarData(dataReferencia)}`,
    `Total: ${resumo.orcamentos.length} orçamento(s)`,
    '',
    ...linhas,
    '',
    'Este é um relatório automático do CRM Friese.'
  ].join('\n');
}
