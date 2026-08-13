import * as XLSX from 'xlsx';
import { registrarAuditoriaImportacao } from './auditoria';
import { montarOrigemImportacaoOrcamentos } from './origemImportacaoOrcamentos';
import { supabase } from './supabase';
import {
  MESES_STATUS_CLIENTE_ATIVO
} from '../utils/constants';
import {
  ClienteLookup,
  HistoricoImportacao,
  LinhaProcessada,
  ProcessamentoPlanilhaOrcamentos,
  ResumoOrcamentos,
  StatusOrcamentoImportacao
} from '../types/importacaoOrcamentos';
import {
  converterDataParaIso,
  converterNumeroParaBanco,
  INDICE_CABECALHO_ORCAMENTOS_PADRAO,
  INDICES_ORCAMENTOS_FIXOS,
  linhaEhCabecalhoRepetido,
  linhaEstaVazia,
  lotes,
  normalizarClienteLoja,
  obterHeadersFixosOrcamentos,
  obterStatusDescricao,
  obterValor,
  resumoOrcamentosInicial,
  separarNumeroOrcamento,
  texto
} from '../utils/importacaoOrcamentos';


function normalizarCabecalhoOrcamento(valor: unknown) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function localizarIndiceDataCancelamento(
  rows: unknown[][],
  indiceCabecalhoPadrao: number
) {
  const nomesAceitos = new Set([
    'datacancela',
    'datacancelamento',
    'dtcancela',
    'dtcancelamento',
    'cancelamento'
  ]);

  const inicio = Math.max(0, indiceCabecalhoPadrao - 3);
  const fim = Math.min(rows.length, indiceCabecalhoPadrao + 4);

  for (let indiceLinha = inicio; indiceLinha < fim; indiceLinha += 1) {
    const linha = rows[indiceLinha] || [];

    for (let indiceColuna = 0; indiceColuna < linha.length; indiceColuna += 1) {
      if (nomesAceitos.has(normalizarCabecalhoOrcamento(linha[indiceColuna]))) {
        return indiceColuna;
      }
    }
  }

  // Regra oficial do ERP: coluna R. Como o array começa em zero, R = 17.
  return 17;
}

function converterDataCancelamentoParaIso(valor: unknown) {
  const conversaoPadrao = converterDataParaIso(valor);

  if (conversaoPadrao) {
    return conversaoPadrao;
  }

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const ano = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const dia = String(valor.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  if (typeof valor === 'number' && Number.isFinite(valor)) {
    const partes = XLSX.SSF.parse_date_code(valor);

    if (partes?.y && partes?.m && partes?.d) {
      return `${String(partes.y).padStart(4, '0')}-${String(partes.m).padStart(2, '0')}-${String(partes.d).padStart(2, '0')}`;
    }
  }

  const textoData = String(valor ?? '').trim();

  if (!textoData) {
    return null;
  }

  const brasileira = textoData.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:\s|$)/);

  if (brasileira) {
    return `${brasileira[3]}-${brasileira[2].padStart(2, '0')}-${brasileira[1].padStart(2, '0')}`;
  }

  const iso = textoData.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})(?:T|\s|$)/);

  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }

  return null;
}

function calcularDataLimiteStatusCliente() {
  const data = new Date();
  data.setMonth(data.getMonth() - MESES_STATUS_CLIENTE_ATIVO);
  return data.toISOString().slice(0, 10);
}

async function buscarClientesComOrcamentoRecente(
  dataLimite: string,
  origemImportacao: string | null
) {
  const clientesAtivos = new Set<string>();
  const tamanhoPagina = 1000;
  let inicio = 0;

  while (true) {
    let query = supabase
      .from('orcamentos_historico')
      .select('cliente_id')
      .not('cliente_id', 'is', null)
      .gte('data_emissao', dataLimite);

    if (origemImportacao) {
      query = query.eq('origem_importacao', origemImportacao);
    }

    const { data, error } = await query
      .range(inicio, inicio + tamanhoPagina - 1);

    if (error) {
      throw error;
    }

    const pagina = (data || []) as Array<{ cliente_id: string | null }>;

    pagina.forEach((linha) => {
      if (linha.cliente_id) {
        clientesAtivos.add(linha.cliente_id);
      }
    });

    if (pagina.length < tamanhoPagina) {
      break;
    }

    inicio += tamanhoPagina;
  }

  return Array.from(clientesAtivos);
}

async function atualizarStatusClientesEmLotes(
  clienteIds: string[],
  status: 'Ativo' | 'Inativo'
) {
  for (const lote of lotes(clienteIds, 500)) {
    const { error } = await supabase
      .from('clientes')
      .update({
        status
      })
      .in('id', lote);

    if (error) {
      throw error;
    }
  }
}

async function recalcularStatusClientesPorHistorico(
  origemImportacao: string | null
) {
  const dataLimite = calcularDataLimiteStatusCliente();
  const clientesAtivos = await buscarClientesComOrcamentoRecente(
    dataLimite,
    origemImportacao
  );

  const { error: erroInativos } = await supabase
    .from('clientes')
    .update({
      status: 'Inativo'
    })
    .not('id', 'is', null);

  if (erroInativos) {
    throw erroInativos;
  }

  await atualizarStatusClientesEmLotes(clientesAtivos, 'Ativo');

  return {
    clientesAtivos: clientesAtivos.length
  };
}

async function buscarClientesPorCodigo(codigos: string[]) {
  const mapa = new Map<string, string>();

  for (const lote of lotes(codigos, 500)) {
    const { data, error } = await supabase
      .from('clientes')
      .select('id,codigo_cliente')
      .in('codigo_cliente', lote);

    if (error) {
      throw error;
    }

    ((data || []) as ClienteLookup[]).forEach((cliente) => {
      if (cliente.codigo_cliente) {
        mapa.set(cliente.codigo_cliente, cliente.id);
      }
    });
  }

  return mapa;
}

function montarRegistrosProcessados(
  rows: unknown[][],
  arquivoNome: string
): {
  linhasProcessadas: LinhaProcessada[];
  resumo: ResumoOrcamentos;
} {
  // O relatório de orçamentos do ERP tem colunas fixas.
  // Para evitar falhas quando o cabeçalho muda acento, espaço, ponto ou descrição,
  // a importação não depende mais dos nomes dos cabeçalhos.
  //
  // Mapeamento oficial:
  // A = Numero It
  // B = Cliente
  // C = Loja
  // F = Descricao
  // G = Quantidade
  // I = Vlr.Total
  // J = Status
  // L = Pedido Venda
  // M = Fechamento
  // N = DT Emissao
  // P = Ramo / Área
  // R = Data Cancela
  const indiceCabecalho = INDICE_CABECALHO_ORCAMENTOS_PADRAO;
  const indiceDataCancelamento = localizarIndiceDataCancelamento(
    rows,
    indiceCabecalho
  );
  const indices = {
    ...INDICES_ORCAMENTOS_FIXOS,
    numeroIt: 0,
    cliente: 1,
    loja: 2,
    descricao: 5,
    quantidade: 6,
    valorTotal: 8,
    status: 9,
    pedidoVenda: 11,
    dataFechamento: 12,
    dataEmissao: 13,
    ramo: 15,
    dataCancelamento: indiceDataCancelamento
  };
  // Importação do funil comercial precisa manter o histórico completo.
  // O filtro de ano/mês é aplicado na tela do funil, não durante a importação.
  const novoResumo: ResumoOrcamentos = { ...resumoOrcamentosInicial };
  const linhasProcessadas: LinhaProcessada[] = [];
  const chavesInternas = new Set<string>();
  let totalCanceladosProcessados = 0;
  let totalCanceladosComData = 0;
  let totalCanceladosComValorNaColunaSemConversao = 0;

  rows.slice(indiceCabecalho + 1).forEach((linha) => {
    if (linhaEstaVazia(linha)) {
      return;
    }

    novoResumo.totalLinhasLidas += 1;

    if (linhaEhCabecalhoRepetido(linha, indices.numeroIt)) {
      novoResumo.cabecalhosIgnorados += 1;
      return;
    }

    const numeroItCompleto = texto(obterValor(linha, indices.numeroIt));

    if (!numeroItCompleto) {
      novoResumo.semNumeroIt += 1;
      return;
    }

    const clienteNormalizado = normalizarClienteLoja(
      obterValor(linha, indices.cliente),
      obterValor(linha, indices.loja)
    );

    if (!clienteNormalizado) {
      return;
    }

    const statusRaw = texto(obterValor(linha, indices.status)).toUpperCase();

    if (statusRaw === 'D') {
      novoResumo.statusDDesconsiderado += 1;
      return;
    }

    if (statusRaw !== 'A' && statusRaw !== 'B' && statusRaw !== 'C') {
      novoResumo.statusInvalido += 1;
      return;
    }

    const dataEmissao = converterDataParaIso(obterValor(linha, indices.dataEmissao));
    const dataFechamento = converterDataParaIso(
      obterValor(linha, indices.dataFechamento)
    );
    const valorDataCancelamento = obterValor(
      linha,
      indices.dataCancelamento
    );
    const dataCancelamento = converterDataCancelamentoParaIso(
      valorDataCancelamento
    );

    if (!dataEmissao) {
      novoResumo.dataInvalida += 1;
      return;
    }

    const chaveInterna = `${clienteNormalizado.codigo_cliente_loja}|${numeroItCompleto}`;

    if (chavesInternas.has(chaveInterna)) {
      novoResumo.duplicadosInternos += 1;
      return;
    }

    chavesInternas.add(chaveInterna);

    const status = statusRaw as StatusOrcamentoImportacao;

    if (status === 'C') {
      totalCanceladosProcessados += 1;

      if (dataCancelamento) {
        totalCanceladosComData += 1;
      } else if (String(valorDataCancelamento ?? '').trim()) {
        totalCanceladosComValorNaColunaSemConversao += 1;
      }
    }

    linhasProcessadas.push({
      ...clienteNormalizado,
      numero_it_completo: numeroItCompleto,
      numero_orcamento: separarNumeroOrcamento(numeroItCompleto),
      pedido_venda: texto(obterValor(linha, indices.pedidoVenda)) || null,
      descricao_item: texto(obterValor(linha, indices.descricao)) || null,
      quantidade_item: converterNumeroParaBanco(
        obterValor(linha, indices.quantidade)
      ),
      valor_total: converterNumeroParaBanco(
        obterValor(linha, indices.valorTotal)
      ),
      status,
      status_descricao: obterStatusDescricao(status),
      data_emissao: dataEmissao,
      data_fechamento: dataFechamento,
      data_cancelamento: dataCancelamento,
      ramo: texto(obterValor(linha, indices.ramo)) || null,
      origem_importacao: `planilha_orcamentos_crm:${arquivoNome}`
    });
  });

  if (totalCanceladosProcessados > 0 && totalCanceladosComData === 0) {
    throw new Error(
      [
        'Importação interrompida para proteger o histórico.',
        `Foram encontrados ${totalCanceladosProcessados} registros com status C,`,
        'mas nenhuma data de cancelamento válida foi lida.',
        `Coluna utilizada: ${indices.dataCancelamento + 1} (R = 18 na contagem visual).`,
        `Valores existentes que não puderam ser convertidos: ${totalCanceladosComValorNaColunaSemConversao}.`,
        'Confira se o arquivo selecionado é o relatório completo de orçamentos do ERP',
        'e se a coluna Data Cancela está presente.'
      ].join(' ')
    );
  }

  return {
    linhasProcessadas,
    resumo: novoResumo
  };
}

export async function processarPlanilhaOrcamentos(
  arquivo: File
): Promise<ProcessamentoPlanilhaOrcamentos> {
  const buffer = await arquivo.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const primeiraAba = workbook.SheetNames[0];

  if (!primeiraAba) {
    throw new Error('A planilha não possui abas para leitura.');
  }

  const worksheet = workbook.Sheets[primeiraAba];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    raw: true,
    defval: ''
  }) as unknown[][];

  const { linhasProcessadas, resumo } = montarRegistrosProcessados(
    rows,
    arquivo.name
  );

  const codigosClientes = Array.from(
    new Set(linhasProcessadas.map((linha) => linha.codigo_cliente_loja))
  );

  const clientesEncontrados = await buscarClientesPorCodigo(codigosClientes);
  const registrosComCliente: HistoricoImportacao[] = [];

  linhasProcessadas.forEach((linha) => {
    const clienteId = clientesEncontrados.get(linha.codigo_cliente_loja);

    if (!clienteId) {
      resumo.semClienteEncontrado += 1;
      return;
    }

    registrosComCliente.push({
      ...linha,
      cliente_id: clienteId
    });
  });

  const orcamentosUnicos = new Set(
    registrosComCliente.map(
      (linha) => `${linha.codigo_cliente_loja}|${linha.numero_orcamento}`
    )
  );

  resumo.validosParaImportar = registrosComCliente.length;
  resumo.orcamentosUnicos = orcamentosUnicos.size;
  resumo.abertos = registrosComCliente.filter((linha) => linha.status === 'A').length;
  resumo.fechados = registrosComCliente.filter((linha) => linha.status === 'B').length;
  resumo.cancelados = registrosComCliente.filter((linha) => linha.status === 'C').length;

  return {
    headers: obterHeadersFixosOrcamentos(),
    resumo,
    registros: registrosComCliente,
    preview: registrosComCliente.slice(0, 20)
  };
}

export async function importarHistoricoOrcamentos(params: {
  registros: HistoricoImportacao[];
  arquivoNome: string;
  resumo: ResumoOrcamentos;
}) {
  const dataImportacao = new Date().toISOString();
  const origemImportacao = montarOrigemImportacaoOrcamentos(
    params.arquivoNome,
    dataImportacao
  );

  const registrosParaGravar = params.registros.map((registro) => ({
    cliente_id: registro.cliente_id,
    codigo_cliente: registro.codigo_cliente,
    loja: registro.loja,
    codigo_cliente_loja: registro.codigo_cliente_loja,
    numero_it_completo: registro.numero_it_completo,
    numero_orcamento: registro.numero_orcamento,
    pedido_venda: registro.pedido_venda,
    descricao_item: registro.descricao_item,
    quantidade_item: registro.quantidade_item,
    valor_total: registro.valor_total,
    status: registro.status,
    status_descricao: registro.status_descricao,
    data_emissao: registro.data_emissao,
    data_fechamento: registro.data_fechamento,
    data_cancelamento: registro.data_cancelamento,
    ramo: registro.ramo,
    origem_importacao: origemImportacao,
    updated_at: dataImportacao
  }));

  const pacotes = lotes(registrosParaGravar, 500);

  for (const lote of pacotes) {
    const { error } = await supabase
      .from('orcamentos_historico')
      .upsert(lote, {
        onConflict: 'codigo_cliente_loja,numero_it_completo'
      });

    if (error) {
      throw error;
    }
  }

  const resultadoStatus = await recalcularStatusClientesPorHistorico(
    origemImportacao
  );

  const novoResultado = {
    enviados: registrosParaGravar.length,
    lotes: pacotes.length,
    clientesAtivos: resultadoStatus.clientesAtivos,
    origemImportacao
  };

  await registrarAuditoriaImportacao({
    tabela: 'orcamentos_historico',
    acao: 'importacao_orcamentos',
    arquivoNome: params.arquivoNome,
    resultado: {
      ...novoResultado,
      mesesStatusClienteAtivo: MESES_STATUS_CLIENTE_ATIVO,
      resumo: params.resumo
    }
  });

  return novoResultado;
}
