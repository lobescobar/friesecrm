'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { Cliente } from '../../types';
import { SEGMENTOS_CLIENTES } from '../../utils/constants';
import type { SegmentoCliente } from '../../utils/constants';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

type ImportarERPProps = {
  onSucesso?: () => void;
};

type ClienteImportacao = Partial<Cliente> & {
  codigo_cliente: string;
  empresa: string;
};

type ResumoImportacao = {
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

type ResultadoImportacao = {
  inseridos: number;
  atualizados: number;
  ignoradosComErro: number;
  primeiraMensagemErro: string;
};

const resumoInicial: ResumoImportacao = {
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

const texto = (valor: unknown) => String(valor ?? '').trim();

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const somenteNumeros = (valor: string) => valor.replace(/\D/g, '');

function normalizarSegmentoERP(valor: string): SegmentoCliente | '' {
  const segmentoNormalizado = normalizar(valor).replace(/\s+/g, ' ');

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


function acharIndice(headers: unknown[], nomes: string[]) {
  const headersNormalizados = headers.map((header) =>
    normalizar(String(header ?? ''))
  );

  const nomesNormalizados = nomes.map(normalizar);

  return headersNormalizados.findIndex((header) =>
    nomesNormalizados.some((nome) => header === nome || header.includes(nome))
  );
}

function porCabecalho(linha: unknown[], headers: unknown[], nomes: string[]) {
  const indice = acharIndice(headers, nomes);
  return indice >= 0 ? texto(linha[indice]) : '';
}

function lotes<T>(lista: T[], tamanho: number) {
  const resultado: T[][] = [];

  for (let i = 0; i < lista.length; i += tamanho) {
    resultado.push(lista.slice(i, i + tamanho));
  }

  return resultado;
}

function montarCodigoCliente(codigo: string, loja: string) {
  const codigoBase = somenteNumeros(String(codigo || ''));
  const lojaBase = somenteNumeros(String(loja || '0')) || '0';

  if (!codigoBase) return '';

  return `${codigoBase.padStart(6, '0')}-${lojaBase.padStart(2, '0')}`;
}

function encontrarCabecalho(rows: unknown[][]) {
  for (let i = 0; i < rows.length; i++) {
    const linhaNormalizada = rows[i].map((celula) =>
      normalizar(String(celula ?? ''))
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

async function buscarClientesExistentes(codigos: string[]) {
  const existentes = new Map<
    string,
    Pick<Cliente, 'codigo_cliente' | 'segmento' | 'status'>
  >();

  for (const lote of lotes(codigos, 500)) {
    const { data, error } = await supabase
      .from('clientes')
      .select('codigo_cliente, segmento, status')
      .in('codigo_cliente', lote);

    if (error) {
      throw error;
    }

    (data || []).forEach((item) => {
      const codigo = String(item.codigo_cliente || '');
      if (codigo) {
        existentes.set(codigo, {
          codigo_cliente: codigo,
          segmento: item.segmento || null,
          status:
            item.status === 'Ativo' || item.status === 'Inativo'
              ? item.status
              : 'Inativo'
        });
      }
    });
  }

  return existentes;
}

async function buscarCodigosExistentes(codigos: string[]) {
  return new Set((await buscarClientesExistentes(codigos)).keys());
}

export default function ImportarERP({ onSucesso }: ImportarERPProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [arquivoNome, setArquivoNome] = useState('');
  const [clientesParaImportar, setClientesParaImportar] = useState<ClienteImportacao[]>([]);
  const [headers, setHeaders] = useState<unknown[]>([]);
  const [resumo, setResumo] = useState<ResumoImportacao>(resumoInicial);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState('');
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  const colunasReconhecidas = useMemo(() => {
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
        origem: acharIndice(headers, ['Municipio', 'Município', 'Cidade']) >= 0 ? 'Cabeçalho' : 'Não encontrada'
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
  }, [headers]);

  const resetar = () => {
    setArquivoNome('');
    setClientesParaImportar([]);
    setHeaders([]);
    setResumo(resumoInicial);
    setMensagem(null);
    setErro(null);
    setProcessando(false);
    setProgresso('');
    setResultado(null);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const abrir = () => {
    resetar();
    setAberto(true);
  };

  const fechar = () => {
    if (processando) return;
    setAberto(false);
  };

  async function prepararArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo || processando) return;

    resetar();
    setArquivoNome(arquivo.name);
    setProcessando(true);
    setProgresso('Lendo planilha...');

    try {
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
        setErro('A planilha está vazia.');
        return;
      }

      const headerIndex = encontrarCabecalho(rows);

      if (headerIndex === -1) {
        setErro(
          'Não foi possível encontrar o cabeçalho da planilha. Verifique se existe coluna de código e nome.'
        );
        return;
      }

      const cabecalho = rows[headerIndex];
      const linhasDados = rows.slice(headerIndex + 1);
      const unicos = new Map<string, ClienteImportacao>();

      const novoResumo: ResumoImportacao = {
        ...resumoInicial,
        totalLinhas: linhasDados.length
      };

      setProgresso('Convertendo dados...');

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

        const cnpj =
          cnpjAF ||
          porCabecalho(linha, cabecalho, ['CNPJ', 'CNPJ/CPF', 'CNPJ CPF']);

        if (!razao_social && !nome_fantasia && !cnpj) {
          novoResumo.ignoradosSemDados++;
          continue;
        }

        if (!razao_social && !nome_fantasia) novoResumo.semNome++;
        if (!cnpj) novoResumo.semCnpj++;

        const cidade = porCabecalho(linha, cabecalho, [
          'Municipio',
          'Município',
          'Cidade'
        ]);

        const estado = porCabecalho(linha, cabecalho, ['Estado', 'UF']);

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
        setErro('Nenhum dado válido encontrado para importação.');
        return;
      }

      setProgresso('Verificando clientes já cadastrados...');

      const codigosExistentes = await buscarCodigosExistentes(
        clientes.map((cliente) => cliente.codigo_cliente)
      );

      clientes.forEach((cliente) => {
        if (codigosExistentes.has(cliente.codigo_cliente)) {
          novoResumo.atualizadosPrevistos++;
        } else {
          novoResumo.inseridosPrevistos++;
        }
      });

      novoResumo.validos = clientes.length;

      setHeaders(cabecalho);
      setClientesParaImportar(clientes);
      setResumo(novoResumo);
      setMensagem(
        'Planilha lida com sucesso. Revise a prévia e confirme para gravar no banco.'
      );
    } catch (error) {
      console.error('Erro ao preparar importação:', error);
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro inesperado durante a leitura da planilha.'
      );
    } finally {
      setProcessando(false);
      setProgresso('');
    }
  }

  async function confirmarImportacao() {
    if (!clientesParaImportar.length || processando) return;

    setProcessando(true);
    setErro(null);
    setMensagem(null);

    let inseridos = 0;
    let atualizados = 0;
    let ignoradosComErro = 0;
    let primeiraMensagemErro = '';

    try {
      const clientesExistentes = await buscarClientesExistentes(
        clientesParaImportar.map((cliente) => cliente.codigo_cliente)
      );

      const codigosExistentes = new Set(clientesExistentes.keys());

      const clientesNormalizados = clientesParaImportar.map((cliente) => {
        const clienteAtualBanco = clientesExistentes.get(cliente.codigo_cliente);

        return {
          ...cliente,
          segmento: cliente.segmento || clienteAtualBanco?.segmento || null,
          status:
            clienteAtualBanco?.status === 'Ativo' ||
            clienteAtualBanco?.status === 'Inativo'
              ? clienteAtualBanco.status
              : 'Inativo'
        };
      });

      const lotesImportacao = lotes(clientesNormalizados, 50);

      for (let i = 0; i < lotesImportacao.length; i++) {
        setProgresso(`Importando lote ${i + 1}/${lotesImportacao.length}...`);

        const loteAtual = lotesImportacao[i];

        const { error } = await supabase.from('clientes').upsert(loteAtual, {
          onConflict: 'codigo_cliente',
          ignoreDuplicates: false
        });

        if (error) {
          console.warn('Erro ao importar lote:', error.message);

          for (const cliente of loteAtual) {
            const { error: erroIndividual } = await supabase
              .from('clientes')
              .upsert(cliente, {
                onConflict: 'codigo_cliente',
                ignoreDuplicates: false
              });

            if (erroIndividual) {
              console.warn(
                'Erro ao importar cliente:',
                cliente.codigo_cliente,
                erroIndividual.message
              );

              ignoradosComErro++;

              if (!primeiraMensagemErro) {
                primeiraMensagemErro = erroIndividual.message;
              }
            } else if (codigosExistentes.has(cliente.codigo_cliente)) {
              atualizados++;
            } else {
              inseridos++;
            }
          }
        } else {
          loteAtual.forEach((cliente) => {
            if (codigosExistentes.has(cliente.codigo_cliente)) {
              atualizados++;
            } else {
              inseridos++;
            }
          });
        }
      }

      const novoResultado = {
        inseridos,
        atualizados,
        ignoradosComErro,
        primeiraMensagemErro
      };

      setResultado(novoResultado);
      setMensagem('Importação concluída com sucesso.');
      onSucesso?.();
    } catch (error) {
      console.error('Erro na importação:', error);
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro inesperado durante a importação.'
      );
    } finally {
      setProcessando(false);
      setProgresso('');
    }
  }

  return (
    <>
      <Button type="button" onClick={abrir}>
        <span>📥</span>
        Importar ERP
      </Button>

      {aberto ? (
        <Modal
          title="Importação ERP"
          subtitle="Fluxo guiado para revisar a planilha antes de gravar no Supabase."
          onClose={fechar}
          bloquearFechamento={processando}
          footer={
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-500">
                {processando
                  ? progresso || 'Processando...'
                  : mensagem || erro || 'Selecione uma planilha para começar.'}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => inputRef.current?.click()}
                  disabled={processando}
                >
                  Selecionar arquivo
                </Button>

                <Button
                  type="button"
                  onClick={confirmarImportacao}
                  disabled={processando || !clientesParaImportar.length || Boolean(resultado)}
                >
                  {processando ? 'Processando...' : 'Confirmar importação'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={fechar}
                  disabled={processando}
                >
                  Fechar
                </Button>
              </div>
            </div>
          }
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={prepararArquivo}
            disabled={processando}
          />

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                Arquivo: {arquivoNome || 'nenhum arquivo selecionado'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Mapeamento respeitado: D = razão social, E = nome fantasia, AF = CNPJ, EK = segmento. Segmentos vazios em EK não alteram segmentos já existentes.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                Segmentos oficiais aceitos na coluna EK
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SEGMENTOS_CLIENTES.map((segmento) => (
                  <span
                    key={segmento}
                    className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-blue-700"
                  >
                    {segmento}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-blue-700">
                Células vazias são desconsideradas. Valores fora dessa lista não
                serão gravados como segmento.
              </p>
            </div>

            {erro ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {erro}
              </div>
            ) : null}

            {colunasReconhecidas.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Colunas reconhecidas
                </h3>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {colunasReconhecidas.map((coluna) => (
                    <div
                      key={coluna.campo}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <p className="text-xs font-bold uppercase text-slate-400">
                        {coluna.campo}
                      </p>
                      <p className="text-sm font-medium text-slate-700">
                        {coluna.origem}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {clientesParaImportar.length ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">
                    Resumo antes de importar
                  </h3>

                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt>Total de linhas lidas</dt>
                      <dd className="font-bold">{resumo.totalLinhas}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Registros válidos</dt>
                      <dd className="font-bold">{resumo.validos}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Inserções previstas</dt>
                      <dd className="font-bold">{resumo.inseridosPrevistos}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Atualizações previstas</dt>
                      <dd className="font-bold">{resumo.atualizadosPrevistos}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Sem código ERP</dt>
                      <dd className="font-bold">{resumo.ignoradosSemCodigo}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Duplicados internos</dt>
                      <dd className="font-bold">{resumo.ignoradosDuplicados}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Sem CNPJ</dt>
                      <dd className="font-bold">{resumo.semCnpj}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Segmentos reconhecidos</dt>
                      <dd className="font-bold">{resumo.segmentosReconhecidos}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Segmentos vazios desconsiderados</dt>
                      <dd className="font-bold">{resumo.segmentosVazios}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Segmentos fora do padrão</dt>
                      <dd className="font-bold">{resumo.segmentosNaoReconhecidos}</dd>
                    </div>
                  </dl>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-2">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Prévia dos primeiros 20 registros
                    </h3>
                  </div>

                  <div className="max-h-72 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Código</th>
                          <th className="px-3 py-2 text-left">Cliente</th>
                          <th className="px-3 py-2 text-left">CNPJ</th>
                          <th className="px-3 py-2 text-left">Segmento</th>
                          <th className="px-3 py-2 text-left">Cidade/UF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientesParaImportar.slice(0, 20).map((cliente) => (
                          <tr key={cliente.codigo_cliente} className="border-t">
                            <td className="px-3 py-2 font-mono">
                              {cliente.codigo_cliente}
                            </td>
                            <td className="px-3 py-2">{cliente.empresa}</td>
                            <td className="px-3 py-2">{cliente.cnpj || '-'}</td>
                            <td className="px-3 py-2">{cliente.segmento || '-'}</td>
                            <td className="px-3 py-2">
                              {[cliente.cidade, cliente.estado].filter(Boolean).join(' - ') || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}

            {resultado ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <h3 className="mb-2 font-bold">Resultado final</h3>
                <p>Inseridos: {resultado.inseridos}</p>
                <p>Atualizados: {resultado.atualizados}</p>
                <p>Ignorados com erro: {resultado.ignoradosComErro}</p>
                {resultado.primeiraMensagemErro ? (
                  <p className="mt-2">
                    Primeiro erro: {resultado.primeiraMensagemErro}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
