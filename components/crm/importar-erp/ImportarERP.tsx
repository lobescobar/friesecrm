'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { registrarAuditoriaImportacao } from '../../../lib/auditoria';
import { supabase } from '../../../lib/supabase';
import {
  buscarClientesExistentesERP,
  buscarCodigosExistentesERP,
  preservarDadosManuaisClienteERP
} from '../../../lib/importacaoERPClientes';
import {
  lotes,
  obterColunasReconhecidasERP,
  processarArquivoERP,
  resumoImportacaoERPInicial
} from '../../../utils/importacaoERP';
import {
  ClienteImportacao,
  ResultadoImportacaoERP,
  ResumoImportacaoERP
} from '../../../types/importacaoERP';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import ImportarERPArquivoInfo from './ImportarERPArquivoInfo';
import ImportarERPColunasReconhecidas from './ImportarERPColunasReconhecidas';
import ImportarERPPrevia from './ImportarERPPrevia';
import ImportarERPResultado from './ImportarERPResultado';
import ImportarERPResumo from './ImportarERPResumo';
import ImportarERPSegmentosOficiais from './ImportarERPSegmentosOficiais';

type ImportarERPProps = {
  onSucesso?: () => void;
};

export default function ImportarERP({ onSucesso }: ImportarERPProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [arquivoNome, setArquivoNome] = useState('');
  const [clientesParaImportar, setClientesParaImportar] = useState<ClienteImportacao[]>([]);
  const [headers, setHeaders] = useState<unknown[]>([]);
  const [resumo, setResumo] = useState<ResumoImportacaoERP>(
    resumoImportacaoERPInicial
  );
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState('');
  const [resultado, setResultado] = useState<ResultadoImportacaoERP | null>(null);

  const colunasReconhecidas = useMemo(
    () => obterColunasReconhecidasERP(headers),
    [headers]
  );

  const resetar = () => {
    setArquivoNome('');
    setClientesParaImportar([]);
    setHeaders([]);
    setResumo(resumoImportacaoERPInicial);
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
      setProgresso('Convertendo dados...');

      const arquivoProcessado = await processarArquivoERP(arquivo);

      setProgresso('Verificando clientes jÃ¡ cadastrados...');

      const codigosExistentes = await buscarCodigosExistentesERP(
        arquivoProcessado.clientes.map((cliente) => cliente.codigo_cliente)
      );

      const novoResumo: ResumoImportacaoERP = {
        ...arquivoProcessado.resumo,
        inseridosPrevistos: 0,
        atualizadosPrevistos: 0
      };

      arquivoProcessado.clientes.forEach((cliente) => {
        if (codigosExistentes.has(cliente.codigo_cliente)) {
          novoResumo.atualizadosPrevistos++;
        } else {
          novoResumo.inseridosPrevistos++;
        }
      });

      setHeaders(arquivoProcessado.headers);
      setClientesParaImportar(arquivoProcessado.clientes);
      setResumo(novoResumo);
      setMensagem(
        'Planilha lida com sucesso. Revise a prÃ©via e confirme para gravar no banco.'
      );
    } catch (error) {
      console.error('Erro ao preparar importaÃ§Ã£o:', error);
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
      const clientesExistentes = await buscarClientesExistentesERP(
        clientesParaImportar.map((cliente) => cliente.codigo_cliente)
      );

      const codigosExistentes = new Set(clientesExistentes.keys());

      const clientesNormalizados = clientesParaImportar.map((cliente) =>
        preservarDadosManuaisClienteERP(
          cliente,
          clientesExistentes.get(cliente.codigo_cliente)
        )
      );

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

      const novoResultado: ResultadoImportacaoERP = {
        inseridos,
        atualizados,
        ignoradosComErro,
        primeiraMensagemErro
      };

      await registrarAuditoriaImportacao({
        tabela: 'clientes',
        acao: 'importacao_erp',
        arquivoNome,
        resultado: {
          ...novoResultado,
          validos: clientesNormalizados.length,
          previstos: {
            inseridos: resumo.inseridosPrevistos,
            atualizados: resumo.atualizadosPrevistos
          }
        }
      });

      setResultado(novoResultado);
      setMensagem('ImportaÃ§Ã£o concluÃ­da com sucesso.');
      onSucesso?.();
    } catch (error) {
      console.error('Erro na importaÃ§Ã£o:', error);
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro inesperado durante a importaÃ§Ã£o.'
      );
    } finally {
      setProcessando(false);
      setProgresso('');
    }
  }

  return (
    <>
      <Button type="button" onClick={abrir} aria-label="Importar planilha ERP">
        <span aria-hidden="true">ðŸ“¥</span>
        Importar ERP
      </Button>

      {aberto ? (
        <Modal
          title="ImportaÃ§Ã£o ERP"
          subtitle="Fluxo guiado para revisar a planilha antes de gravar no Supabase."
          onClose={fechar}
          bloquearFechamento={processando}
          footer={
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div
                role={erro ? 'alert' : 'status'}
                aria-live="polite"
                className="text-sm text-slate-500"
              >
                {processando
                  ? progresso || 'Processando...'
                  : mensagem || erro || 'Selecione uma planilha para comeÃ§ar.'}
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
                  loading={processando}
                  loadingText="Processando..."
                >
                  Confirmar importaÃ§Ã£o
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
            aria-label="Selecionar arquivo de importaÃ§Ã£o ERP"
          />

          <div className="space-y-5">
            <ImportarERPArquivoInfo arquivoNome={arquivoNome} />
            <ImportarERPSegmentosOficiais />

            {erro ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {erro}
              </div>
            ) : null}

            <ImportarERPColunasReconhecidas colunas={colunasReconhecidas} />

            {clientesParaImportar.length ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <ImportarERPResumo resumo={resumo} />
                <ImportarERPPrevia clientes={clientesParaImportar} />
              </div>
            ) : null}

            <ImportarERPResultado resultado={resultado} />
          </div>
        </Modal>
      ) : null}
    </>
  );
}

















