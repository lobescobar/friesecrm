'use client';

import { useMemo, useState } from 'react';
import { Cliente, Contato } from '../../types';
import { STATUS_OPTIONS } from '../../utils/constants';
import {
  formatarCnpj,
  montarEnderecoCompleto,
  montarLinkWhatsapp
} from '../../utils/formatters';
import BadgeStatus from '../ui/BadgeStatus';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ContatosCliente from './ContatosCliente';
import HistoricoCliente from './HistoricoCliente';

type ClienteModalProps = {
  cliente: Cliente;
  contatos: Contato[];
  carregandoContatos: boolean;
  erroContatos?: string | null;
  onClose: () => void;
  onAtualizarCliente: (id: string, dados: Partial<Cliente>) => Promise<Cliente>;
  onAdicionarContato: (contato: {
    cliente_id: string;
    nome: string;
    cargo?: string;
    telefone?: string;
    email?: string;
  }) => Promise<Contato | null>;
  onAtualizarContato: (id: string, dados: Partial<Contato>) => Promise<Contato | null>;
  onExcluirContato: (id: string) => Promise<boolean>;
};

export default function ClienteModal({
  cliente,
  contatos,
  carregandoContatos,
  erroContatos,
  onClose,
  onAtualizarCliente,
  onAdicionarContato,
  onAtualizarContato,
  onExcluirContato
}: ClienteModalProps) {
  const [observacoes, setObservacoes] = useState(cliente.observacoes || '');
  const [status, setStatus] = useState(cliente.status || 'Novo');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [historicoAberto, setHistoricoAberto] = useState(false);

  const alterado =
    observacoes !== (cliente.observacoes || '') || status !== cliente.status;

  const whatsappEmpresa = useMemo(
    () => montarLinkWhatsapp(cliente.telefone),
    [cliente.telefone]
  );

  const enderecoCompleto = montarEnderecoCompleto({
    endereco: cliente.endereco,
    cidade: cliente.cidade,
    estado: cliente.estado
  });

  const salvar = async () => {
    setSalvando(true);
    setMensagem(null);

    try {
      await onAtualizarCliente(cliente.id, {
        observacoes,
        status
      });

      setMensagem('Alterações salvas com sucesso.');
    } catch (error) {
      const erro =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar as alterações.';
      setMensagem(erro);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      title={cliente.empresa}
      subtitle={[cliente.codigo_cliente ? `#${cliente.codigo_cliente}` : '', enderecoCompleto]
        .filter(Boolean)
        .join(' • ')}
      onClose={onClose}
      bloquearFechamento={alterado && !salvando}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            {mensagem ? mensagem : alterado ? 'Existem alterações não salvas.' : 'Dados atualizados.'}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Fechar
            </Button>
            <Button type="button" onClick={salvar} disabled={!alterado || salvando}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <BadgeStatus status={status} />
              {cliente.segmento ? (
                <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                  {cliente.segmento}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">
                  CNPJ
                </label>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {formatarCnpj(cliente.cnpj)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <h4 className="mb-4 border-b pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              Dados cadastrais
            </h4>

            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-400">
                  Razão Social
                </dt>
                <dd className="text-sm font-medium text-slate-800">
                  {cliente.razao_social || '-'}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-400">
                  Nome Fantasia
                </dt>
                <dd className="text-sm font-medium text-slate-800">
                  {cliente.nome_fantasia || '-'}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-400">
                  Endereço
                </dt>
                <dd className="text-sm font-medium text-slate-800">
                  {enderecoCompleto || '-'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {whatsappEmpresa ? (
              <a
                href={whatsappEmpresa}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
              >
                WhatsApp Empresa
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="rounded-2xl bg-slate-200 py-3 text-sm font-bold text-slate-500"
              >
                Sem telefone da empresa
              </button>
            )}

            {enderecoCompleto ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  enderecoCompleto
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Ver no Mapa
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="rounded-2xl bg-slate-200 py-3 text-sm font-bold text-slate-500"
              >
                Sem endereço
              </button>
            )}

            <Button
              type="button"
              variant={historicoAberto ? 'primary' : 'secondary'}
              className="rounded-2xl py-3"
              onClick={() => setHistoricoAberto((atual) => !atual)}
            >
              Histórico do Cliente
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="border-b pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              Observações / histórico
            </h4>

            <textarea
              className="h-36 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="Anotações sobre visitas, negociação, pedidos ou próximos passos..."
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
            />
          </div>
        </section>

        <ContatosCliente
          clienteId={cliente.id}
          contatos={contatos}
          carregando={carregandoContatos}
          erro={erroContatos}
          onAdicionar={onAdicionarContato}
          onAtualizar={onAtualizarContato}
          onExcluir={onExcluirContato}
        />

        <div className="lg:col-span-2">
          <HistoricoCliente clienteId={cliente.id} aberto={historicoAberto} />
        </div>
      </div>
    </Modal>
  );
}
