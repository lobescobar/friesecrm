'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { SEGMENTOS_CLIENTES } from '../../../utils/constants';
import Button from '../../ui/Button';

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

const EMAIL_PADRAO_INICIAL = 'vendas.ai@friese.com.br';
const EMAIL_CORRUGADOS_INICIAL = 'vendas.cr@friese.com.br';

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

function CardExplicacao() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Regra de funcionamento</p>
      <p className="mt-1">
        Cada segmento pode atuar em apenas um e-mail. Cada e-mail pode atuar em
        vários segmentos. Ao marcar um segmento em outro e-mail, o sistema
        transfere automaticamente esse segmento para o novo destino.
      </p>
      <p className="mt-2 text-xs font-medium">
        Se um cadastro for excluído, os segmentos vinculados a ele deixam de
        atuar naquele e-mail. Se houver erro de consulta no fluxo de
        cancelamento, o CRM mantém o fallback seguro.
      </p>
    </div>
  );
}

export default function RegrasCancelamentoOrcamentos({
  segmentosDisponiveis = []
}: RegrasCancelamentoOrcamentosProps) {
  const [emails, setEmails] = useState<EmailCancelamento[]>([]);
  const [regras, setRegras] = useState<RegraCancelamentoSegmento[]>([]);
  const [novoEmail, setNovoEmail] = useState<NovoEmail>(novoEmailInicial);
  const [editando, setEditando] = useState<EmailCancelamento | null>(null);
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
    const segmentosVinculados = regras
      .filter((regra) => regra.email_cancelamento_id === email.id)
      .map((regra) => regra.segmento)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const mensagemConfirmacao = [
      `Excluir o cadastro ${email.email}?`,
      '',
      'Esta ação remove o e-mail da tela de regras e cancela sua atuação nos segmentos vinculados.',
      segmentosVinculados.length
        ? `Segmentos que serão desvinculados: ${segmentosVinculados.join(', ')}.`
        : 'Este e-mail não possui segmentos vinculados no momento.',
      '',
      'Esta ação não exclui usuários do CRM e não altera orçamentos já importados.'
    ].join('\n');

    const confirmou = window.confirm(mensagemConfirmacao);

    if (!confirmou) return;

    setSalvando(true);
    setMensagem('Excluindo cadastro e removendo vínculos de segmentos...');

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
    <section className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Administração
          </p>
          <h2 className="text-lg font-bold text-slate-900">
            Regras de cancelamento de orçamentos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre e-mails e selecione em quais segmentos cada e-mail atua.
          </p>
        </div>

        <Button type="button" variant="secondary" onClick={carregarRegras}>
          Atualizar
        </Button>
      </div>

      <div className="space-y-5 p-6">
        <CardExplicacao />

        {mensagem ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {mensagem}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-slate-900">Cadastrar novo e-mail</h3>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
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
              Cadastrar e-mail
            </Button>
          </div>
        </div>

        {emails.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            Nenhum e-mail cadastrado. Execute o SQL da Etapa 14Y para criar os
            e-mails iniciais ou cadastre manualmente nesta tela.
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {emails.map((email) => (
            <article
              key={email.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="break-all text-base font-extrabold text-slate-900">
                    {email.email}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{email.nome}</p>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditando(email)}
                    disabled={salvando}
                  >
                    Editar
                  </Button>
                </div>
              </div>

              {editando?.id === email.id ? (
                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <h4 className="font-bold text-slate-900">Editar e-mail</h4>

                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
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

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={salvarEdicao}
                      disabled={salvando}
                    >
                      Salvar e-mail
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditando(null)}
                    >
                      Cancelar
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => excluirEmail(email)}
                      disabled={salvando}
                    >
                      Excluir cadastro
                    </Button>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Excluir o cadastro remove este e-mail da configuração e
                    desvincula todos os segmentos que atuavam nele.
                  </p>
                </div>
              ) : null}

              <fieldset className="mt-4">
                <legend className="text-[11px] font-bold uppercase tracking-wide text-[#8fa2c6]">
                  Segmentos permitidos
                </legend>

                <div className="mt-2 max-h-48 overflow-y-auto rounded-[18px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div className="space-y-3">
                    {segmentos.map((segmento) => {
                      const marcado = segmentoEstaNoEmail(email.id, segmento);

                      return (
                        <label
                          key={`${email.id}:${segmento}`}
                          className="flex cursor-pointer items-start gap-3 text-base text-slate-900"
                        >
                          <input
                            type="checkbox"
                            checked={marcado}
                            disabled={salvando}
                            onChange={() => alternarSegmento(email, segmento)}
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                          />

                          <span className="flex-1">{segmento}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </fieldset>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          Configuração inicial recomendada:{' '}
          <strong>{EMAIL_CORRUGADOS_INICIAL}</strong> para Corrugados e{' '}
          <strong>{EMAIL_PADRAO_INICIAL}</strong> para os demais segmentos.
        </div>
      </div>
    </section>
  );
}