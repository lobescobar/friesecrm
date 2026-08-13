'use client';

import { useId, useState } from 'react';
import { Contato } from '../../../types';
import { emailValido, telefoneValido } from '../../../utils/validators';
import { formatarTelefone, montarLinkWhatsapp } from '../../../utils/formatters';
import Button from '../../ui/Button';

type FormContato = {
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
  endereco_visita: string;
};

type ContatosClienteProps = {
  clienteId: string;
  contatos: Contato[];
  carregando: boolean;
  erro?: string | null;
  onAdicionar: (contato: {
    cliente_id: string;
    nome: string;
    cargo?: string;
    telefone?: string;
    email?: string;
    endereco_visita?: string;
    endereco_padrao?: boolean;
  }) => Promise<Contato | null>;
  onAtualizar: (id: string, dados: Partial<Contato>) => Promise<Contato | null>;
  onExcluir: (id: string) => Promise<boolean>;
};

const formularioInicial: FormContato = {
  nome: '',
  cargo: '',
  telefone: '',
  email: '',
  endereco_visita: ''
};

function mensagemEhErro(mensagem?: string | null, erro?: string | null) {
  const texto = erro || mensagem || '';

  return (
    Boolean(erro) ||
    texto.startsWith('Informe') ||
    texto.startsWith('Limite') ||
    texto.startsWith('Não foi possível')
  );
}

export default function ContatosCliente({
  clienteId,
  contatos,
  carregando,
  erro,
  onAdicionar,
  onAtualizar,
  onExcluir
}: ContatosClienteProps) {
  const [novoContato, setNovoContato] = useState<FormContato>(formularioInicial);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<FormContato>(formularioInicial);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const tituloId = useId();

  const validar = (contato: FormContato) => {
    if (!contato.nome.trim()) return 'Informe o nome do contato.';
    if (!telefoneValido(contato.telefone)) return 'Informe um telefone válido.';
    if (!emailValido(contato.email)) return 'Informe um e-mail válido.';
    return '';
  };

  const adicionar = async () => {
    const erroValidacao = validar(novoContato);
    if (erroValidacao) {
      setMensagem(erroValidacao);
      return;
    }

    if (contatos.length >= 3) {
      setMensagem('Limite de 3 contatos por cliente atingido.');
      return;
    }

    setSalvando(true);
    setMensagem(null);

    const contato = await onAdicionar({
      cliente_id: clienteId,
      nome: novoContato.nome.trim(),
      cargo: novoContato.cargo.trim() || undefined,
      telefone: novoContato.telefone.trim() || undefined,
      email: novoContato.email.trim() || undefined,
      endereco_visita: novoContato.endereco_visita.trim() || undefined,
      endereco_padrao:
        contatos.length === 0 && Boolean(novoContato.endereco_visita.trim())
          ? true
          : undefined
    });

    setSalvando(false);

    if (contato) {
      setNovoContato(formularioInicial);
      setMensagem('Contato adicionado com sucesso.');
    } else {
      setMensagem('Não foi possível adicionar o contato.');
    }
  };

  const iniciarEdicao = (contato: Contato) => {
    setEditandoId(contato.id);
    setEdicao({
      nome: contato.nome || '',
      cargo: contato.cargo || '',
      telefone: contato.telefone || '',
      email: contato.email || '',
      endereco_visita: contato.endereco_visita || ''
    });
    setMensagem(null);
  };

  const salvarEdicao = async (id: string) => {
    const erroValidacao = validar(edicao);
    if (erroValidacao) {
      setMensagem(erroValidacao);
      return;
    }

    setSalvando(true);
    setMensagem(null);

    const contato = await onAtualizar(id, {
      nome: edicao.nome.trim(),
      cargo: edicao.cargo.trim() || null,
      telefone: edicao.telefone.trim() || null,
      email: edicao.email.trim() || null,
      endereco_visita: edicao.endereco_visita.trim() || null
    });

    setSalvando(false);

    if (contato) {
      setEditandoId(null);
      setMensagem('Contato atualizado com sucesso.');
    } else {
      setMensagem('Não foi possível atualizar o contato.');
    }
  };

  const excluir = async (id: string) => {
    const confirmou = window.confirm('Deseja excluir este contato?');
    if (!confirmou) return;

    const sucesso = await onExcluir(id);
    setMensagem(
      sucesso
        ? 'Contato excluído com sucesso.'
        : 'Não foi possível excluir o contato.'
    );
  };

  const definirEnderecoPadrao = async (contatoSelecionado: Contato) => {
    if (!contatoSelecionado.endereco_visita?.trim()) {
      setMensagem('Informe um endereço de visita antes de marcar como padrão.');
      return;
    }

    setSalvando(true);
    setMensagem(null);

    try {
      const contatosParaDesmarcar = contatos.filter(
        (contato) => contato.id !== contatoSelecionado.id && contato.endereco_padrao
      );

      for (const contato of contatosParaDesmarcar) {
        const atualizado = await onAtualizar(contato.id, { endereco_padrao: false });

        if (!atualizado) {
          throw new Error('Não foi possível desmarcar o endereço padrão anterior.');
        }
      }

      const contatoAtualizado = await onAtualizar(contatoSelecionado.id, {
        endereco_padrao: true
      });

      if (!contatoAtualizado) {
        throw new Error('Não foi possível marcar o endereço como padrão.');
      }

      setMensagem('Endereço padrão atualizado com sucesso.');
    } catch (error) {
      const erro =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o endereço padrão.';
      setMensagem(erro);
    } finally {
      setSalvando(false);
    }
  };

  const textoMensagem = mensagem || erro;
  const mensagemErro = mensagemEhErro(mensagem, erro);
  const contatosOrdenados = [...contatos].sort((a, b) => {
    if (a.endereco_padrao === b.endereco_padrao) {
      return a.nome.localeCompare(b.nome, 'pt-BR');
    }

    return a.endereco_padrao ? -1 : 1;
  });

  return (
    <section aria-labelledby={tituloId} className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h4
          id={tituloId}
          className="text-xs font-bold uppercase tracking-widest text-slate-400"
        >
          Contatos da Empresa
        </h4>

        <span
          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold"
          aria-label={`${contatos.length} de 3 contatos cadastrados`}
        >
          {contatos.length}/3 cadastrados
        </span>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Nome
            </span>
            <input
              type="text"
              value={novoContato.nome}
              onChange={(event) =>
                setNovoContato({ ...novoContato, nome: event.target.value })
              }
              className="w-full rounded-xl border px-3 py-2 text-sm"
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Cargo
            </span>
            <input
              type="text"
              value={novoContato.cargo}
              onChange={(event) =>
                setNovoContato({ ...novoContato, cargo: event.target.value })
              }
              className="w-full rounded-xl border px-3 py-2 text-sm"
              autoComplete="organization-title"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Telefone
            </span>
            <input
              type="tel"
              value={novoContato.telefone}
              onChange={(event) =>
                setNovoContato({ ...novoContato, telefone: event.target.value })
              }
              className="w-full rounded-xl border px-3 py-2 text-sm"
              autoComplete="tel"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              E-mail
            </span>
            <input
              type="email"
              value={novoContato.email}
              onChange={(event) =>
                setNovoContato({ ...novoContato, email: event.target.value })
              }
              className="w-full rounded-xl border px-3 py-2 text-sm"
              autoComplete="email"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Endereço de visita
          </span>
          <textarea
            value={novoContato.endereco_visita}
            onChange={(event) =>
              setNovoContato({
                ...novoContato,
                endereco_visita: event.target.value
              })
            }
            rows={2}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Informe o endereço específico para visitar este contato"
            autoComplete="street-address"
          />
        </label>

        <Button
          type="button"
          onClick={adicionar}
          disabled={salvando || contatos.length >= 3}
          loading={salvando}
          loadingText="Adicionando contato..."
          className="mt-3 w-full"
        >
          Adicionar Contato
        </Button>

        {contatos.length >= 3 ? (
          <p className="mt-2 text-xs text-amber-700" role="status">
            Limite de 3 contatos por cliente atingido.
          </p>
        ) : null}
      </div>

      {textoMensagem ? (
        <div
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
          role={mensagemErro ? 'alert' : 'status'}
          aria-live={mensagemErro ? 'assertive' : 'polite'}
        >
          {textoMensagem}
        </div>
      ) : null}

      <div className="space-y-3">
        {carregando ? (
          <div
            className="py-4 text-center text-sm text-slate-400"
            role="status"
            aria-live="polite"
          >
            Carregando contatos...
          </div>
        ) : contatos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
            Nenhum contato cadastrado.
          </div>
        ) : (
          contatosOrdenados.map((contato) => {
            const whatsapp = montarLinkWhatsapp(contato.telefone);
            const editando = editandoId === contato.id;

            return (
              <article
                key={contato.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200"
                aria-label={`Contato ${contato.nome}`}
              >
                {editando ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Nome
                        </span>
                        <input
                          type="text"
                          value={edicao.nome}
                          onChange={(event) =>
                            setEdicao({ ...edicao, nome: event.target.value })
                          }
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                          autoComplete="name"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Cargo
                        </span>
                        <input
                          type="text"
                          value={edicao.cargo}
                          onChange={(event) =>
                            setEdicao({ ...edicao, cargo: event.target.value })
                          }
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                          autoComplete="organization-title"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Telefone
                        </span>
                        <input
                          type="tel"
                          value={edicao.telefone}
                          onChange={(event) =>
                            setEdicao({ ...edicao, telefone: event.target.value })
                          }
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                          autoComplete="tel"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          E-mail
                        </span>
                        <input
                          type="email"
                          value={edicao.email}
                          onChange={(event) =>
                            setEdicao({ ...edicao, email: event.target.value })
                          }
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                          autoComplete="email"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Endereço de visita
                      </span>
                      <textarea
                        value={edicao.endereco_visita}
                        onChange={(event) =>
                          setEdicao({
                            ...edicao,
                            endereco_visita: event.target.value
                          })
                        }
                        rows={2}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        placeholder="Informe o endereço específico para visitar este contato"
                        autoComplete="street-address"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => salvarEdicao(contato.id)}
                        disabled={salvando}
                        loading={salvando}
                        loadingText="Salvando contato..."
                      >
                        Salvar
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditandoId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{contato.nome}</p>
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        {contato.cargo || 'Contato'}
                      </p>

                      {contato.telefone ? (
                        <p className="mt-2 text-sm text-slate-600">
                          {formatarTelefone(contato.telefone)}
                        </p>
                      ) : null}

                      {contato.email ? (
                        <p className="text-sm text-slate-600">{contato.email}</p>
                      ) : null}

                      {contato.endereco_visita ? (
                        <div
                          className={`mt-3 rounded-xl border px-3 py-2 ${
                            contato.endereco_padrao
                              ? 'border-amber-200 bg-amber-50'
                              : 'border-slate-100 bg-slate-50'
                          }`}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Endereço de visita
                              </p>
                              <p className="mt-1 whitespace-pre-line text-sm font-medium text-slate-700">
                                {contato.endereco_visita}
                              </p>
                            </div>

                            {contato.endereco_padrao ? (
                              <span
                                className="inline-flex h-[30px] items-center rounded-lg border border-amber-300 bg-amber-100 px-[10px] text-sm font-semibold leading-none text-amber-800"
                                aria-label="Este é o endereço padrão de visita"
                              >
                                Padrão
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => definirEnderecoPadrao(contato)}
                                disabled={salvando}
                                aria-label={`Usar endereço de ${contato.nome} como padrão`}
                              >
                                Usar como padrão
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-slate-400">
                          Sem endereço de visita cadastrado.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      {whatsapp ? (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-green-50 p-2 text-green-600 transition hover:bg-green-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                          aria-label={`Abrir WhatsApp de ${contato.nome}`}
                        >
                          📱
                        </a>
                      ) : null}

                      {contato.email ? (
                        <a
                          href={`mailto:${contato.email}`}
                          className="rounded-full bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                          aria-label={`Enviar e-mail para ${contato.nome}`}
                        >
                          &#9993;
                        </a>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => iniciarEdicao(contato)}
                        className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                        aria-label={`Editar contato ${contato.nome}`}
                      >
                        &#9998;
                      </button>

                      <button
                        type="button"
                        onClick={() => excluir(contato.id)}
                        className="rounded-full bg-red-50 p-2 text-red-600 transition hover:bg-red-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                        aria-label={`Excluir contato ${contato.nome}`}
                      >
                        &#128465;
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}









