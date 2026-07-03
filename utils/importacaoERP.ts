import * as XLSX from 'xlsx';
import { ClienteImportacao, ArquivoERPProcessado, ColunaReconhecidaERP, ResumoImportacaoERP } from '../types/importacaoERP';
import type { SegmentoCliente } from './constants';

export const resumoImportacaoERPInicial: ResumoImportacaoERP = {
  totalLinhas: 0,
  validos: 0,
  ignoradosSemCodigo: 0,
  ignoradosDuplicados: 0,
  ignoradosSemDados: 0,
  semNome: 0,
  semCnpj: 0,
  segmentosReconhecidos: 0,
  segmentosVazios: 0,
  segmentosNaoReconhecidos: 0,
  inseridosPrevistos: 0,
  atualizadosPrevistos: 0
};

export const texto = (valor: unknown) => String(valor ?? '').trim();

export const normalizarTextoImportacaoERP = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const somenteNumeros = (valor: string) => valor.replace(/\D/g, '');

/**
 * O ERP pode trazer CNPJ/CPF sem informação como ".   .   /    -".
 * Nesses casos não existe documento válido para gravar: o campo deve ficar vazio.
 */
export function normalizarCnpjCpfERP(valor: string) {
  const valorLimpo = texto(valor);

  if (!valorLimpo) return '';

  const numeros = somenteNumeros(valorLimpo);

  if (!numeros || /^0+$/.test(numeros)) {
    return '';
  }

  return valorLimpo;
}

export function normalizarSegmentoERP(valor: string): SegmentoCliente | '' {
  const segmentoNormalizado = normalizarTextoImportacaoERP(valor).replace(/\s+/g, ' ');

  if (!segmentoNormalizado) return '';

  if (
    segmentoNormalizado === 'agroindustria' ||
    segmentoNormalizado === 'agro industria' ||
    segmentoNormalizado === 'agro-industria'
  ) {
    return 'Agroindustria';
  }

  if (segmentoNormalizado === 'corrugados') {
    return 'Corrugados';
  }

  if (
    segmentoNormalizado === 'tempera indutiva' ||
    segmentoNormalizado === 'temper indutiva' ||
    segmentoNormalizado === 'tempera-indutiva'
  ) {
    return 'Tempera Indutiva';
  }

  if (
    segmentoNormalizado === 'tratamento termico' ||
    segmentoNormalizado === 'tratamento-termico'
  ) {
    return 'Tratamento Termico';
  }

  return '';
}

export function acharIndice(headers: unknown[], nomes: string[]) {
  const headersNormalizados = headers.map((header) =>
    normalizarTextoImportacaoERP(String(header ?? ''))
  );

  const nomesNormalizados = nomes.map(normalizarTextoImportacaoERP);

  return headersNormalizados.findIndex((header) =>
    nomesNormalizados.some((nome) => header === nome || header.includes(nome))
  );
}

export function porCabecalho(linha: unknown[], headers: unknown[], nomes: string[]) {
  const indice = acharIndice(headers, nomes);
  return indice >= 0 ? texto(linha[indice]) : '';
}

export function lotes<T>(lista: T[], tamanho: number) {
  const resultado: T[][] = [];

  for (let i = 0; i < lista.length; i += tamanho) {
    resultado.push(lista.slice(i, i + tamanho));
  }

  return resultado;
}

export function montarCodigoCliente(codigo: string, loja: string) {
  const codigoBase = somenteNumeros(String(codigo || ''));
  const lojaBase = somenteNumeros(String(loja || '0')) || '0';

  if (!codigoBase) return '';

  return `${codigoBase.padStart(6, '0')}-${lojaBase.padStart(2, '0')}`;
}

export function encontrarCabecalho(rows: unknown[][]) {
  for (let i = 0; i < rows.length; i++) {
    const linhaNormalizada = rows[i].map((celula) =>
      normalizarTextoImportacaoERP(String(celula ?? ''))
    );

    const temCodigo = linhaNormalizada.some(
      (valor) =>
        valor === 'codigo' || valor === 'cod' || valor.includes('codigo')
    );

    const temNome = linhaNormalizada.some(
      (valor) =>
        valor.includes('razao') ||
        valor.includes('nome') ||
        valor.includes('fantasia')
    );

    if (temCodigo && temNome) {
      return i;
    }
  }

  return -1;
}

export function obterColunasReconhecidasERP(headers: unknown[]): ColunaReconhecidaERP[] {
  if (!headers.length) return [];

  return [
    {
      campo: 'Código',
      origem: acharIndice(headers, ['Codigo', 'Código', 'Cod']) >= 0 ? 'Cabeçalho' : 'Coluna A'
    },
    {
      campo: 'Loja',
      origem: acharIndice(headers, ['Loja']) >= 0 ? 'Cabeçalho' : 'Coluna B'
    },
    { campo: 'Razão Social', origem: 'Coluna D / Cabeçalho' },
    { campo: 'Nome Fantasia', origem: 'Coluna E / Cabeçalho' },
    { campo: 'CNPJ', origem: 'Coluna AF / Cabeçalho' },
    { campo: 'Segmento', origem: 'Coluna EK / valores oficiais' },
    {
      campo: 'Cidade',
      origem: 'Coluna J / Municipio'
    },
    {
      campo: 'Estado',
      origem: acharIndice(headers, ['Estado', 'UF']) >= 0 ? 'Cabeçalho' : 'Não encontrada'
    },
    {
      campo: 'Endereço',
      origem: acharIndice(headers, ['Endereco', 'Endereço', 'Logradouro']) >= 0 ? 'Cabeçalho' : 'Não encontrada'
    }
  ];
}

export async function processarArquivoERP(arquivo: File): Promise<ArquivoERPProcessado> {
  const dados = await arquivo.arrayBuffer();

  const workbook = XLSX.read(dados, {
    type: 'array',
    cellDates: false
  });

  const nomeAba = workbook.SheetNames[0];
  const aba = workbook.Sheets[nomeAba];

  const rows: unknown[][] = XLSX.utils.sheet_to_json(aba, {
    header: 1,
    defval: '',
    blankrows: false
  });

  if (!rows.length) {
    throw new Error('A planilha está vazia.');
  }

  const headerIndex = encontrarCabecalho(rows);

  if (headerIndex === -1) {
    throw new Error(
      'Não foi possível encontrar o cabeçalho da planilha. Verifique se existe coluna de código e nome.'
    );
  }

  const cabecalho = rows[headerIndex];
  const linhasDados = rows.slice(headerIndex + 1);
  const unicos = new Map<string, ClienteImportacao>();

  const novoResumo: ResumoImportacaoERP = {
    ...resumoImportacaoERPInicial,
    totalLinhas: linhasDados.length
  };

  for (const [indiceLinha, linha] of linhasDados.entries()) {
    const numeroLinhaExcel = headerIndex + 2 + indiceLinha;

    const valorCelula = (coluna: string) => {
      const celula = aba[`${coluna}${numeroLinhaExcel}`];
      return texto(celula?.v ?? celula?.w ?? '');
    };

    const razaoSocialD = valorCelula('D');
    const nomeFantasiaE = valorCelula('E');
    const cnpjAF = valorCelula('AF');
    const segmentoEK = valorCelula('EK');
    const segmentoNormalizado = normalizarSegmentoERP(segmentoEK);

    if (!segmentoEK) {
      novoResumo.segmentosVazios++;
    } else if (segmentoNormalizado) {
      novoResumo.segmentosReconhecidos++;
    } else {
      novoResumo.segmentosNaoReconhecidos++;
    }

    const codigo =
      porCabecalho(linha, cabecalho, ['Codigo', 'Código', 'Cod']) ||
      texto(linha[0]);

    const loja = porCabecalho(linha, cabecalho, ['Loja']) || texto(linha[1]);
    const codigo_cliente = montarCodigoCliente(codigo, loja);

    if (!codigo_cliente) {
      novoResumo.ignoradosSemCodigo++;
      continue;
    }

    if (unicos.has(codigo_cliente)) {
      novoResumo.ignoradosDuplicados++;

      const clienteExistente = unicos.get(codigo_cliente);

      if (clienteExistente && !clienteExistente.segmento && segmentoNormalizado) {
        clienteExistente.segmento = segmentoNormalizado;
      }

      continue;
    }

    const razao_social =
      razaoSocialD ||
      porCabecalho(linha, cabecalho, [
        'Razao Social',
        'Razão Social',
        'Nome',
        'Cliente'
      ]);

    const nome_fantasia =
      nomeFantasiaE ||
      porCabecalho(linha, cabecalho, [
        'Nome Fantasia',
        'N Fantasia',
        'Fantasia'
      ]);

    const empresa = nome_fantasia || razao_social || `Cliente ${codigo_cliente}`;

    const cnpj = normalizarCnpjCpfERP(
      cnpjAF ||
        porCabecalho(linha, cabecalho, ['CNPJ', 'CNPJ/CPF', 'CNPJ CPF'])
    );

    if (!razao_social && !nome_fantasia && !cnpj) {
      novoResumo.ignoradosSemDados++;
      continue;
    }

    if (!razao_social && !nome_fantasia) novoResumo.semNome++;
    if (!cnpj) novoResumo.semCnpj++;

    // Regra oficial do ERP Friese:
    // Cidade deve vir obrigatoriamente da coluna J da planilha de cadastro de clientes.
    // A coluna I é "Cd.Municipio" e contém apenas o código numérico do município.
    // Por isso NÃO usamos busca por cabeçalho "Municipio" aqui, pois ela pode capturar a coluna I.
    const cidade = valorCelula('J');

    // Estado vem da coluna H da planilha de cadastro de clientes.
    const estado = valorCelula('H') || porCabecalho(linha, cabecalho, ['Estado', 'UF']);

    const endereco = porCabecalho(linha, cabecalho, [
      'Endereco',
      'Endereço',
      'Logradouro'
    ]);

    const clienteImportacao: ClienteImportacao = {
      codigo_cliente,
      empresa,
      nome_fantasia,
      razao_social,
      cnpj,
      cidade,
      estado: estado ? estado.toUpperCase() : '',
      endereco,
      status: 'Inativo'
    };

    if (segmentoNormalizado) {
      clienteImportacao.segmento = segmentoNormalizado;
    }

    unicos.set(codigo_cliente, clienteImportacao);
  }

  const clientes = Array.from(unicos.values());

  if (!clientes.length) {
    throw new Error('Nenhum dado válido encontrado para importação.');
  }

  novoResumo.validos = clientes.length;

  return {
    headers: cabecalho,
    clientes,
    resumo: novoResumo
  };
}
