"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Profile } from "../../types";

const ESTADOS_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const SEGMENTOS = [
  "AGROINDUSTRIA",
  "CORRUGADOS",
  "TEMPERA INDUTIVA",
  "TRATAMENTO TERMICO"
];

type PerfilUsuario = "admin" | "vendedor";

type MultiSelectProps = {
  titulo: string;
  opcoes: string[];
  selecionados: string[];
  onSalvar: (valores: string[]) => Promise<boolean>;
};

function MultiSelect({ titulo, opcoes, selecionados, onSalvar }: MultiSelectProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [valores, setValores] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setValores(selecionados || []);
  }, [selecionados]);

  const opcoesFiltradas = opcoes.filter((item) =>
    item.toLowerCase().includes(busca.toLowerCase())
  );

  const todosSelecionados = opcoes.length > 0 && opcoes.every((item) => valores.includes(item));

  const toggleValor = (valor: string) => {
    setValores((atual) =>
      atual.includes(valor) ? atual.filter((v) => v !== valor) : [...atual, valor]
    );
  };

  const toggleTodos = () => {
    setValores(todosSelecionados ? [] : [...opcoes]);
  };

  const cancelar = () => {
    setValores(selecionados || []);
    setBusca("");
    setAberto(false);
    setSalvando(false);
  };

  const salvar = async () => {
    if (salvando) return;
    setSalvando(true);

    try {
      const sucesso = await onSalvar(valores);

      if (sucesso) {
        setAberto(false);
        setBusca("");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar seleção.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="relative min-w-[240px]">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-left flex justify-between items-center hover:bg-slate-50"
      >
        <span>{selecionados?.length || 0} selecionado(s)</span>
        <span>▼</span>
      </button>

      {aberto && (
        <div className="absolute z-50 mt-2 w-72 bg-white border border-slate-300 rounded-2xl shadow-xl p-3">
          <div className="font-bold text-sm mb-2">{titulo}</div>

          <input
            type="text"
            placeholder="Pesquisar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 mb-3"
          />

          <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl p-2">
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input type="checkbox" checked={todosSelecionados} onChange={toggleTodos} />
              Selecionar tudo
            </label>

            {opcoesFiltradas.map((item) => (
              <label key={item} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={valores.includes(item)}
                  onChange={() => toggleValor(item)}
                />
                {item}
              </label>
            ))}

            {opcoesFiltradas.length === 0 && (
              <div className="text-sm text-slate-400 py-3">
                Nenhuma opção encontrada.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={cancelar}
              disabled={salvando}
              className="px-4 py-2 border border-slate-300 rounded-xl disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "OK"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GestaoUsuarios() {
  const [usuarios, setUsuarios] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoRole, setNovoRole] = useState<PerfilUsuario>("vendedor");

  const carregarUsuarios = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("email", { ascending: true });

      if (error) {
        console.warn("Erro ao carregar usuários:", error?.message || error);
        alert("Erro ao carregar usuários.");
        return;
      }

      setUsuarios((data || []) as Profile[]);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro inesperado ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const atualizarUsuarioLocal = (
    id: string,
    campo: "estados_permitidos" | "segmentos_permitidos",
    valores: string[]
  ) => {
    setUsuarios((atual) =>
      atual.map((usuario) =>
        usuario.id === id ? { ...usuario, [campo]: valores } : usuario
      )
    );
  };

  const atualizarEstados = async (id: string, estados: string[]): Promise<boolean> => {
    atualizarUsuarioLocal(id, "estados_permitidos", estados);

    const { error } = await supabase
      .from("profiles")
      .update({ estados_permitidos: estados })
      .eq("id", id);

    if (error) {
      console.warn("Erro ao atualizar estados:", error?.message || error);
      alert("Erro ao atualizar estados.");
      await carregarUsuarios();
      return false;
    }

    return true;
  };

  const atualizarSegmentos = async (id: string, segmentos: string[]): Promise<boolean> => {
    atualizarUsuarioLocal(id, "segmentos_permitidos", segmentos);

    const { error } = await supabase
      .from("profiles")
      .update({ segmentos_permitidos: segmentos })
      .eq("id", id);

    if (error) {
      console.warn("Erro ao atualizar segmentos:", error?.message || error);
      alert("Erro ao atualizar segmentos.");
      await carregarUsuarios();
      return false;
    }

    return true;
  };

  const atualizarRole = async (id: string, role: PerfilUsuario) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) {
      console.warn("Erro ao atualizar perfil:", error?.message || error);
      alert("Erro ao atualizar perfil.");
      return;
    }

    await carregarUsuarios();
  };

  const cadastrarUsuario = async () => {
    if (!novoEmail || !novaSenha) {
      alert("Informe e-mail e senha.");
      return;
    }

    if (novaSenha.length < 6) {
      alert("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: novoEmail,
          password: novaSenha,
          role: novoRole,
          estados_permitidos: [],
          segmentos_permitidos: []
        })
      });

      const texto = await response.text();

      let result: any = {};

      try {
        result = JSON.parse(texto);
      } catch {
        result = { error: texto };
      }

      if (!response.ok) {
        alert(result.error || "Erro ao criar usuário.");
        return;
      }

      alert("Usuário criado com sucesso.");

      setNovoEmail("");
      setNovaSenha("");
      setNovoRole("vendedor");

      await carregarUsuarios();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro interno ao cadastrar usuário.");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Usuários</h2>
          <p className="text-sm text-slate-500">Controle de permissões</p>
        </div>

        <button onClick={carregarUsuarios} className="px-4 py-2 border border-slate-300 rounded-2xl">
          Atualizar
        </button>
      </div>

      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5 mb-6">
        <h3 className="text-lg font-bold mb-4">Novo usuário</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="email"
            placeholder="E-mail"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            className="border border-slate-300 rounded-2xl px-4 py-3"
          />

          <input
            type="password"
            placeholder="Senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="border border-slate-300 rounded-2xl px-4 py-3"
          />

          <select
            value={novoRole}
            onChange={(e) => setNovoRole(e.target.value as PerfilUsuario)}
            className="border border-slate-300 rounded-2xl px-4 py-3"
          >
            <option value="vendedor">Vendedor</option>
            <option value="admin">Administrador</option>
          </select>

          <button onClick={cadastrarUsuario} className="bg-slate-900 text-white rounded-2xl font-bold">
            Cadastrar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-72">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="py-3 px-3">E-mail</th>
              <th className="py-3 px-3">Perfil</th>
              <th className="py-3 px-3">Estados permitidos</th>
              <th className="py-3 px-3">Segmentos permitidos</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center">
                  Carregando...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-slate-100">
                  <td className="py-4 px-3">{usuario.email}</td>

                  <td className="py-4 px-3">
                    <select
                      value={usuario.role || "vendedor"}
                      onChange={(e) => atualizarRole(usuario.id, e.target.value as PerfilUsuario)}
                      className="border border-slate-300 rounded-xl px-3 py-2"
                    >
                      <option value="vendedor">Vendedor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>

                  <td className="py-4 px-3">
                    <MultiSelect
                      titulo="Estados"
                      opcoes={ESTADOS_BR}
                      selecionados={usuario.estados_permitidos || []}
                      onSalvar={(valores) => atualizarEstados(usuario.id, valores)}
                    />
                  </td>

                  <td className="py-4 px-3">
                    <MultiSelect
                      titulo="Segmentos"
                      opcoes={SEGMENTOS}
                      selecionados={usuario.segmentos_permitidos || []}
                      onSalvar={(valores) => atualizarSegmentos(usuario.id, valores)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
