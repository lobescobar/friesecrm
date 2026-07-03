'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { ESTADOS_BRASIL, SEGMENTOS_CLIENTES } from '../../utils/constants';
import { valorLista } from '../../utils/validators';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import RegrasCancelamentoOrcamentos from './admin/RegrasCancelamentoOrcamentos';

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

function segmentoPermitido(valor: string) {
  return (SEGMENTOS_CLIENTES as readonly string[]).includes(valor);
}

function ListaCheckbox({
  titulo,
  opcoes,
  selecionados,
  onChange,
  disabled = false
}: {
  titulo: string;
  opcoes: string[];
  selecionados: string[];
  onChange: (valores: string[]) => void;
  disabled?: boolean;
}) {
  if (!opcoes.length) {
    return (
      <div>
        <p className="text-[10px] font-bold uppercase text-slate-400">{titulo}</p>
        <p
          className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500"
          role="status"
        >
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

      <div
        className="mt-2 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white p-2"
        aria-label={`Lista de ${titulo.toLowerCase()}`}
      >
        {opcoes.map((opcao) => (
          <label
            key={opcao}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selecionados.includes(opcao)}
              disabled={disabled}
              aria-label={`${selecionados.includes(opcao) ? 'Remover' : 'Adicionar'} ${opcao} em ${titulo}`}
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
  const [salvando, setSalvando] = useState(false);

  const segmentos = useMemo(() => {
    const segmentosBancoPadronizados = segmentosDisponiveis
      .map(valorLista)
      .filter((segmento) => segmento && segmentoPermitido(segmento));

    return Array.from(
      new Set([...SEGMENTOS_CLIENTES, ...segmentosBancoPadronizados])
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [segmentosDisponiveis]);

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

    setSalvando(true);

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
      setSalvando(false);
      return;
    }

    setMensagem('Usuário atualizado com sucesso.');
    setEditando(null);
    setSalvando(false);
    carregarUsuarios();
  }

  async function excluirUsuario(usuario: Profile) {
    const confirmou = window.confirm(
      [
        `Excluir o usuário ${usuario.email}?`,
        '',
        'Esta ação remove o acesso ao CRM e apaga o cadastro de autenticação do usuário.',
        'Ela não remove clientes, orçamentos nem históricos já importados.',
        '',
        'Deseja continuar?'
      ].join('\n')
    );

    if (!confirmou) return;

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setMensagem('Sessão expirada. Faça login novamente.');
      return;
    }

    setSalvando(true);
    setMensagem('Excluindo usuário...');

    const resposta = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        userId: usuario.id
      })
    });

    const resultado = (await resposta.json()) as {
      error?: string;
      message?: string;
    };

    if (!resposta.ok) {
      setMensagem(resultado.error || 'Não foi possível excluir o usuário.');
      setSalvando(false);
      return;
    }

    setMensagem(resultado.message || 'Usuário excluído com sucesso.');
    setEditando(null);
    setSalvando(false);
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

    setSalvando(true);
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
      setSalvando(false);
      return;
    }

    setMensagem(resultado.message || 'Usuário criado com sucesso.');
    setNovoUsuario(novoUsuarioInicial);
    setCriando(false);
    setSalvando(false);
    carregarUsuarios();
  }

  if (loading) {
    return (
      <div
        className="mt-4 rounded-2xl border bg-white p-4 text-sm text-slate-500"
        role="status"
        aria-live="polite"
      >
        Carregando usuários...
      </div>
    );
  }

  return (
    <>
      <RegrasCancelamentoOrcamentos segmentosDisponiveis={segmentos} />

      <section
        className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm"
        aria-labelledby="gestao-usuarios-titulo"
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="gestao-usuarios-titulo" className="text-lg font-bold">
              Gestão de Usuários e Alçadas
            </h2>
            <p className="text-sm text-slate-500">
              Controle quem acessa segmentos e estados do CRM.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setCriando((atual) => !atual)}
            disabled={salvando}
            aria-expanded={criando}
            aria-controls="formulario-criacao-usuario"
          >
            {criando ? 'Cancelar criação' : 'Criar usuário'}
          </Button>
        </div>

        {mensagem ? (
          <div
            className="mx-6 mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
            role={mensagem.toLowerCase().includes('erro') || mensagem.toLowerCase().includes('não foi possível') ? 'alert' : 'status'}
            aria-live="polite"
          >
            {mensagem}
          </div>
        ) : null}

        {criando ? (
          <div
            id="formulario-criacao-usuario"
            className="grid gap-4 border-b border-slate-200 p-6 lg:grid-cols-2"
          >
            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  E-mail
                </span>
                <input
                  type="email"
                  value={novoUsuario.email}
                  autoComplete="email"
                  aria-label="E-mail do novo usuário" 
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
                  autoComplete="new-password"
                  aria-label="Senha provisória do novo usuário" 
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
                  aria-label="Perfil do novo usuário"
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

              <Button
                type="button"
                onClick={criarUsuario}
                disabled={salvando}
                loading={salvando}
                loadingText="Criando usuário..."
              >
                Criar usuário
              </Button>
            </div>

            {novoUsuario.role !== 'admin' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <ListaCheckbox
                  titulo="Segmentos permitidos"
                  opcoes={segmentos}
                  selecionados={novoUsuario.segmentos_permitidos}
                  disabled={salvando}
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
                  disabled={salvando}
                  onChange={(valores) =>
                    setNovoUsuario({
                      ...novoUsuario,
                      estados_permitidos: valores
                    })
                  }
                />
              </div>
            ) : (
              <div
                className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-700"
                role="status"
              >
                Administradores têm acesso total a todos os clientes e alçadas.
              </div>
            )}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Usuários cadastrados no CRM, perfil de acesso, alçadas e ações de edição.
            </caption>
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold">E-mail</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold">Cargo</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold">Alçadas</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold">Ações</th>
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
                      aria-label={`Editar usuário ${usuario.email}`}
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
      </section>

      {editando ? (
        <Modal
          title={`Editar ${editando.email}`}
          subtitle="Alçadas e perfil de acesso."
          onClose={() => setEditando(null)}
          scrollKey={`gestao-usuario:${editando.id}`}
          footer={
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="danger"
                onClick={() => excluirUsuario(editando)}
                disabled={salvando}
                loading={salvando}
                loadingText="Excluindo..."
              >
                Excluir usuário
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
                onClick={salvarAlteracoes}
                disabled={salvando}
                loading={salvando}
                loadingText="Salvando..."
              >
                Salvar alterações
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Perfil
              </span>
              <select
                value={editando.role}
                aria-label={`Perfil de acesso de ${editando.email}`}
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
              <div className="grid gap-4 md:grid-cols-2">
                <ListaCheckbox
                  titulo="Segmentos permitidos"
                  opcoes={segmentos}
                  selecionados={editando.segmentos_permitidos || []}
                  disabled={salvando}
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
                  disabled={salvando}
                  onChange={(valores) =>
                    setEditando({
                      ...editando,
                      estados_permitidos: valores
                    })
                  }
                />
              </div>
            ) : (
              <div
                className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-700"
                role="status"
              >
                Administradores têm acesso total.
              </div>
            )}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
