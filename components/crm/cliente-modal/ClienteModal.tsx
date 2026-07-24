'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Cliente, Contato } from '../../../types';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import ContatosCliente from '../ContatosCliente';
import HistoricoCliente from '../HistoricoCliente';
import ClienteDados from './ClienteDados';
import ClienteModalNav, {
  ClienteModalSecao
} from './ClienteModalNav';
import ClienteObservacoes from './ClienteObservacoes';

type ClienteModalProps = {
  cliente: Cliente;
  contatos: Contato[];
  carregandoContatos: boolean;
  erroContatos?: string | null;
  historicoInicialAberto?: boolean;
  orcamentoHistoricoFoco?: string | null;
  secaoInicial?: ClienteModalSecao;
  onSecaoChange?: (secao: ClienteModalSecao) => void;
  onOrcamentoHistoricoChange?: (numeroOrcamento: string | null) => void;
  onClose: () => void;
  onAtualizarCliente: (id: string, dados: Partial<Cliente>) => Promise<Cliente>;
  onAdicionarContato: (contato: {
    cliente_id: string;
    nome: string;
    cargo?: string;
    telefone?: string;
    email?: string;
    endereco_visita?: string;
    endereco_padrao?: boolean;
  }) => Promise<Contato | null>;
  onAtualizarContato: (
    id: string,
    dados: Partial<Contato>
  ) => Promise<Contato | null>;
  onExcluirContato: (id: string) => Promise<boolean>;
};

function obterNomePrincipal(cliente: Cliente) {
  return (
    cliente.nome_fantasia ||
    cliente.empresa ||
    cliente.razao_social ||
    'Cliente'
  );
}

export default function ClienteModal({
  cliente,
  contatos,
  carregandoContatos,
  erroContatos,
  historicoInicialAberto = false,
  orcamentoHistoricoFoco = null,
  secaoInicial,
  onSecaoChange,
  onOrcamentoHistoricoChange,
  onClose,
  onAtualizarCliente,
  onAdicionarContato,
  onAtualizarContato,
  onExcluirContato
}: ClienteModalProps) {
  const [observacoes, setObservacoes] = useState(cliente.observacoes || '');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [secaoAtiva, setSecaoAtiva] = useState<ClienteModalSecao>(
    secaoInicial || (historicoInicialAberto ? 'historico' : 'dados')
  );
  const conteudoRef = useRef<HTMLDivElement>(null);
  const chaveScrollConteudo = useMemo(
    () => `cliente:${cliente.id}:secao:${secaoAtiva}`,
    [cliente.id, secaoAtiva]
  );

  useEffect(() => {
    if (!secaoInicial || secaoInicial === secaoAtiva) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSecaoAtiva(secaoInicial);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [secaoInicial, secaoAtiva]);

  useEffect(() => {
    const elemento = conteudoRef.current;

    if (!elemento || typeof window === 'undefined') {
      return;
    }

    const valorSalvo = window.sessionStorage.getItem(
      `friese-crm:scroll:${chaveScrollConteudo}`
    );
    const scrollTop = Number(valorSalvo);

    window.setTimeout(() => {
      if (Number.isFinite(scrollTop) && scrollTop > 0) {
        elemento.scrollTop = scrollTop;
      } else {
        elemento.scrollTop = 0;
      }
    }, 0);
  }, [chaveScrollConteudo]);

  const salvarScrollConteudo = () => {
    const elemento = conteudoRef.current;

    if (!elemento || typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(
      `friese-crm:scroll:${chaveScrollConteudo}`,
      String(elemento.scrollTop)
    );
  };

  const alterado = observacoes !== (cliente.observacoes || '');

  const contatoEnderecoPadrao = useMemo(
    () =>
      contatos.find(
        (contato) =>
          Boolean(contato.endereco_padrao) &&
          Boolean(contato.endereco_visita?.trim())
      ) || null,
    [contatos]
  );


  const alterarSecaoAtiva = (secao: ClienteModalSecao) => {
    setSecaoAtiva(secao);
    onSecaoChange?.(secao);
  };

  const salvar = async () => {
    setSalvando(true);
    setMensagem(null);

    try {
      await onAtualizarCliente(cliente.id, {
        observacoes
      });

      setMensagem('AlteraÃ§Ãµes salvas com sucesso.');
    } catch (error) {
      const erro =
        error instanceof Error
          ? error.message
          : 'NÃ£o foi possÃ­vel salvar as alteraÃ§Ãµes.';
      setMensagem(erro);
    } finally {
      setSalvando(false);
    }
  };

  const renderizarConteudo = () => {
    if (secaoAtiva === 'dados') {
      return (
        <ClienteDados
          cliente={cliente}
          status={cliente.status || 'Inativo'}
          contatoEnderecoPadrao={contatoEnderecoPadrao}
        />
      );
    }

    if (secaoAtiva === 'contatos') {
      return (
        <ContatosCliente
          clienteId={cliente.id}
          contatos={contatos}
          carregando={carregandoContatos}
          erro={erroContatos}
          onAdicionar={onAdicionarContato}
          onAtualizar={onAtualizarContato}
          onExcluir={onExcluirContato}
        />
      );
    }

    if (secaoAtiva === 'historico') {
      return (
        <HistoricoCliente
          clienteId={cliente.id}
          aberto
          clienteSegmento={cliente.segmento}
          orcamentoFocoInicial={orcamentoHistoricoFoco}
          onOrcamentoDetalheChange={onOrcamentoHistoricoChange}
        />
      );
    }


    return (
      <ClienteObservacoes
        observacoes={observacoes}
        onChange={setObservacoes}
      />
    );
  };

  return (
    <Modal
      title={obterNomePrincipal(cliente)}
      onClose={onClose}
      scrollKey={`cliente:${cliente.id}:modal`}
      bloquearFechamento={alterado && !salvando}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            {mensagem
              ? mensagem
              : alterado
                ? 'Existem alteraÃ§Ãµes nÃ£o salvas.'
                : 'Dados atualizados.'}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Fechar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={salvar}
              disabled={!alterado}
              loading={salvando}
              loadingText="Salvando..."
            >
              Salvar alteraÃ§Ãµes
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid min-h-[520px] gap-4 lg:grid-cols-[220px_1fr]">
        <ClienteModalNav secaoAtiva={secaoAtiva} onChange={alterarSecaoAtiva} />

        <div
          ref={conteudoRef}
          className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 lg:max-h-[68vh] lg:overflow-y-auto"
          onScroll={salvarScrollConteudo}
        >
          {renderizarConteudo()}
        </div>
      </div>
    </Modal>
  );
}














