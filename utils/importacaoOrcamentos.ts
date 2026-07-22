import { MESES_HISTORICO_ORCAMENTOS } from './constants';
import {
  IndicesPlanilha,
  ResumoOrcamentos,
  StatusOrcamentoImportacao
} from '../types/importacaoOrcamentos';

export const INDICE_CABECALHO_ORCAMENTOS_PADRAO = 3;

export const INDICES_ORCAMENTOS_FIXOS: IndicesPlanilha = {
  numeroIt: 0, // Coluna A — Numero It
  cliente: 1, // Coluna B — Cliente
  loja: 2, // Coluna C — Loja
  descricao: 5, // Coluna F — Descricao
  quantidade: 6, // Coluna G — Quantidade
  valorTotal: 8, // Coluna I — Vlr.Total
  status: 9, // Coluna J — Status
  pedidoVenda: 11, // Coluna L — Pedido Venda
  dataFechamento: 12, // Coluna M — Fechamento
  dataEmissao: 13, // Coluna N — DT Emissao
  ramo: 15, // Coluna P — Ramo / Área
  dataCancelamento: 17 // Coluna R — Data Canc.
};

export const resumoOrcamentosInicial: ResumoOrcamentos = {
  totalLinhasLidas: 0,
  cabecalhosIgnorados: 0,
  validosParaImportar: 0,
  orcamentosUnicos: 0,
  semNumeroIt: 0,
  semCodigoCliente: 0,
  semClienteEncontrado: 0,
  dataInvalida: 0,
  foraHistoricoMeses: 0,
  statusDDesconsiderado: 0,
  statusInvalido: 0,
  duplicadosInternos: 0,
  abertos: 0,
  fechados: 0,
  cancelados: 0
};

export function texto(valor: unknown) {
  return String(valor ?? '').trim();
}

export function normalizarTexto(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, '');
}

export function lotes<T>(lista: T[], tamanho: number) {
  const resultado: T[][] = [];

  for (let i = 0; i < lista.length; i += tamanho) {
    resultado.push(lista.slice(i, i + tamanho));
  }

  return resultado;
}

export function calcularDataLimiteHistoricoOrcamentos() {
  const data = new Date();
  data.setMonth(data.getMonth() - MESES_HISTORICO_ORCAMENTOS);
  return data.toISOString().slice(0, 10);
}

export function formatarData(dataIso?: string | null) {
  if (!dataIso) return '-';
  const partes = dataIso.split('-');

  if (partes.length !== 3) {
    return dataIso;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function formatarDataParaIso(data: Date) {
  return data.toISOString().slice(0, 10);
}

export function converterSerialExcelParaIso(valor: number) {
  if (!Number.isFinite(valor) || valor <= 0) {
    return null;
  }

  const dataBaseExcel = Date.UTC(1899, 11, 30);
  const dias = Math.floor(valor);
  const data = new Date(dataBaseExcel + dias * 24 * 60 * 60 * 1000);

  return formatarDataParaIso(data);
}

export function converterTextoDataParaIso(valor: string) {
  const limpo = valor.trim();

  if (!limpo) {
    return null;
  }

  if (/^\d+(\.\d+)?$/.test(limpo)) {
    return converterSerialExcelParaIso(Number(limpo));
  }

  const partesBarra = limpo.split('/');

  if (partesBarra.length === 3) {
    const dia = Number(partesBarra[0]);
    const mes = Number(partesBarra[1]);
    const anoTexto = partesBarra[2];
    const ano =
      anoTexto.length === 2 ? Number(`20${anoTexto}`) : Number(anoTexto);

    if (dia > 0 && mes > 0 && ano > 1900) {
      const data = new Date(Date.UTC(ano, mes - 1, dia));

      if (
        data.getUTCFullYear() === ano &&
        data.getUTCMonth() === mes - 1 &&
        data.getUTCDate() === dia
      ) {
        return formatarDataParaIso(data);
      }
    }
  }

  const partesHifen = limpo.split('-');

  if (partesHifen.length === 3 && partesHifen[0].length === 4) {
    const ano = Number(partesHifen[0]);
    const mes = Number(partesHifen[1]);
    const dia = Number(partesHifen[2]);

    if (dia > 0 && mes > 0 && ano > 1900) {
      const data = new Date(Date.UTC(ano, mes - 1, dia));

      if (
        data.getUTCFullYear() === ano &&
        data.getUTCMonth() === mes - 1 &&
        data.getUTCDate() === dia
      ) {
        return formatarDataParaIso(data);
      }
    }
  }

  return null;
}

export function converterDataParaIso(valor: unknown) {
  if (valor instanceof Date) {
    return formatarDataParaIso(valor);
  }

  if (typeof valor === 'number') {
    return converterSerialExcelParaIso(valor);
  }

  return converterTextoDataParaIso(texto(valor));
}

export function converterNumeroParaBanco(valor: unknown) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null;
  }

  const limpo = texto(valor)
    .replace(/\./g, '')
    .replace(',', '.');

  if (!limpo) {
    return null;
  }

  const numero = Number(limpo);

  return Number.isFinite(numero) ? numero : null;
}

export function obterValor(linha: unknown[], indice: number) {
  return indice >= 0 ? linha[indice] : '';
}

export function obterStatusDescricao(status: StatusOrcamentoImportacao) {
  if (status === 'A') {
    return 'Aberto';
  }

  if (status === 'B') {
    return 'Fechado';
  }

  return 'Cancelado / Perdido';
}

export function separarNumeroOrcamento(numeroItCompleto: string) {
  const [numeroOrcamento] = numeroItCompleto.split('-');
  return texto(numeroOrcamento);
}

export function normalizarClienteLoja(valorCliente: unknown, valorLoja: unknown) {
  const clienteTexto = texto(valorCliente);
  const partesCliente = clienteTexto.split('-');

  const codigoBruto = partesCliente[0] || clienteTexto;
  const lojaBruta = partesCliente[1] || texto(valorLoja) || '0';
  const numerosCodigo = somenteNumeros(codigoBruto);
  const numerosLoja = somenteNumeros(lojaBruta);

  // Sem código de cliente não há cliente para relacionar e a linha deve ser ignorada,
  // sem virar "000000-00" e sem entrar como "sem cliente encontrado".
  if (!numerosCodigo) {
    return null;
  }

  const codigoCliente = numerosCodigo.padStart(6, '0');
  const loja = numerosLoja ? numerosLoja.padStart(2, '0') : '00';

  return {
    codigo_cliente: codigoCliente,
    loja,
    codigo_cliente_loja: `${codigoCliente}-${loja}`
  };
}

export function linhaEstaVazia(linha: unknown[]) {
  return linha.every((celula) => !texto(celula));
}

export function linhaEhCabecalhoRepetido(
  linha: unknown[],
  indiceNumeroIt: number
) {
  const primeiraColuna = normalizarTexto(texto(obterValor(linha, indiceNumeroIt)));
  return primeiraColuna === 'numero it';
}

export function obterHeadersFixosOrcamentos() {
  return [
    'Numero It',
    'Cliente',
    'Loja',
    'Descricao',
    'Quantidade',
    'Vlr.Total',
    'Status',
    'Pedido Venda',
    'Fechamento',
    'DT Emissao'
  ];
}
