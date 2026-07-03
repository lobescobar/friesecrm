import { Cliente } from './index';

export type ClienteImportacao = Partial<Cliente> & {
  codigo_cliente: string;
  empresa: string;
};

export type ResumoImportacaoERP = {
  totalLinhas: number;
  validos: number;
  ignoradosSemCodigo: number;
  ignoradosDuplicados: number;
  ignoradosSemDados: number;
  semNome: number;
  semCnpj: number;
  segmentosReconhecidos: number;
  segmentosVazios: number;
  segmentosNaoReconhecidos: number;
  inseridosPrevistos: number;
  atualizadosPrevistos: number;
};

export type ResultadoImportacaoERP = {
  inseridos: number;
  atualizados: number;
  ignoradosComErro: number;
  primeiraMensagemErro: string;
};

export type ColunaReconhecidaERP = {
  campo: string;
  origem: string;
};

export type ArquivoERPProcessado = {
  headers: unknown[];
  clientes: ClienteImportacao[];
  resumo: ResumoImportacaoERP;
};
