'use client';

import { ChangeEvent, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { registrarAuditoriaImportacao } from '../../lib/auditoria';
import { supabase } from '../../lib/supabase';
import {
  MESES_HISTORICO_ORCAMENTOS,
  MESES_STATUS_CLIENTE_ATIVO
} from '../../utils/constants';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

type HistoricoImportacao = {
  cliente_id: string;
  codigo_cliente: string;
  loja: string;
  codigo_cliente_loja: string;
  numero_it_completo: string;
  numero_orcamento: string;
  pedido_venda: string | null;
  descricao_item: string | null;
  quantidade_item: number | null;
  status: 'A' | 'B' | 'C';
  status_descricao: string;
  data_emissao: string;
  data_fechamento: string | null;
  origem_importacao: string;
};

type LinhaProcessada = Omit<HistoricoImportacao, 'cliente_id'>;

type ClienteLookup = {
  id: string;
  codigo_cliente: string | null;
};

type ResumoOrcamentos = {
  totalLinhasLidas: number;
  cabecalhosIgnorados: number;
  validosParaImportar: number;
  orcamentosUnicos: number;
  semNumeroIt: number;
  semCodigoCliente: number;
  semClienteEncontrado: number;
  dataInvalida: number;
  foraHistoricoMeses: number;
  statusDDesconsiderado: number;
  statusInvalido: number;
  duplicadosInternos: number;
  abertos: number;
  fechados: number;
  cancelados: number;
};

type ResultadoImportacao = {
  enviados: number;
  lotes: number;
  clientesAtivos: number;
};

type ImportarOrcamentosProps = {
  onSucesso?: () => void;
};

type IndicesPlanilha = {
  numeroIt: number;
  cliente: number;
  loja: number;
  pedidoVenda: number;
  descricao: number;
  quantidade: number;
  status: number;
  dataEmissao: number;
  dataFechamento: number;
};

const INDICE_CABECALHO_ORCAMENTOS_PADRAO = 3;

const INDICES_ORCAMENTOS_FIXOS: IndicesPlanilha = {
  numeroIt: 0, // Coluna A — Numero It
  cliente: 1, // Coluna B — Cliente
  loja: 2, // Coluna C — Loja
  descricao: 5, // Coluna F — Descricao
  quantidade: 6, // Coluna G — Quantidade
  status: 9, // Coluna J — Status
  pedidoVenda: 11, // Coluna L — Pedido Venda
  dataFechamento: 12, // Coluna M — Fechamento
  dataEmissao: 13 // Coluna N — DT Emissao
};


const resumoInicial: ResumoOrcamentos = {
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

const texto = (valor: unknown) => String(valor ?? '').trim();

const normalizarTexto = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const somenteNumeros = (valor: string) => valor.replace(/\D/g, '');

function lotes<T>(lista: T[], tamanho: number) {
  const resultado: T[][] = [];

  for (let i = 0; i < lista.length; i += tamanho) {
    resultado.push(lista.slice(i, i + tamanho));
  }

  return resultado;
}

function calcularDataLimiteHistoricoOrcamentos() {
  const data = new Date();
  data.setMonth(data.getMonth() - MESES_HISTORICO_ORCAMENTOS);
  return data.toISOString().slice(0, 10);
}

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

function formatarData(dataIso?: string | null) {
  if (!dataIso) return '-';
  const partes = dataIso.split('-');

  if (partes.length !== 3) {
    return dataIso;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataParaIso(data: Date) {
  return data.toISOString().slice(0, 10);
}

function converterSerialExcelParaIso(valor: number) {
  if (!Number.isFinite(valor) || valor <= 0) {
    return null;
  }

  const dataBaseExcel = Date.UTC(1899, 11, 30);
  const dias = Math.floor(valor);
  const data = new Date(dataBaseExcel + dias * 24 * 60 * 60 * 1000);

  return formatarDataParaIso(data);
}

function converterTextoDataParaIso(valor: string) {
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
    const ano = anoTexto.length === 2 ? Number(`20${anoTexto}`) : Number(anoTexto);

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

function converterDataParaIso(valor: unknown) {
  if (valor instanceof Date) {
    return formatarDataParaIso(valor);
  }

  if (typeof valor === 'number') {
    return converterSerialExcelParaIso(valor);
  }

  return converterTextoDataParaIso(texto(valor));
}


function converterNumeroParaBanco(valor: unknown) {
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

function obterValor(linha: unknown[], indice: number) {
  return indice >= 0 ? linha[indice] : '';
}

function obterStatusDescricao(status: 'A' | 'B' | 'C') {
  if (status === 'A') {
    return 'Aberto';
  }

  if (status === 'B') {
    return 'Fechado';
  }

  return 'Cancelado / Perdido';
}

function separarNumeroOrcamento(numeroItCompleto: string) {
  const [numeroOrcamento] = numeroItCompleto.split('-');
  return texto(numeroOrcamento);
}

function normalizarClienteLoja(valorCliente: unknown, valorLoja: unknown) {
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

function linhaEstaVazia(linha: unknown[]) {
  return linha.every((celula) => !texto(celula));
}

function linhaEhCabecalhoRepetido(linha: unknown[], indiceNumeroIt: number) {
  const primeiraColuna = normalizarTexto(texto(obterValor(linha, indiceNumeroIt)));
  return primeiraColuna === 'numero it';
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

export default function ImportarOrcamentos({ onSucesso }: ImportarOrcamentosProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [aberto, setAberto] = useState(false);
  const [arquivoNome, setArquivoNome] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [resumo, setResumo] = useState<ResumoOrcamentos>(resumoInicial);
  const [registros, setRegistros] = useState<HistoricoImportacao[]>([]);
  const [preview, setPreview] = useState<HistoricoImportacao[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  const limparEstado = () => {
    setArquivoNome('');
    setHeaders([]);
    setResumo(resumoInicial);
    setRegistros([]);
    setPreview([]);
    setMensagem(null);
    setErro(null);
    setResultado(null);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const fecharModal = () => {
    if (!processando && !importando) {
      setAberto(false);
    }
  };

  const processarArquivo = async (arquivo: File) => {
    setProcessando(true);
    setErro(null);
    setMensagem(null);
    setResultado(null);
    setArquivoNome(arquivo.name);

    try {
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

      const novoResumo: ResumoOrcamentos = { ...resumoInicial };
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

        const status = statusRaw as 'A' | 'B' | 'C';

        linhasProcessadas.push({
          ...clienteNormalizado,
          numero_it_completo: numeroItCompleto,
          numero_orcamento: separarNumeroOrcamento(numeroItCompleto),
          pedido_venda: texto(obterValor(linha, indices.pedidoVenda)) || null,
          descricao_item: texto(obterValor(linha, indices.descricao)) || null,
          quantidade_item: converterNumeroParaBanco(obterValor(linha, indices.quantidade)),
          status,
          status_descricao: obterStatusDescricao(status),
          data_emissao: dataEmissao,
          data_fechamento: dataFechamento,
          origem_importacao: `planilha_orcamentos_crm:${arquivo.name}`
        });
      });

      const codigosClientes = Array.from(
        new Set(linhasProcessadas.map((linha) => linha.codigo_cliente_loja))
      );

      const clientesEncontrados = await buscarClientesPorCodigo(codigosClientes);
      const registrosComCliente: HistoricoImportacao[] = [];

      linhasProcessadas.forEach((linha) => {
        const clienteId = clientesEncontrados.get(linha.codigo_cliente_loja);

        if (!clienteId) {
          novoResumo.semClienteEncontrado += 1;
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

      novoResumo.validosParaImportar = registrosComCliente.length;
      novoResumo.orcamentosUnicos = orcamentosUnicos.size;
      novoResumo.abertos = registrosComCliente.filter((linha) => linha.status === 'A').length;
      novoResumo.fechados = registrosComCliente.filter((linha) => linha.status === 'B').length;
      novoResumo.cancelados = registrosComCliente.filter((linha) => linha.status === 'C').length;

      setHeaders([
        'Numero It',
        'Cliente',
        'Loja',
        'Descricao',
        'Quantidade',
        'Status',
        'Pedido Venda',
        'Fechamento',
        'DT Emissao'
      ]);
      setResumo(novoResumo);
      setRegistros(registrosComCliente);
      setPreview(registrosComCliente.slice(0, 20));
      setMensagem(
        registrosComCliente.length > 0
          ? 'Planilha lida com sucesso. Revise o resumo antes de confirmar.'
          : 'A planilha foi lida, mas nenhum orçamento ficou válido para importação.'
      );
    } catch (error) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : 'Não foi possível ler a planilha de orçamentos.';

      console.error('Erro ao processar planilha de orçamentos:', error);
      setErro(mensagemErro);
      setRegistros([]);
      setPreview([]);
    } finally {
      setProcessando(false);
    }
  };

  const selecionarArquivo = (event: ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    void processarArquivo(arquivo);
  };

  const confirmarImportacao = async () => {
    if (registros.length === 0) {
      setErro('Não há registros válidos para importar.');
      return;
    }

    setImportando(true);
    setErro(null);
    setMensagem(null);
    setResultado(null);

    try {
      const registrosParaGravar = registros.map((registro) => ({
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

      setMensagem('Histórico importado. Recalculando status dos clientes...');
      const resultadoStatus = await recalcularStatusClientesPorHistorico();

      const novoResultado = {
        enviados: registrosParaGravar.length,
        lotes: pacotes.length,
        clientesAtivos: resultadoStatus.clientesAtivos
      };

      await registrarAuditoriaImportacao({
        tabela: 'orcamentos_historico',
        acao: 'importacao_orcamentos',
        arquivoNome,
        resultado: {
          ...novoResultado,
          mesesStatusClienteAtivo: MESES_STATUS_CLIENTE_ATIVO,
          resumo
        }
      });

      setResultado(novoResultado);

      setMensagem(
        `Histórico de orçamentos importado com sucesso. Status recalculado: ${resultadoStatus.clientesAtivos.toLocaleString(
          'pt-BR'
        )} cliente(s) ativo(s) nos últimos ${MESES_STATUS_CLIENTE_ATIVO} meses.`
      );
      onSucesso?.();
    } catch (error) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : 'Não foi possível importar o histórico de orçamentos.';

      console.error('Erro ao importar histórico de orçamentos:', error);
      setErro(mensagemErro);
    } finally {
      setImportando(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="success"
        onClick={() => {
          limparEstado();
          setAberto(true);
        }}
      >
        Importar Orçamentos
      </Button>

      {aberto ? (
        <Modal
          title="Importar Orçamentos"
          subtitle={`Histórico dos últimos ${MESES_HISTORICO_ORCAMENTOS} meses por cliente`}
          onClose={fecharModal}
          bloquearFechamento={processando || importando}
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                {arquivoNome ? `Arquivo: ${arquivoNome}` : 'Nenhum arquivo selecionado.'}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={fecharModal}
                  disabled={processando || importando}
                >
                  Fechar
                </Button>

                <Button
                  type="button"
                  onClick={confirmarImportacao}
                  disabled={registros.length === 0 || processando || importando}
                >
                  {importando ? 'Importando...' : 'Confirmar importação'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-bold text-slate-900">
                Selecionar planilha
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Use a planilha Relatório de Orçamentos CRM. O sistema vai
                considerar somente status A, B e C, ignorar status D, manter
                apenas dados dos últimos {MESES_HISTORICO_ORCAMENTOS} meses pela data de emissão e importar
                a data de fechamento quando houver, guardar a descrição e a quantidade do item. Após a importação, o status dos clientes será recalculado: Ativo com orçamento nos últimos{' '}
                {MESES_STATUS_CLIENTE_ATIVO} meses; sem histórico recente, Inativo.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={selecionarArquivo}
                  disabled={processando || importando}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />

                <Button
                  type="button"
                  variant="secondary"
                  onClick={limparEstado}
                  disabled={processando || importando}
                >
                  Limpar
                </Button>
              </div>
            </section>

            {processando ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                Lendo e validando a planilha. Aguarde...
              </div>
            ) : null}

            {erro ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <strong>Erro:</strong> {erro}
              </div>
            ) : null}

            {mensagem ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {mensagem}
              </div>
            ) : null}

            {headers.length > 0 ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                  Colunas reconhecidas
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {headers.map((header) => (
                    <span
                      key={header}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {header}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Resumo da leitura
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <ResumoItem label="Linhas lidas" valor={resumo.totalLinhasLidas} />
                <ResumoItem label="Itens válidos" valor={resumo.validosParaImportar} />
                <ResumoItem label="Orçamentos" valor={resumo.orcamentosUnicos} />
                <ResumoItem label="Abertos" valor={resumo.abertos} />
                <ResumoItem label="Fechados" valor={resumo.fechados} />
                <ResumoItem label="Cancelados" valor={resumo.cancelados} />
                <ResumoItem label="Fora do período" valor={resumo.foraHistoricoMeses} />
                <ResumoItem label="Sem cliente" valor={resumo.semClienteEncontrado} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
                <p>Cabeçalhos repetidos ignorados: {resumo.cabecalhosIgnorados}</p>
                <p>Status D desconsiderado: {resumo.statusDDesconsiderado}</p>
                <p>Status inválido: {resumo.statusInvalido}</p>
                <p>Datas inválidas: {resumo.dataInvalida}</p>
                <p>Sem número do orçamento/item: {resumo.semNumeroIt}</p>
                <p>Sem código do cliente: {resumo.semCodigoCliente}</p>
                <p>Duplicados internos: {resumo.duplicadosInternos}</p>
              </div>
            </section>

            {preview.length > 0 ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                  Prévia dos primeiros registros válidos
                </h3>

                <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Cliente</th>
                        <th className="px-4 py-3 text-left">Data emissão</th>
                        <th className="px-4 py-3 text-left">Data fechamento</th>
                        <th className="px-4 py-3 text-left">Orçamento</th>
                        <th className="px-4 py-3 text-left">Pedido venda</th>
                        <th className="px-4 py-3 text-left">Quantidade</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {preview.map((item) => (
                        <tr
                          key={`${item.codigo_cliente_loja}-${item.numero_it_completo}`}
                        >
                          <td className="px-4 py-3 text-slate-700">
                            {item.codigo_cliente_loja}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {formatarData(item.data_emissao)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {formatarData(item.data_fechamento)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.numero_orcamento}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {item.pedido_venda || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {item.quantidade_item ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {item.status_descricao}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-3 md:hidden">
                  {preview.map((item) => (
                    <div
                      key={`${item.codigo_cliente_loja}-${item.numero_it_completo}`}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        {item.codigo_cliente_loja}
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        Orçamento {item.numero_orcamento}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Pedido venda: {item.pedido_venda || '-'}
                      </p>
                      <p className="text-sm text-slate-600">
                        Emissão: {formatarData(item.data_emissao)}
                      </p>
                      <p className="text-sm text-slate-600">
                        Fechamento: {formatarData(item.data_fechamento)}
                      </p>
                      <p className="text-sm text-slate-600">
                        Quantidade: {item.quantidade_item ?? '-'}
                      </p>
                      <p className="text-sm text-slate-600">
                        Status: {item.status_descricao}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {resultado ? (
              <section className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-700">
                <h3 className="font-bold">Importação concluída</h3>
                <p className="mt-1">
                  {resultado.enviados} registros enviados para o histórico em{' '}
                  {resultado.lotes} lote(s).
                </p>
                <p className="mt-1">
                  {resultado.clientesAtivos.toLocaleString('pt-BR')} cliente(s)
                  marcado(s) como Ativo(s) por orçamento nos últimos{' '}
                  {MESES_STATUS_CLIENTE_ATIVO} meses. Os demais ficam Inativos.
                </p>
              </section>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function ResumoItem({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}
