'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { MetaComercial, Profile } from '../../../types';
import Button from '../../ui/Button';

type MetaFormulario = Record<string, string>;

const MESES = [
  { valor: 1, nome: 'Janeiro' },
  { valor: 2, nome: 'Fevereiro' },
  { valor: 3, nome: 'Março' },
  { valor: 4, nome: 'Abril' },
  { valor: 5, nome: 'Maio' },
  { valor: 6, nome: 'Junho' },
  { valor: 7, nome: 'Julho' },
  { valor: 8, nome: 'Agosto' },
  { valor: 9, nome: 'Setembro' },
  { valor: 10, nome: 'Outubro' },
  { valor: 11, nome: 'Novembro' },
  { valor: 12, nome: 'Dezembro' }
];

function obterAnoAtual() {
  return new Date().getFullYear();
}

function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
}

function converterValorMeta(valor: string) {
  const normalizado = valor.trim().replace(/\./g, '').replace(',', '.');
  const numero = Number(normalizado);

  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

function montarAnosDisponiveis() {
  const anoAtual = obterAnoAtual();

  return Array.from({ length: 7 }, (_, indice) => anoAtual - 2 + indice);
}

export default function MetasComerciaisAdmin() {
  const [vendedores, setVendedores] = useState<Profile[]>([]);
  const [metas, setMetas] = useState<MetaFormulario>({});
  const [ano, setAno] = useState(obterAnoAtual());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const anosDisponiveis = useMemo(() => montarAnosDisponiveis(), []);

  const metaGlobal = useMemo(() => {
    return vendedores.reduce((total, vendedor) => {
      return total + converterValorMeta(metas[normalizarEmail(vendedor.email)] || '');
    }, 0);
  }, [metas, vendedores]);

  async function carregarMetas() {
    setLoading(true);
    setMensagem(null);

    const [usuariosResultado, metasResultado] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,email,role,segmentos_permitidos,estados_permitidos,created_at,updated_at')
        .eq('role', 'vendedor')
        .order('email', { ascending: true }),
      supabase
        .from('metas_comerciais')
        .select('*')
        .eq('ano', ano)
        .eq('mes', mes)
    ]);

    if (usuariosResultado.error) {
      setMensagem(`Erro ao carregar vendedores: ${usuariosResultado.error.message}`);
      setVendedores([]);
      setMetas({});
      setLoading(false);
      return;
    }

    if (metasResultado.error) {
      setMensagem(`Erro ao carregar metas: ${metasResultado.error.message}`);
      setVendedores((usuariosResultado.data || []) as Profile[]);
      setMetas({});
      setLoading(false);
      return;
    }

    const vendedoresCarregados = (usuariosResultado.data || []) as Profile[];
    const metasCarregadas = (metasResultado.data || []) as MetaComercial[];
    const metasPorEmail: MetaFormulario = {};

    vendedoresCarregados.forEach((vendedor) => {
      metasPorEmail[normalizarEmail(vendedor.email)] = '';
    });

    metasCarregadas.forEach((meta) => {
      metasPorEmail[normalizarEmail(meta.vendedor_email)] = String(
        Number(meta.valor_meta || 0)
      );
    });

    setVendedores(vendedoresCarregados);
    setMetas(metasPorEmail);
    setLoading(false);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarMetas();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [ano, mes]);

  async function salvarMetas() {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setMensagem('Sessão expirada. Faça login novamente.');
      return;
    }

    setSalvando(true);
    setMensagem('Salvando metas comerciais...');

    const registros = vendedores.map((vendedor) => {
      const vendedorEmail = normalizarEmail(vendedor.email);

      return {
        vendedor_email: vendedorEmail,
        ano,
        mes,
        valor_meta: converterValorMeta(metas[vendedorEmail] || ''),
        criado_por: user.id,
        atualizado_por: user.id
      };
    });

    const { error } = await supabase
      .from('metas_comerciais')
      .upsert(registros, {
        onConflict: 'vendedor_email,ano,mes'
      });

    if (error) {
      setMensagem(`Erro ao salvar metas: ${error.message}`);
      setSalvando(false);
      return;
    }

    setMensagem('Metas comerciais salvas com sucesso.');
    setSalvando(false);
    await carregarMetas();
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border bg-white shadow-sm"
      aria-labelledby="metas-comerciais-titulo"
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="metas-comerciais-titulo" className="text-lg font-bold">
            Metas comerciais
          </h2>
          <p className="text-sm text-slate-500">
            Valor manual por vendedor. O realizado usa vendas fechadas pelos estados da alçada.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[110px_150px_auto] sm:items-end">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Ano
            </span>
            <select
              value={ano}
              onChange={(event) => setAno(Number(event.target.value))}
              className="h-[30px] w-full rounded-lg border border-slate-300 bg-white px-[10px] py-0 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              aria-label="Ano da meta comercial"
            >
              {anosDisponiveis.map((anoOpcao) => (
                <option key={anoOpcao} value={anoOpcao}>
                  {anoOpcao}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Mês
            </span>
            <select
              value={mes}
              onChange={(event) => setMes(Number(event.target.value))}
              className="h-[30px] w-full rounded-lg border border-slate-300 bg-white px-[10px] py-0 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              aria-label="Mês da meta comercial"
            >
              {MESES.map((mesOpcao) => (
                <option key={mesOpcao.valor} value={mesOpcao.valor}>
                  {mesOpcao.nome}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            size="sm"
            onClick={salvarMetas}
            loading={salvando}
            loadingText="Salvando..."
            disabled={loading || vendedores.length === 0}
          >
            Salvar metas
          </Button>
        </div>
      </div>

      {mensagem ? (
        <div
          className="mx-6 mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
          role={
            mensagem.toLowerCase().includes('erro') ||
            mensagem.toLowerCase().includes('expirada')
              ? 'alert'
              : 'status'
          }
          aria-live="polite"
        >
          {mensagem}
        </div>
      ) : null}

      <div className="grid gap-3 border-b border-slate-100 px-6 py-4 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Meta global
          </p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">
            {formatarMoeda(metaGlobal)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Vendedores
          </p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">
            {vendedores.length}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Período
          </p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">
            {String(mes).padStart(2, '0')}/{ano}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="px-6 py-4 text-sm text-slate-500" role="status">
          Carregando metas comerciais...
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Metas comerciais por vendedor, estados da alçada e valor mensal.
            </caption>
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold">
                  Vendedor
                </th>
                <th scope="col" className="px-6 py-3 text-left font-semibold">
                  Estados da alçada
                </th>
                <th scope="col" className="px-6 py-3 text-right font-semibold">
                  Meta
                </th>
              </tr>
            </thead>
            <tbody>
              {vendedores.map((vendedor) => {
                const vendedorEmail = normalizarEmail(vendedor.email);

                return (
                  <tr
                    key={vendedor.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {vendedor.email}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {vendedor.estados_permitidos?.length
                        ? vendedor.estados_permitidos.join(', ')
                        : 'Todos'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={metas[vendedorEmail] || ''}
                        onChange={(event) =>
                          setMetas((metasAtuais) => ({
                            ...metasAtuais,
                            [vendedorEmail]: event.target.value
                          }))
                        }
                        className="h-[34px] w-40 rounded-lg border border-slate-300 px-3 text-right text-sm font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        aria-label={`Meta de ${vendedor.email}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {vendedores.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500">
              Nenhum vendedor cadastrado.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
