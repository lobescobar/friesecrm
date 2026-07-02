'use client';

import { useState } from 'react';
import { Contato } from '../../types';
import { emailValido, telefoneValido } from '../../utils/validators';
import { formatarTelefone, montarLinkWhatsapp } from '../../utils/formatters';
import Button from '../ui/Button';

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
      endereco_visita: novoContato.endereco_visita.trim() || undefined
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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Contatos da Empresa
        </h4>

        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold">
          {contatos.length}/3 cadastrados
        </span>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Nome"
            value={novoContato.nome}
            onChange={(event) =>
              setNovoContato({ ...novoContato, nome: event.target.value })
            }
            className="rounded-xl border px-3 py-2 text-sm"
          />

          <input
            type="text"
            placeholder="Cargo"
            value={novoContato.cargo}
            onChange={(event) =>
              setNovoContato({ ...novoContato, cargo: event.target.value })
            }
            className="rounded-xl border px-3 py-2 text-sm"
          />

          <input
            type="text"
            placeholder="Telefone"
            value={novoContato.telefone}
            onChange={(event) =>
              setNovoContato({ ...novoContato, telefone: event.target.value })
            }
            className="rounded-xl border px-3 py-2 text-sm"
          />

          <input
            type="email"
            placeholder="E-mail"
            value={novoContato.email}
            onChange={(event) =>
              setNovoContato({ ...novoContato, email: event.target.value })
            }
            className="rounded-xl border px-3 py-2 text-sm"
          />
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
          />
        </label>

        <Button
          type="button"
          onClick={adicionar}
          disabled={salvando || contatos.length >= 3}
          className="mt-3 w-full"
        >
          Adicionar Contato
        </Button>

        {contatos.length >= 3 ? (
          <p className="mt-2 text-xs text-amber-700">
            Limite de 3 contatos por cliente atingido.
          </p>
        ) : null}
      </div>

      {mensagem || erro ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {mensagem || erro}
        </div>
      ) : null}

      <div className="space-y-3">
        {carregando ? (
          <div className="py-4 text-center text-sm text-slate-400">
            Carregando contatos...
          </div>
        ) : contatos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
            Nenhum contato cadastrado.
          </div>
        ) : (
          contatos.map((contato) => {
            const whatsapp = montarLinkWhatsapp(contato.telefone);
            const editando = editandoId === contato.id;

            return (
              <article
                key={contato.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200"
              >
                {editando ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={edicao.nome}
                        onChange={(event) =>
                          setEdicao({ ...edicao, nome: event.target.value })
                        }
                        className="rounded-xl border px-3 py-2 text-sm"
                      />

                      <input
                        type="text"
                        value={edicao.cargo}
                        onChange={(event) =>
                          setEdicao({ ...edicao, cargo: event.target.value })
                        }
                        className="rounded-xl border px-3 py-2 text-sm"
                      />

                      <input
                        type="text"
                        value={edicao.telefone}
                        onChange={(event) =>
                          setEdicao({ ...edicao, telefone: event.target.value })
                        }
                        className="rounded-xl border px-3 py-2 text-sm"
                      />

                      <input
                        type="email"
                        value={edicao.email}
                        onChange={(event) =>
                          setEdicao({ ...edicao, email: event.target.value })
                        }
                        className="rounded-xl border px-3 py-2 text-sm"
                      />
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
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => salvarEdicao(contato.id)}
                        disabled={salvando}
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
                        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Endereço de visita
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm font-medium text-slate-700">
                            {contato.endereco_visita}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      {whatsapp ? (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-green-50 p-2 text-green-600 transition hover:bg-green-100"
                          aria-label="Abrir WhatsApp"
                        >
                          📱
                        </a>
                      ) : null}

                      {contato.email ? (
                        <a
                          href={`mailto:${contato.email}`}
                          className="rounded-full bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          aria-label="Enviar e-mail"
                        >
                          ✉️
                        </a>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => iniciarEdicao(contato)}
                        className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                        aria-label="Editar contato"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        onClick={() => excluir(contato.id)}
                        className="rounded-full bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                        aria-label="Excluir contato"
                      >
                        🗑️
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
