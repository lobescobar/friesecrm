"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "../../lib/supabase";
import ImportarERP from "../components/ImportarERP";
import GestaoUsuarios from "../components/GestaoUsuarios";
import ErrorBoundary from "../components/ErrorBoundary";
import { useClientes } from "../../hooks/useClientes";
import { useContatos } from "../../hooks/useContatos";
import { useAuth } from "../../hooks/useAuth";
import { STATUS_COLORS, StatusType } from "../../utils/constants";
import { Cliente } from "../../types";

const MapaClientes = dynamic(
  () => import("../MapaClientes"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">
        Carregando mapa...
      </div>
    ),
  }
);

type ColunaOrdenacao =
  | keyof Cliente
  | "cliente_nome";

type DirecaoOrdenacao = "asc" | "desc";

function CRMContent() {
  const router = useRouter();
  const [montado, setMontado] = useState(false);

  const { profile, loading: verificandoLogin, isAdmin } = useAuth();
  const { clientes, carregarClientes } = useClientes(profile);

  const [buscaEmpresa, setBuscaEmpresa] = useState("");
  const [buscaCodigo, setBuscaCodigo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroSegmento, setFiltroSegmento] = useState("Todos");

  const [ordenacao, setOrdenacao] = useState<{
    coluna: ColunaOrdenacao;
    direcao: DirecaoOrdenacao;
  }>({
    coluna: "empresa",
    direcao: "asc",
  });

  const [clienteSelecionado, setClienteSelecionado] =
    useState<Cliente | null>(null);

  const {
    contatos,
    carregarContatos,
    adicionarContato,
    loading: carregandoContatos,
  } = useContatos();

  const [novoContato, setNovoContato] = useState({
    nome: "",
    cargo: "",
    telefone: "",
    email: "",
  });

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (clienteSelecionado?.id) {
      carregarContatos(clienteSelecionado.id);
    }
  }, [clienteSelecionado, carregarContatos]);

  useEffect(() => {
    if (!verificandoLogin && !profile) {
      router.push("/login");
    }
  }, [verificandoLogin, profile, router]);

  const segmentosUnicos = useMemo(() => {
    return Array.from(
      new Set(
        (clientes || [])
          .map((cliente) => cliente.segmento)
          .filter(Boolean)
      )
    ).sort() as string[];
  }, [clientes]);

  const estadosUnicos = useMemo(() => {
    return Array.from(
      new Set(
        (clientes || [])
          .map((cliente) => cliente.estado)
          .filter(Boolean)
      )
    ).sort() as string[];
  }, [clientes]);

  const alternarOrdenacao = (coluna: ColunaOrdenacao) => {
    setOrdenacao((atual) => {
      if (atual.coluna === coluna) {
        return {
          coluna,
          direcao: atual.direcao === "asc" ? "desc" : "asc",
        };
      }

      return {
        coluna,
        direcao: "asc",
      };
    });
  };

  const clientesFiltrados = useMemo(() => {
   const textoEmpresa = buscaEmpresa.trim().toLowerCase();
const textoEmpresaNumeros = buscaEmpresa.replace(/\D/g, "");

const textoCodigo = buscaCodigo.trim().toLowerCase();

const filtrados = (clientes || []).filter((cliente) => {
  const cnpjNumeros = cliente.cnpj?.replace(/\D/g, "") || "";

  const passaEmpresa =
    !textoEmpresa ||
    cliente.empresa?.toLowerCase().includes(textoEmpresa) ||
    cliente.razao_social?.toLowerCase().includes(textoEmpresa) ||
    cliente.cnpj?.toLowerCase().includes(textoEmpresa) ||
    (!!textoEmpresaNumeros &&
      cnpjNumeros.includes(textoEmpresaNumeros));

      const passaCodigo =
        !textoCodigo ||
        cliente.codigo_cliente?.toLowerCase().includes(textoCodigo);

      const passaStatus =
        filtroStatus === "Todos" ||
        cliente.status === filtroStatus;

      const passaEstado =
        filtroEstado === "Todos" ||
        cliente.estado === filtroEstado;

      const passaSegmento =
        filtroSegmento === "Todos" ||
        cliente.segmento === filtroSegmento;

      return (
        passaEmpresa &&
        passaCodigo &&
        passaStatus &&
        passaEstado &&
        passaSegmento
      );
    });

    const ordenados = [...filtrados].sort((a, b) => {
      const coluna = ordenacao.coluna;

      const valorA =
        coluna === "cliente_nome"
          ? a.empresa || ""
          : String((a as any)[coluna] || "");

      const valorB =
        coluna === "cliente_nome"
          ? b.empresa || ""
          : String((b as any)[coluna] || "");

      const comparacao = valorA.localeCompare(
        valorB,
        "pt-BR",
        {
          numeric: true,
          sensitivity: "base",
        }
      );

      return ordenacao.direcao === "asc"
        ? comparacao
        : -comparacao;
    });

    return ordenados;
  }, [
    clientes,
    buscaEmpresa,
    buscaCodigo,
    filtroStatus,
    filtroEstado,
    filtroSegmento,
    ordenacao,
  ]);

  if (!profile) {
  router.replace("/login");
  return null;

  const handleAdicionarContato = async () => {
    if (!clienteSelecionado || !novoContato.nome) return;

    const sucesso = await adicionarContato({
      ...novoContato,
      cliente_id: clienteSelecionado.id,
    });

    if (sucesso) {
      setNovoContato({
        nome: "",
        cargo: "",
        telefone: "",
        email: "",
      });
    }
  };

  const IconeSort = ({
    coluna,
  }: {
    coluna: ColunaOrdenacao;
  }) => (
    <span
      className={`ml-1 text-[10px] ${
        ordenacao.coluna === coluna
          ? "text-slate-900"
          : "opacity-30"
      }`}
    >
      {ordenacao.coluna === coluna
        ? ordenacao.direcao === "asc"
          ? "▲"
          : "▼"
        : "⇅"}
    </span>
  );

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-5 mb-4 flex justify-between items-center">
          <div>
            <img
              src="/logo.png"
              alt="Logo Friese"
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="flex gap-2">
            {isAdmin && (
              <ImportarERP onSucesso={carregarClientes} />
            )}

            <button
              onClick={() => {
                supabase.auth.signOut();
                router.push("/login");
              }}
              className="bg-white border border-slate-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-3 mb-4 h-[400px] overflow-hidden">
          {montado && (
            <MapaClientes clientes={clientesFiltrados} />
          )}
        </div>

        {isAdmin && <GestaoUsuarios />}

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden mt-4">
          <div className="flex flex-wrap gap-4 px-5 py-4 border-b border-slate-200 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Buscar Cliente
              </label>
              <input
                type="text"
                value={buscaEmpresa}
                onChange={(e) =>
                  setBuscaEmpresa(e.target.value)
                }
                className="border border-slate-300 rounded-xl px-3 py-2 text-sm w-[180px]"
                placeholder="Nome ou CNPJ..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Cód. ERP
              </label>
              <input
                type="text"
                value={buscaCodigo}
                onChange={(e) =>
                  setBuscaCodigo(e.target.value)
                }
                className="border border-slate-300 rounded-xl px-3 py-2 text-sm w-[100px]"
                placeholder="Cód..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Segmento
              </label>
              <select
                value={filtroSegmento}
                onChange={(e) =>
                  setFiltroSegmento(e.target.value)
                }
                className="border border-slate-300 rounded-xl px-3 py-2 text-sm w-[140px]"
              >
                <option value="Todos">Todos</option>
                {segmentosUnicos.map((segmento) => (
                  <option
                    key={segmento}
                    value={segmento}
                  >
                    {segmento}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(e.target.value)
                }
                className="border border-slate-300 rounded-xl px-3 py-2 text-sm w-[110px]"
              >
                <option value="Todos">Todos</option>
                {estadosUnicos.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(e.target.value)
                }
                className="border border-slate-300 rounded-xl px-3 py-2 text-sm w-[110px]"
              >
                <option value="Todos">Todos</option>
                {Object.keys(STATUS_COLORS).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th
                    className="text-left px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100"
                    onClick={() =>
                      alternarOrdenacao("codigo_cliente")
                    }
                  >
                    Cód. ERP{" "}
                    <IconeSort coluna="codigo_cliente" />
                  </th>

                  <th
                    className="text-left px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100"
                    onClick={() =>
                      alternarOrdenacao("segmento")
                    }
                  >
                    Segmento{" "}
                    <IconeSort coluna="segmento" />
                  </th>

                  <th
                    className="text-left px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100"
                    onClick={() =>
                      alternarOrdenacao("cliente_nome")
                    }
                  >
                    Cliente{" "}
                    <IconeSort coluna="cliente_nome" />
                  </th>

                  <th
                    className="text-left px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100"
                    onClick={() =>
                      alternarOrdenacao("cidade")
                    }
                  >
                    Cidade <IconeSort coluna="cidade" />
                  </th>

                  <th
                    className="text-left px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100"
                    onClick={() =>
                      alternarOrdenacao("status")
                    }
                  >
                    Status <IconeSort coluna="status" />
                  </th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr
                    key={cliente.id}
                    onClick={() =>
                      setClienteSelecionado(cliente)
                    }
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {cliente.codigo_cliente || "-"}
                    </td>

                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {cliente.segmento || "-"}
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {cliente.empresa}
                    </td>

                    <td className="px-4 py-3">
                      {cliente.cidade} - {cliente.estado}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center border px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[
                            cliente.status as StatusType
                          ]?.classes ||
                          STATUS_COLORS.Novo.classes
                        }`}
                      >
                        {cliente.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {clienteSelecionado && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setClienteSelecionado(null)}
          />

          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-white bg-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">
                    #{clienteSelecionado.codigo_cliente}
                  </span>

                  <span
                    className={`text-[10px] font-bold border px-2 py-0.5 rounded uppercase tracking-wider ${
                      STATUS_COLORS[
                        clienteSelecionado.status as StatusType
                      ]?.classes ||
                      STATUS_COLORS.Novo.classes
                    }`}
                  >
                    {clienteSelecionado.status}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-slate-900">
                  {clienteSelecionado.empresa}
                </h3>

                <p className="text-sm text-slate-500">
                  {clienteSelecionado.endereco},{" "}
                  {clienteSelecionado.cidade} -{" "}
                  {clienteSelecionado.estado}
                </p>
              </div>

              <button
                onClick={() => setClienteSelecionado(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`https://wa.me/${clienteSelecionado.telefone?.replace(
                      /\D/g,
                      ""
                    )}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl text-sm font-bold transition shadow-sm"
                  >
                    WhatsApp Empresa
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${clienteSelecionado.endereco}, ${clienteSelecionado.cidade} - ${clienteSelecionado.estado}`
                    )}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-sm font-bold transition shadow-sm"
                  >
                    Ver no Mapa
                  </a>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">
                    Informações Adicionais
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase">
                        Razão Social
                      </label>
                      <p className="text-sm font-medium">
                        {clienteSelecionado.razao_social || "-"}
                      </p>
                    </div>
                                    
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase">
                        Segmento de Mercado
                      </label>
                      <p className="text-sm font-medium">
                        {clienteSelecionado.segmento || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">
                    Observações Gerais
                  </h4>

                  <textarea
                    className="w-full border border-slate-200 rounded-2xl p-4 text-sm h-32 focus:ring-2 focus:ring-slate-900 focus:outline-none transition bg-slate-50"
                    placeholder="Anotações sobre a negociação..."
                    defaultValue={
                      clienteSelecionado.observacoes
                    }
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Contatos da Empresa
                  </h4>

                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                    {contatos.length} cadastrados
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={novoContato.nome}
                      onChange={(e) =>
                        setNovoContato({
                          ...novoContato,
                          nome: e.target.value,
                        })
                      }
                      className="border rounded-xl px-3 py-2 text-sm"
                    />

                    <input
                      type="text"
                      placeholder="Cargo"
                      value={novoContato.cargo}
                      onChange={(e) =>
                        setNovoContato({
                          ...novoContato,
                          cargo: e.target.value,
                        })
                      }
                      className="border rounded-xl px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Telefone"
                      value={novoContato.telefone}
                      onChange={(e) =>
                        setNovoContato({
                          ...novoContato,
                          telefone: e.target.value,
                        })
                      }
                      className="border rounded-xl px-3 py-2 text-sm"
                    />

                    <input
                      type="email"
                      placeholder="E-mail"
                      value={novoContato.email}
                      onChange={(e) =>
                        setNovoContato({
                          ...novoContato,
                          email: e.target.value,
                        })
                      }
                      className="border rounded-xl px-3 py-2 text-sm"
                    />
                  </div>

                  <button
                    onClick={handleAdicionarContato}
                    className="w-full bg-slate-900 text-white py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition"
                  >
                    Adicionar Contato
                  </button>
                </div>

                <div className="space-y-3">
                  {carregandoContatos ? (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      Carregando contatos...
                    </div>
                  ) : contatos.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      Nenhum contato cadastrado.
                    </div>
                  ) : (
                    contatos.map((contato) => (
                      <div
                        key={contato.id}
                        className="border border-slate-100 p-4 rounded-2xl hover:border-slate-200 transition bg-white shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900">
                              {contato.nome}
                            </p>

                            <p className="text-[10px] text-slate-400 uppercase font-bold">
                              {contato.cargo || "Contato"}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            {contato.telefone && (
                              <a
                                href={`https://wa.me/${contato.telefone.replace(
                                  /\D/g,
                                  ""
                                )}`}
                                target="_blank"
                                className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition"
                              >
                                📱
                              </a>
                            )}

                            {contato.email && (
                              <a
                                href={`mailto:${contato.email}`}
                                className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition"
                              >
                                ✉️
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function MiniCRM() {
  return (
    <ErrorBoundary>
      <CRMContent />
    </ErrorBoundary>
  );
}
