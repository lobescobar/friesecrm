'use client';

import { ChangeEvent, useRef, useState } from 'react';
import {
  importarHistoricoOrcamentos,
  processarPlanilhaOrcamentos
} from '../../lib/importacaoOrcamentos';
import {
  HistoricoImportacao,
  ResultadoImportacao,
  ResumoOrcamentos
} from '../../types/importacaoOrcamentos';
import {
  MESES_HISTORICO_ORCAMENTOS,
  MESES_STATUS_CLIENTE_ATIVO
} from '../../utils/constants';
import { resumoOrcamentosInicial } from '../../utils/importacaoOrcamentos';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ImportarOrcamentosColunas from './importar-orcamentos/ImportarOrcamentosColunas';
import ImportarOrcamentosMensagens from './importar-orcamentos/ImportarOrcamentosMensagens';
import ImportarOrcamentosPrevia from './importar-orcamentos/ImportarOrcamentosPrevia';
import ImportarOrcamentosResultado from './importar-orcamentos/ImportarOrcamentosResultado';
import ImportarOrcamentosResumo from './importar-orcamentos/ImportarOrcamentosResumo';
import ImportarOrcamentosSelecionarPlanilha from './importar-orcamentos/ImportarOrcamentosSelecionarPlanilha';

type ImportarOrcamentosProps = {
  onSucesso?: () => void;
};

export default function ImportarOrcamentos({
  onSucesso
}: ImportarOrcamentosProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [aberto, setAberto] = useState(false);
  const [arquivoNome, setArquivoNome] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [resumo, setResumo] = useState<ResumoOrcamentos>(
    resumoOrcamentosInicial
  );
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
    setResumo(resumoOrcamentosInicial);
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
      const processamento = await processarPlanilhaOrcamentos(arquivo);

      setHeaders(processamento.headers);
      setResumo(processamento.resumo);
      setRegistros(processamento.registros);
      setPreview(processamento.preview);
      setMensagem(
        processamento.registros.length > 0
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
      setMensagem('Histórico importado. Recalculando status dos clientes...');

      const novoResultado = await importarHistoricoOrcamentos({
        registros,
        arquivoNome,
        resumo
      });

      setResultado(novoResultado);

      setMensagem(
        `Histórico de orçamentos importado com sucesso. Status recalculado: ${novoResultado.clientesAtivos.toLocaleString(
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
              <div
                className="text-sm text-slate-500"
                role="status"
                aria-live="polite"
              >
                {arquivoNome
                  ? `Arquivo: ${arquivoNome}`
                  : 'Nenhum arquivo selecionado.'}
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
            <ImportarOrcamentosSelecionarPlanilha
              inputRef={inputRef}
              processando={processando}
              importando={importando}
              onSelecionarArquivo={selecionarArquivo}
              onLimpar={limparEstado}
            />

            <ImportarOrcamentosMensagens
              processando={processando}
              erro={erro}
              mensagem={mensagem}
            />

            <ImportarOrcamentosColunas headers={headers} />

            <ImportarOrcamentosResumo resumo={resumo} />

            <ImportarOrcamentosPrevia preview={preview} />

            <ImportarOrcamentosResultado resultado={resultado} />
          </div>
        </Modal>
      ) : null}
    </>
  );
}
