'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { ESTADOS_BRASIL } from '../../utils/constants';
import { valorLista } from '../../utils/validators';
import Button from '../ui/Button';

type GestaoUsuariosProps = {
  segmentosDisponiveis?: string[];
  estadosDisponiveis?: string[];
};

type NovoUsuario = {
  email: string;
  password: string;
  role: Profile['role'];
  segmentos_permitidos: string[];
  estados_permitidos: string[];
};

const novoUsuarioInicial: NovoUsuario = {
  email: '',
  password: '',
  role: 'vendedor',
  segmentos_permitidos: [],
  estados_permitidos: []
};

function alternarItem(lista: string[], item: string) {
  return lista.includes(item)
    ? lista.filter((valor) => valor !== item)
    : [...lista, item];
}

function ListaCheckbox({
  titulo,
  opcoes,
  selecionados,
  onChange
}: {
  titulo: string;
  opcoes: string[];
  selecionados: string[];
  onChange: (valores: string[]) => void;
}) {
  if (!opcoes.length) {
    return (
      <div>
        <p className="text-[10px] font-bold uppercase text-slate-400">{titulo}</p>
        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          Nenhuma opção disponível no banco.
        </p>
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="text-[10px] font-bold uppercase text-slate-400">
        {titulo}
      </legend>

      <div className="mt-2 max-h-36 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
        {opcoes.map((opcao) => (
          <label
            key={opcao}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selecionados.includes(opcao)}
              onChange={() => onChange(alternarItem(selecionados, opcao))}
            />
            <span>{opcao}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function GestaoUsuarios({
  segmentosDisponiveis = [],
  estadosDisponiveis = []
}: GestaoUsuariosProps) {
  const [usuarios, setUsuarios] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Profile | null>(null);
  const [criando, setCriando] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState<NovoUsuario>(novoUsuarioInicial);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const segmentos = useMemo(
    () =>
      Array.from(new Set(segmentosDisponiveis.map(valorLista).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, 'pt-BR')
      ),
    [segmentosDisponiveis]
  );

  const estados = useMemo(() => {
    const estadosBanco = estadosDisponiveis
      .map((estado) => estado.trim().toUpperCase())
      .filter(Boolean);

    return Array.from(new Set([...estadosBanco, ...ESTADOS_BRASIL])).sort();
  }, [estadosDisponiveis]);

  async function carregarUsuarios() {
    setLoading(true);
    setMensagem(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email', { ascending: true });

    if (error) {
      setMensagem(`Erro ao carregar usuários: ${error.message}`);
      setUsuarios([]);
    } else {
      setUsuarios((data || []) as Profile[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void carregarUsuarios();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function salvarAlteracoes() {
    if (!editando) return;

    if (editando.role === 'admin') {
      const confirmou = window.confirm(
        'Você está concedendo acesso de administrador. Deseja continuar?'
      );

      if (!confirmou) return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        role: editando.role,
        segmentos_permitidos:
          editando.role === 'admin' ? [] : editando.segmentos_permitidos || [],
        estados_permitidos:
          editando.role === 'admin' ? [] : editando.estados_permitidos || []
      })
      .eq('id', editando.id);

    if (error) {
      setMensagem(`Erro ao atualizar usuário: ${error.message}`);
      return;
    }

    setMensagem('Usuário atualizado com sucesso.');
    setEditando(null);
    carregarUsuarios();
  }

  async function criarUsuario() {
    if (!novoUsuario.email.trim() || !novoUsuario.password.trim()) {
      setMensagem('Informe e-mail e senha provisória.');
      return;
    }

    if (novoUsuario.role === 'admin') {
      const confirmou = window.confirm(
        'Você está criando um usuário administrador. Deseja continuar?'
      );

      if (!confirmou) return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setMensagem('Sessão expirada. Faça login novamente.');
      return;
    }

    setMensagem('Criando usuário...');

    const resposta = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        email: novoUsuario.email.trim(),
        password: novoUsuario.password,
        role: novoUsuario.role,
        segmentos_permitidos:
          novoUsuario.role === 'admin' ? [] : novoUsuario.segmentos_permitidos,
        estados_permitidos:
          novoUsuario.role === 'admin' ? [] : novoUsuario.estados_permitidos
      })
    });

    const resultado = (await resposta.json()) as { error?: string; message?: string };

    if (!resposta.ok) {
      setMensagem(resultado.error || 'Não foi possível criar o usuário.');
      return;
    }

    setMensagem(resultado.message || 'Usuário criado com sucesso.');
    setNovoUsuario(novoUsuarioInicial);
    setCriando(false);
    carregarUsuarios();
  }

  if (loading) {
    return (
      <div className="mt-4 rounded-2xl border bg-white p-4 text-sm text-slate-500">
        Carregando usuários...
      </div>
    );
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold">Gestão de Usuários e Alçadas</h2>
          <p className="text-sm text-slate-500">
            Controle quem acessa segmentos e estados do CRM.
          </p>
        </div>

        <Button type="button" onClick={() => setCriando((atual) => !atual)}>
          {criando ? 'Cancelar criação' : 'Criar usuário'}
        </Button>
      </div>

      {mensagem ? (
        <div className="mx-6 mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {mensagem}
        </div>
      ) : null}

      {criando ? (
        <div className="grid gap-4 border-b border-slate-200 p-6 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                E-mail
              </span>
              <input
                type="email"
                value={novoUsuario.email}
                onChange={(event) =>
                  setNovoUsuario({ ...novoUsuario, email: event.target.value })
                }
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Senha provisória
              </span>
              <input
                type="password"
                value={novoUsuario.password}
                onChange={(event) =>
                  setNovoUsuario({ ...novoUsuario, password: event.target.value })
                }
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Perfil
              </span>
              <select
                value={novoUsuario.role}
                onChange={(event) =>
                  setNovoUsuario({
                    ...novoUsuario,
                    role: event.target.value as Profile['role']
                  })
                }
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              >
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </label>

            <Button type="button" onClick={criarUsuario}>
              Criar usuário
            </Button>
          </div>

          {novoUsuario.role !== 'admin' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <ListaCheckbox
                titulo="Segmentos permitidos"
                opcoes={segmentos}
                selecionados={novoUsuario.segmentos_permitidos}
                onChange={(valores) =>
                  setNovoUsuario({
                    ...novoUsuario,
                    segmentos_permitidos: valores
                  })
                }
              />

              <ListaCheckbox
                titulo="Estados permitidos"
                opcoes={estados}
                selecionados={novoUsuario.estados_permitidos}
                onChange={(valores) =>
                  setNovoUsuario({
                    ...novoUsuario,
                    estados_permitidos: valores
                  })
                }
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-700">
              Administradores têm acesso total a todos os clientes e alçadas.
            </div>
          )}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">E-mail</th>
              <th className="px-6 py-3 text-left font-semibold">Cargo</th>
              <th className="px-6 py-3 text-left font-semibold">
                Alçadas
              </th>
              <th className="px-6 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario) => (
              <tr
                key={usuario.id}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-6 py-4">{usuario.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                      usuario.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {usuario.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {usuario.role === 'admin' ? (
                    'Acesso total'
                  ) : (
                    <div>
                      <p>
                        <strong>Seg:</strong>{' '}
                        {usuario.segmentos_permitidos?.join(', ') || 'Todos'}
                      </p>
                      <p>
                        <strong>UF:</strong>{' '}
                        {usuario.estados_permitidos?.join(', ') || 'Todos'}
                      </p>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditando(usuario);
                      setMensagem(null);
                    }}
                  >
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando ? (
        <div className="border-t border-slate-200 bg-slate-50 p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">
                Editando {editando.email}
              </h3>
              <p className="text-sm text-slate-500">
                Use as opções abaixo para evitar erros de digitação em segmentos e estados.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditando(null)}
            >
              Fechar
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Perfil
              </span>
              <select
                value={editando.role}
                onChange={(event) =>
                  setEditando({
                    ...editando,
                    role: event.target.value as Profile['role']
                  })
                }
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              >
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </label>

            {editando.role !== 'admin' ? (
              <>
                <ListaCheckbox
                  titulo="Segmentos permitidos"
                  opcoes={segmentos}
                  selecionados={editando.segmentos_permitidos || []}
                  onChange={(valores) =>
                    setEditando({
                      ...editando,
                      segmentos_permitidos: valores
                    })
                  }
                />

                <ListaCheckbox
                  titulo="Estados permitidos"
                  opcoes={estados}
                  selecionados={editando.estados_permitidos || []}
                  onChange={(valores) =>
                    setEditando({
                      ...editando,
                      estados_permitidos: valores
                    })
                  }
                />
              </>
            ) : (
              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-700 lg:col-span-2">
                Administradores têm acesso total.
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={salvarAlteracoes}>
              Salvar alterações
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditando(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
