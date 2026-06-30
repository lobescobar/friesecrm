'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { SEGMENTOS_CLIENTES } from '../../../utils/constants';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';

type RegrasCancelamentoOrcamentosProps = {
  segmentosDisponiveis?: string[];
};

type EmailCancelamento = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  padrao: boolean;
  created_at?: string;
  updated_at?: string;
};

type RegraCancelamentoSegmento = {
  id: string;
  segmento: string;
  segmento_normalizado: string;
  email_cancelamento_id: string;
};

type NovoEmail = {
  nome: string;
  email: string;
};

const novoEmailInicial: NovoEmail = {
  nome: '',
  email: ''
};

function normalizarTexto(valor?: string | null) {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizarEmail(valor: string) {
  return valor.trim().toLowerCase();
}

function normalizarSegmento(valor: string) {
  return normalizarTexto(valor);
}

function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

function formatarSegmentos(segmentos: string[]) {
  if (!segmentos.length) {
    return 'Nenhum segmento';
  }

  return segmentos.join(', ');
}

export default function RegrasCancelamentoOrcamentos({
  segmentosDisponiveis = []
}: RegrasCancelamentoOrcamentosProps) {
  const [emails, setEmails] = useState<EmailCancelamento[]>([]);
  const [regras, setRegras] = useState<RegraCancelamentoSegmento[]>([]);
  const [novoEmail, setNovoEmail] = useState<NovoEmail>(novoEmailInicial);
  const [editando, setEditando] = useState<EmailCancelamento | null>(null);
  const [criando, setCriando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const segmentos = useMemo(() => {
    const todosSegmentos = [
      ...SEGMENTOS_CLIENTES,
      ...segmentosDisponiveis,
      'Corrugados'
    ]
      .map((segmento) => segmento.trim())
      .filter(Boolean);

    const mapa = new Map<string, string>();

    todosSegmentos.forEach((segmento) => {
      const chave = normalizarSegmento(segmento);

      if (!mapa.has(chave)) {
        mapa.set(chave, segmento);
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );
  }, [segmentosDisponiveis]);

  async function carregarRegras() {
    setLoading(true);
    setMensagem(null);

    const [
      { data: emailsData, error: emailsError },
      { data: regrasData, error: regrasError }
    ] = await Promise.all([
      supabase
        .from('emails_cancelamento_orcamentos')
        .select('*')
        .order('email', { ascending: true }),
      supabase
        .from('regras_cancelamento_segmentos')
        .select('*')
        .order('segmento', { ascending: true })
    ]);

    if (emailsError || regrasError) {
      setMensagem(
        `Erro ao carregar regras de cancelamento: ${
          emailsError?.message || regrasError?.message || 'erro desconhecido'
        }`
      );
      setEmails([]);
      setRegras([]);
      setLoading(false);
      return;
    }

    setEmails((emailsData || []) as EmailCancelamento[]);
    setRegras((regrasData || []) as RegraCancelamentoSegmento[]);
    setLoading(false);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarRegras();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function obterRegraDoSegmento(segmento: string) {
    const segmentoNormalizado = normalizarSegmento(segmento);

    return regras.find(
      (regra) => regra.segmento_normalizado === segmentoNormalizado
    );
  }

  function obterEmailAtuanteDoSegmento(segmento: string) {
    const regra = obterRegraDoSegmento(segmento);

    return regra?.email_cancelamento_id || null;
  }

  function segmentoEstaNoEmail(emailId: string, segmento: string) {
    return obterEmailAtuanteDoSegmento(segmento) === emailId;
  }

  function segmentosDoEmail(emailId: string) {
    return regras
      .filter((regra) => regra.email_cancelamento_id === emailId)
      .map((regra) => regra.segmento)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  async function cadastrarEmail() {
    const nome = novoEmail.nome.trim();
    const email = normalizarEmail(novoEmail.email);

    if (!nome) {
      setMensagem('Informe o nome do destino.');
      return;
    }

    if (!emailValido(email)) {
      setMensagem('Informe um e-mail válido.');
      return;
    }

    setSalvando(true);
    setMensagem('Cadastrando e-mail...');

    const deveSerPadrao = emails.length === 0;

    const { error } = await supabase
      .from('emails_cancelamento_orcamentos')
      .insert({
        nome,
        email,
        ativo: true,
        padrao: deveSerPadrao
      });

    if (error) {
      setMensagem(`Erro ao cadastrar e-mail: ${error.message}`);
      setSalvando(false);
      return;
    }

    setMensagem('E-mail cadastrado com sucesso.');
    setNovoEmail(novoEmailInicial);
    setCriando(false);
    setSalvando(false);
    carregarRegras();
  }

  async function salvarEdicao() {
    if (!editando) return;

    const nome = editando.nome.trim();
    const email = normalizarEmail(editando.email);

    if (!nome) {
      setMensagem('Informe o nome do destino.');
      return;
    }

    if (!emailValido(email)) {
      setMensagem('Informe um e-mail válido.');
      return;
    }

    setSalvando(true);
    setMensagem('Salvando alterações...');

    const { error } = await supabase
      .from('emails_cancelamento_orcamentos')
      .update({
        nome,
        email,
        ativo: true
      })
      .eq('id', editando.id);

    if (error) {
      setMensagem(`Erro ao salvar e-mail: ${error.message}`);
      setSalvando(false);
      return;
    }

    setMensagem('E-mail atualizado com sucesso.');
    setEditando(null);
    setSalvando(false);
    carregarRegras();
  }

  async function excluirEmail(email: EmailCancelamento) {
    const segmentosVinculados = segmentosDoEmail(email.id);

    const mensagemConfirmacao = [
      `Excluir o cadastro ${email.email}?`,
      '',
      'Esta ação remove o e-mail da configuração e desvincula seus segmentos.',
      segmentosVinculados.length
        ? `Segmentos que serão desvinculados: ${segmentosVinculados.join(', ')}.`
        : 'Este e-mail não possui segmentos vinculados.',
      '',
      'Esta ação não exclui usuários do CRM e não altera orçamentos já importados.'
    ].join('\n');

    const confirmou = window.confirm(mensagemConfirmacao);

    if (!confirmou) return;

    setSalvando(true);
    setMensagem('Excluindo cadastro...');

    const { error: erroRegras } = await supabase
      .from('regras_cancelamento_segmentos')
      .delete()
      .eq('email_cancelamento_id', email.id);

    if (erroRegras) {
      setMensagem(`Erro ao remover segmentos vinculados: ${erroRegras.message}`);
      setSalvando(false);
      return;
    }

    const { error } = await supabase
      .from('emails_cancelamento_orcamentos')
      .delete()
      .eq('id', email.id);

    if (error) {
      setMensagem(`Erro ao excluir e-mail: ${error.message}`);
      setSalvando(false);
      return;
    }

    setMensagem(`Cadastro ${email.email} excluído com sucesso.`);
    setEditando(null);
    setSalvando(false);
    carregarRegras();
  }

  async function alternarSegmento(email: EmailCancelamento, segmento: string) {
    const segmentoNormalizado = normalizarSegmento(segmento);
    const regraAtual = obterRegraDoSegmento(segmento);
    const emailAtualId = obterEmailAtuanteDoSegmento(segmento);
    const jaEstaNesteEmail = emailAtualId === email.id;

    setSalvando(true);

    if (jaEstaNesteEmail) {
      const { error } = await supabase
        .from('regras_cancelamento_segmentos')
        .delete()
        .eq('segmento_normalizado', segmentoNormalizado);

      if (error) {
        setMensagem(`Erro ao remover segmento: ${error.message}`);
        setSalvando(false);
        return;
      }

      setMensagem(`Segmento ${segmento} removido de ${email.email}.`);
      setSalvando(false);
      carregarRegras();
      return;
    }

    const { error } = await supabase
      .from('regras_cancelamento_segmentos')
      .upsert(
        {
          id: regraAtual?.id,
          segmento,
          segmento_normalizado: segmentoNormalizado,
          email_cancelamento_id: email.id
        },
        {
          onConflict: 'segmento_normalizado'
        }
      );

    if (error) {
      setMensagem(`Erro ao vincular segmento: ${error.message}`);
      setSalvando(false);
      return;
    }

    setMensagem(`Segmento ${segmento} vinculado a ${email.email}.`);
    setSalvando(false);
    carregarRegras();
  }

  if (loading) {
    return (
      <section className="mt-4 rounded-2xl border bg-white p-4 text-sm text-slate-500">
        Carregando regras de cancelamento...
      </section>
    );
  }

  return (
    <>
      <section className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold">
              Regras de cancelamento de orçamentos
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={carregarRegras}
              disabled={salvando}
            >
              Atualizar
            </Button>

            <Button
              type="button"
              onClick={() => setCriando((atual) => !atual)}
              disabled={salvando}
            >
              {criando ? 'Cancelar cadastro' : 'Cadastrar e-mail'}
            </Button>
          </div>
        </div>

        {mensagem ? (
          <div className="mx-6 mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {mensagem}
          </div>
        ) : null}

        {criando ? (
          <div className="grid gap-4 border-b border-slate-200 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <label className="block">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Nome do destino
              </span>
              <input
                type="text"
                value={novoEmail.nome}
                onChange={(event) =>
                  setNovoEmail({ ...novoEmail, nome: event.target.value })
                }
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Ex.: Vendas Corrugados"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                E-mail
              </span>
              <input
                type="email"
                value={novoEmail.email}
                onChange={(event) =>
                  setNovoEmail({ ...novoEmail, email: event.target.value })
                }
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="exemplo@friese.com.br"
              />
            </label>

            <Button type="button" onClick={cadastrarEmail} disabled={salvando}>
              Salvar e-mail
            </Button>
          </div>
        ) : null}

        {emails.length === 0 ? (
          <div className="m-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            Nenhum e-mail cadastrado.
          </div>
        ) : null}

        {emails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">E-mail</th>
                  <th className="px-6 py-3 text-left font-semibold">Destino</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Segmentos
                  </th>
                  <th className="px-6 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>

              <tbody>
                {emails.map((email) => {
                  const segmentosAtendidos = segmentosDoEmail(email.id);

                  return (
                    <tr
                      key={email.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {email.email}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{email.nome}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatarSegmentos(segmentosAtendidos)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setEditando(email);
                            setMensagem(null);
                          }}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {editando ? (
        <Modal
          title={`Editar ${editando.email}`}
          subtitle="Cadastro de e-mail e segmentos atendidos."
          onClose={() => setEditando(null)}
          scrollKey={`regras-cancelamento:${editando.id}`}
          footer={
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="danger"
                onClick={() => excluirEmail(editando)}
                disabled={salvando}
              >
                Excluir cadastro
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditando(null)}
                disabled={salvando}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={salvarEdicao}
                disabled={salvando}
              >
                Salvar alterações
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  Nome do destino
                </span>
                <input
                  type="text"
                  value={editando.nome}
                  onChange={(event) =>
                    setEditando({ ...editando, nome: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  E-mail
                </span>
                <input
                  type="email"
                  value={editando.email}
                  onChange={(event) =>
                    setEditando({ ...editando, email: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                />
              </label>
            </div>

            <fieldset>
              <legend className="text-[10px] font-bold uppercase text-slate-400">
                Segmentos permitidos
              </legend>

              <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white p-3">
                {segmentos.map((segmento) => {
                  const marcado = segmentoEstaNoEmail(editando.id, segmento);

                  return (
                    <label
                      key={`${editando.id}:${segmento}`}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        disabled={salvando}
                        onChange={() => alternarSegmento(editando, segmento)}
                      />
                      <span>{segmento}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
