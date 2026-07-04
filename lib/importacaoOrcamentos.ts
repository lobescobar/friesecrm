import * as XLSX from 'xlsx';
import { registrarAuditoriaImportacao } from './auditoria';
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
  calcularDataLimiteHistoricoOrcamentos,
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

function calcularDataLimiteStatusCliente() {
  const data = new Date();
  data.setMonth(data.getMonth() - MESES_STATUS_CLIENTE_ATIVO);
  return data.toISOString().slice(0, 10);
}

async function buscarClientesComOrcamentoRecente(dataLimite: string) {
  const clientesAtivos = new Set<string>();
  const tamanhoPagina = 1000;
  let inicio = 0;

  while (true) {
    const { data, error } = await supabase
      .from('orcamentos_historico')
      .select('cliente_id')
      .not('cliente_id', 'is', null)
      .gte('data_emissao', dataLimite)
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

async function recalcularStatusClientesPorHistorico() {
  const dataLimite = calcularDataLimiteStatusCliente();
  const clientesAtivos = await buscarClientesComOrcamentoRecente(dataLimite);

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
  // J = Status
  // L = Pedido Venda
  // M = Fechamento
  // N = DT Emissao
  const indiceCabecalho = INDICE_CABECALHO_ORCAMENTOS_PADRAO;
  const indices = INDICES_ORCAMENTOS_FIXOS;
  const dataLimite = calcularDataLimiteHistoricoOrcamentos();

  const novoResumo: ResumoOrcamentos = { ...resumoOrcamentosInicial };
  const linhasProcessadas: LinhaProcessada[] = [];
  const chavesInternas = new Set<string>();

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

    if (!dataEmissao) {
      novoResumo.dataInvalida += 1;
      return;
    }

    if (dataEmissao < dataLimite) {
      novoResumo.foraHistoricoMeses += 1;
      return;
    }

    const chaveInterna = `${clienteNormalizado.codigo_cliente_loja}|${numeroItCompleto}`;

    if (chavesInternas.has(chaveInterna)) {
      novoResumo.duplicadosInternos += 1;
      return;
    }

    chavesInternas.add(chaveInterna);

    const status = statusRaw as StatusOrcamentoImportacao;

    linhasProcessadas.push({
      ...clienteNormalizado,
      numero_it_completo: numeroItCompleto,
      numero_orcamento: separarNumeroOrcamento(numeroItCompleto),
      pedido_venda: texto(obterValor(linha, indices.pedidoVenda)) || null,
      descricao_item: texto(obterValor(linha, indices.descricao)) || null,
      quantidade_item: converterNumeroParaBanco(
        obterValor(linha, indices.quantidade)
      ),
      status,
      status_descricao: obterStatusDescricao(status),
      data_emissao: dataEmissao,
      data_fechamento: dataFechamento,
      origem_importacao: `planilha_orcamentos_crm:${arquivoNome}`
    });
  });

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
    status: registro.status,
    status_descricao: registro.status_descricao,
    data_emissao: registro.data_emissao,
    data_fechamento: registro.data_fechamento,
    origem_importacao: registro.origem_importacao,
    updated_at: new Date().toISOString()
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

  const resultadoStatus = await recalcularStatusClientesPorHistorico();

  const novoResultado = {
    enviados: registrosParaGravar.length,
    lotes: pacotes.length,
    clientesAtivos: resultadoStatus.clientesAtivos
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
