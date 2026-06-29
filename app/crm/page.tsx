'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '../../lib/supabase';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../../hooks/useAuth';
import { useClientes, useFiltragemClientes } from '../../hooks/useClientes';
import { useContatos } from '../../hooks/useContatos';
import { Cliente } from '../../types';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrmHeader from '../../components/crm/CrmHeader';
import ResumoIndicadores from '../../components/crm/ResumoIndicadores';
import FiltrosClientes from '../../components/crm/FiltrosClientes';
import TabelaClientes from '../../components/crm/TabelaClientes';
import ClienteModal from '../../components/crm/ClienteModal';
import GestaoUsuarios from '../../components/crm/GestaoUsuarios';
import AuditoriaAdmin from '../../components/crm/admin/AuditoriaAdmin';
import AlertaOrcamentosAbertos from '../../components/crm/AlertaOrcamentosAbertos';
import { OrcamentoAbertoResumo } from '../../hooks/useOrcamentosAbertos';
import type { ClienteModalSecao } from '../../components/crm/cliente-modal/ClienteModalNav';

const MapaClientes = dynamic(() => import('../../components/crm/MapaClientes'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
      Carregando mapa...
    </div>
  )
});

const secoesCliente: ClienteModalSecao[] = [
  'dados',
  'contatos',
  'historico',
  'mapa',
  'observacoes'
];

const CHAVE_NAVEGACAO_CRM = 'friese-crm:navegacao-atual';

function assinarMontagemCliente(onStoreChange: () => void) {
  const timeoutId = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(timeoutId);
}

function lerSnapshotClienteMontado() {
  return true;
}

function lerSnapshotServidorMontado() {
  return false;
}

type EstadoNavegacaoCRM = {
  cliente: string | null;
  aba: ClienteModalSecao;
  orcamento: string | null;
};

type AtualizacaoParametros = {
  cliente?: string | null;
  aba?: ClienteModalSecao | null;
  orcamento?: string | null;
};

const navegacaoInicialPadrao: EstadoNavegacaoCRM = {
  cliente: null,
  aba: 'dados',
  orcamento: null
};

function normalizarSecaoCliente(valor: string | null): ClienteModalSecao {
  if (secoesCliente.includes(valor as ClienteModalSecao)) {
    return valor as ClienteModalSecao;
  }

  return 'dados';
}

function normalizarNavegacao(
  navegacao: Partial<EstadoNavegacaoCRM> | null | undefined
): EstadoNavegacaoCRM {
  return {
    cliente: navegacao?.cliente || null,
    aba: normalizarSecaoCliente(navegacao?.aba || null),
    orcamento: navegacao?.orcamento || null
  };
}

function lerNavegacaoDaUrl(): EstadoNavegacaoCRM {
  if (typeof window === 'undefined') {
    return navegacaoInicialPadrao;
  }

  const parametros = new URLSearchParams(window.location.search);

  return normalizarNavegacao({
    cliente: parametros.get('cliente'),
    aba: normalizarSecaoCliente(parametros.get('aba')),
    orcamento: parametros.get('orcamento')
  });
}

function lerNavegacaoSalva(): EstadoNavegacaoCRM {
  if (typeof window === 'undefined') {
    return navegacaoInicialPadrao;
  }

  try {
    const valorSalvo = window.sessionStorage.getItem(CHAVE_NAVEGACAO_CRM);

    if (!valorSalvo) {
      return navegacaoInicialPadrao;
    }

    const dados = JSON.parse(valorSalvo) as Partial<EstadoNavegacaoCRM>;
    return normalizarNavegacao(dados);
  } catch (erro) {
    console.warn('Não foi possível ler navegação salva do CRM:', erro);
    return navegacaoInicialPadrao;
  }
}

function salvarNavegacao(navegacao: EstadoNavegacaoCRM) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!navegacao.cliente) {
    window.sessionStorage.removeItem(CHAVE_NAVEGACAO_CRM);
    return;
  }

  window.sessionStorage.setItem(CHAVE_NAVEGACAO_CRM, JSON.stringify(navegacao));
}

function limparNavegacaoSalva() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(CHAVE_NAVEGACAO_CRM);
}

function temParametrosDeNavegacaoNaUrl() {
  if (typeof window === 'undefined') {
    return false;
  }

  const parametros = new URLSearchParams(window.location.search);

  return (
    parametros.has('cliente') ||
    parametros.has('aba') ||
    parametros.has('orcamento')
  );
}

function lerNavegacaoInicial(): EstadoNavegacaoCRM {
  if (typeof window === 'undefined') {
    return navegacaoInicialPadrao;
  }

  const navegacaoUrl = lerNavegacaoDaUrl();

  if (navegacaoUrl.cliente || temParametrosDeNavegacaoNaUrl()) {
    return navegacaoUrl;
  }

  const navegacaoSalva = lerNavegacaoSalva();

  if (navegacaoSalva.cliente) {
    return navegacaoSalva;
  }

  return navegacaoInicialPadrao;
}

function escreverNavegacaoNaUrl(navegacao: EstadoNavegacaoCRM) {
  if (typeof window === 'undefined') {
    return;
  }

  const parametrosAtuais = new URLSearchParams(window.location.search);

  if (navegacao.cliente) {
    parametrosAtuais.set('cliente', navegacao.cliente);
    parametrosAtuais.set('aba', navegacao.aba);

    if (navegacao.orcamento) {
      parametrosAtuais.set('orcamento', navegacao.orcamento);
    } else {
      parametrosAtuais.delete('orcamento');
    }
  } else {
    parametrosAtuais.delete('cliente');
    parametrosAtuais.delete('aba');
    parametrosAtuais.delete('orcamento');
  }

  const query = parametrosAtuais.toString();
  const destino = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  const atual = `${window.location.pathname}${window.location.search}`;

  if (destino !== atual) {
    window.history.replaceState(null, '', destino);
  }
}

function navegacoesIguais(
  atual: EstadoNavegacaoCRM,
  proxima: EstadoNavegacaoCRM
) {
  return (
    atual.cliente === proxima.cliente &&
    atual.aba === proxima.aba &&
    atual.orcamento === proxima.orcamento
  );
}

type AreaCRM =
  | 'orcamentos'
  | 'clientes'
  | 'mapa'
  | 'administracao'
  | 'auditoria';

type AreaNavegacaoCRM = {
  id: AreaCRM;
  titulo: string;
  descricao: string;
  adminOnly?: boolean;
};

const areasCRM: AreaNavegacaoCRM[] = [
  {
    id: 'orcamentos',
    titulo: 'Orçamentos',
    descricao: 'Abertos'
  },
  {
    id: 'clientes',
    titulo: 'Clientes',
    descricao: 'Filtros e cadastro'
  },
  {
    id: 'mapa',
    titulo: 'Mapa',
    descricao: 'Localização'
  },
  {
    id: 'administracao',
    titulo: 'Administração',
    descricao: 'Usuários',
    adminOnly: true
  },
  {
    id: 'auditoria',
    titulo: 'Auditoria',
    descricao: 'Registros',
    adminOnly: true
  }
];

function NavegacaoAreasCRM({
  areaAtiva,
  isAdmin,
  onChange
}: {
  areaAtiva: AreaCRM;
  isAdmin: boolean;
  onChange: (area: AreaCRM) => void;
}) {
  const areasVisiveis = areasCRM.filter((area) => !area.adminOnly || isAdmin);

  return (
    <nav
      aria-label="Áreas do CRM"
      className="crm-card mb-4 rounded-3xl p-3"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {areasVisiveis.map((area) => {
          const ativa = areaAtiva === area.id;

          return (
            <button
              key={area.id}
              type="button"
              onClick={() => onChange(area.id)}
              aria-current={ativa ? 'page' : undefined}
              className={`min-h-20 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                ativa
                  ? 'border-[#c58a2a] bg-[#fff7e8] text-slate-950 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-extrabold">
                {area.titulo}
              </span>
              <span className="mt-1 block text-xs font-medium text-slate-500">
                {area.descricao}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function CRMContent() {
  const router = useRouter();
  const clienteMontado = useSyncExternalStore(
    assinarMontagemCliente,
    lerSnapshotClienteMontado,
    lerSnapshotServidorMontado
  );

  const [navegacaoCRM, setNavegacaoCRM] =
    useState<EstadoNavegacaoCRM>(navegacaoInicialPadrao);
  const [navegacaoInicialCarregada, setNavegacaoInicialCarregada] = useState(false);
  const navegacaoCRMRef = useRef<EstadoNavegacaoCRM>(navegacaoCRM);
  const [areaAtiva, setAreaAtiva] = useState<AreaCRM>('orcamentos');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNavegacaoCRM(lerNavegacaoInicial());
      setNavegacaoInicialCarregada(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    navegacaoCRMRef.current = navegacaoCRM;

    if (!navegacaoInicialCarregada) {
      return;
    }

    if (navegacaoCRM.cliente) {
      salvarNavegacao(navegacaoCRM);
    }
  }, [navegacaoCRM, navegacaoInicialCarregada]);

  const clienteParametro = navegacaoCRM.cliente;
  const secaoParametro = navegacaoCRM.aba;
  const orcamentoParametro = navegacaoCRM.orcamento;

  const {
    user,
    profile,
    loading: verificandoLogin,
    error: erroAuth,
    isAdmin
  } = useAuth();

  const {
    clientes,
    loading: carregandoClientes,
    error: erroClientes,
    carregarClientes,
    atualizarCliente
  } = useClientes(profile);

  const {
    buscaEmpresa,
    setBuscaEmpresa,
    buscaCodigo,
    setBuscaCodigo,
    filtroStatus,
    setFiltroStatus,
    filtroEstado,
    setFiltroEstado,
    filtroSegmento,
    setFiltroSegmento,
    ordenacao,
    alternarOrdenacao,
    clientesFiltrados,
    estadosUnicos,
    segmentosUnicos,
    filtrosAtivos,
    limparFiltros
  } = useFiltragemClientes(clientes);

  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [historicoInicialAberto, setHistoricoInicialAberto] = useState(false);
  const [orcamentoHistoricoFoco, setOrcamentoHistoricoFoco] = useState<string | null>(null);
  const [versaoOrcamentosAbertos, setVersaoOrcamentosAbertos] = useState(0);

  const {
    contatos,
    carregarContatos,
    adicionarContato,
    atualizarContato,
    excluirContato,
    loading: carregandoContatos,
    error: erroContatos
  } = useContatos();

  const possuiClientesEmTela = clientes.length > 0;
  const carregamentoInicialClientes = carregandoClientes && !possuiClientesEmTela;
  const atualizandoClientesEmSegundoPlano = carregandoClientes && possuiClientesEmTela;
  const erroBloqueanteClientes = Boolean(erroClientes) && !possuiClientesEmTela;

  const atualizarParametrosNavegacao = useCallback(
    (atualizacoes: AtualizacaoParametros) => {
      const navegacaoAtual = lerNavegacaoDaUrl();

      const proximaNavegacao = normalizarNavegacao({
        cliente:
          atualizacoes.cliente !== undefined
            ? atualizacoes.cliente
            : navegacaoAtual.cliente,
        aba:
          atualizacoes.aba !== undefined
            ? atualizacoes.aba || 'dados'
            : navegacaoAtual.aba,
        orcamento:
          atualizacoes.orcamento !== undefined
            ? atualizacoes.orcamento
            : navegacaoAtual.orcamento
      });

      escreverNavegacaoNaUrl(proximaNavegacao);
      salvarNavegacao(proximaNavegacao);
      setNavegacaoCRM(proximaNavegacao);
    },
    []
  );

  useEffect(() => {
    if (!verificandoLogin && !profile) {
      router.push('/login');
    }
  }, [verificandoLogin, profile, router]);

  useEffect(() => {
    if (clienteSelecionado?.id) {
      carregarContatos(clienteSelecionado.id);
    }
  }, [clienteSelecionado?.id, carregarContatos]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const salvarEstadoAtualDaTela = () => {
      const navegacaoAtual = navegacaoCRMRef.current;

      if (navegacaoAtual.cliente) {
        salvarNavegacao(navegacaoAtual);
      }
    };

    const restaurarNavegacaoSalva = () => {
      const navegacaoUrl = lerNavegacaoDaUrl();
      const temNavegacaoUrl = navegacaoUrl.cliente || temParametrosDeNavegacaoNaUrl();
      const navegacaoRestaurada = temNavegacaoUrl
        ? navegacaoUrl
        : lerNavegacaoSalva();

      if (!navegacaoRestaurada.cliente) {
        return;
      }

      if (!temNavegacaoUrl) {
        escreverNavegacaoNaUrl(navegacaoRestaurada);
      }

      salvarNavegacao(navegacaoRestaurada);

      if (!navegacoesIguais(navegacaoCRMRef.current, navegacaoRestaurada)) {
        setNavegacaoCRM(navegacaoRestaurada);
      }
    };

    const aoMudarVisibilidade = () => {
      if (document.hidden) {
        salvarEstadoAtualDaTela();
        return;
      }

      window.setTimeout(restaurarNavegacaoSalva, 0);
    };

    const aoMostrarPagina = () => {
      window.setTimeout(restaurarNavegacaoSalva, 0);
    };

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.addEventListener('blur', salvarEstadoAtualDaTela);
    window.addEventListener('pagehide', salvarEstadoAtualDaTela);
    window.addEventListener('focus', aoMostrarPagina);
    window.addEventListener('pageshow', aoMostrarPagina);
    document.addEventListener('visibilitychange', aoMudarVisibilidade);

    return () => {
      window.removeEventListener('blur', salvarEstadoAtualDaTela);
      window.removeEventListener('pagehide', salvarEstadoAtualDaTela);
      window.removeEventListener('focus', aoMostrarPagina);
      window.removeEventListener('pageshow', aoMostrarPagina);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    };
  }, []);

  useEffect(() => {
    if (carregandoClientes) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (!clienteParametro) {
        setClienteSelecionado(null);
        setHistoricoInicialAberto(false);
        setOrcamentoHistoricoFoco(null);
        return;
      }

      const clienteEncontrado = clientes.find(
        (cliente) => cliente.id === clienteParametro
      );

      if (!clienteEncontrado && clientes.length === 0) {
        return;
      }

      if (!clienteEncontrado) {
        limparNavegacaoSalva();
        escreverNavegacaoNaUrl(navegacaoInicialPadrao);
        setNavegacaoCRM(navegacaoInicialPadrao);
        setClienteSelecionado(null);
        setHistoricoInicialAberto(false);
        setOrcamentoHistoricoFoco(null);
        return;
      }

      setClienteSelecionado(clienteEncontrado);
      setHistoricoInicialAberto(
        secaoParametro === 'historico' || Boolean(orcamentoParametro)
      );
      setOrcamentoHistoricoFoco(orcamentoParametro);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    carregandoClientes,
    clientes,
    clienteParametro,
    secaoParametro,
    orcamentoParametro
  ]);

  const sair = async () => {
    limparNavegacaoSalva();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const atualizarClienteSelecionado = async (
    id: string,
    dados: Partial<Cliente>
  ) => {
    const atualizado = await atualizarCliente(id, dados);
    setClienteSelecionado((atual) =>
      atual?.id === id ? { ...atual, ...atualizado } : atual
    );
    return atualizado;
  };

  const atualizarAlertaOrcamentosAbertos = () => {
    setVersaoOrcamentosAbertos((versaoAtual) => versaoAtual + 1);
  };

  const selecionarCliente = (cliente: Cliente) => {
    setHistoricoInicialAberto(false);
    setOrcamentoHistoricoFoco(null);
    setClienteSelecionado(cliente);
    atualizarParametrosNavegacao({
      cliente: cliente.id,
      aba: 'dados',
      orcamento: null
    });
  };

  const abrirHistoricoPorOrcamentoAberto = (orcamento: OrcamentoAbertoResumo) => {
    if (!orcamento.cliente_id) {
      return;
    }

    const cliente = clientes.find((item) => item.id === orcamento.cliente_id);

    if (!cliente) {
      return;
    }

    setHistoricoInicialAberto(true);
    setOrcamentoHistoricoFoco(orcamento.numero_orcamento);
    setClienteSelecionado(cliente);
    atualizarParametrosNavegacao({
      cliente: cliente.id,
      aba: 'historico',
      orcamento: orcamento.numero_orcamento
    });
  };

  const alterarSecaoCliente = (secao: ClienteModalSecao) => {
    setHistoricoInicialAberto(secao === 'historico');

    if (secao !== 'historico') {
      setOrcamentoHistoricoFoco(null);
    }

    atualizarParametrosNavegacao({
      aba: secao,
      orcamento: secao === 'historico' ? orcamentoHistoricoFoco : null
    });
  };

  const alterarOrcamentoHistorico = (numeroOrcamento: string | null) => {
    setHistoricoInicialAberto(true);
    setOrcamentoHistoricoFoco(numeroOrcamento);

    atualizarParametrosNavegacao({
      aba: 'historico',
      orcamento: numeroOrcamento
    });
  };

  const fecharClienteSelecionado = () => {
    setClienteSelecionado(null);
    setHistoricoInicialAberto(false);
    setOrcamentoHistoricoFoco(null);
    limparNavegacaoSalva();
    atualizarParametrosNavegacao({
      cliente: null,
      aba: null,
      orcamento: null
    });
  };

  if (!clienteMontado || !navegacaoInicialCarregada || verificandoLogin) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-xl">
          <LoadingSpinner label="Iniciando sistema..." />
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <CrmHeader
          isAdmin={isAdmin}
          usuarioEmail={user?.email}
          onImportacaoSucesso={carregarClientes}
          onImportacaoOrcamentosSucesso={atualizarAlertaOrcamentosAbertos}
          onSair={sair}
        />

        {erroAuth ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erroAuth}
          </div>
        ) : null}

        {carregamentoInicialClientes ? (
          <div className="space-y-4">
            <LoadingSpinner label="Carregando clientes..." />
            <div className="grid gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          </div>
        ) : erroBloqueanteClientes ? (
          <EmptyState
            title="Não foi possível carregar os clientes"
            description={erroClientes || 'Erro ao carregar clientes.'}
            action={
              <Button type="button" onClick={carregarClientes}>
                Tentar novamente
              </Button>
            }
          />
        ) : (
          <>
            {atualizandoClientesEmSegundoPlano ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Sincronizando dados em segundo plano...
              </div>
            ) : null}

            {erroClientes ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Não foi possível atualizar os clientes agora. Os dados em tela foram mantidos.
              </div>
            ) : null}

            <NavegacaoAreasCRM
              areaAtiva={
                !isAdmin &&
                (areaAtiva === 'administracao' || areaAtiva === 'auditoria')
                  ? 'orcamentos'
                  : areaAtiva
              }
              isAdmin={isAdmin}
              onChange={setAreaAtiva}
            />

            {areaAtiva === 'clientes' ? (
              <div className="space-y-4">
                <ResumoIndicadores
                  clientes={clientes}
                  clientesFiltrados={clientesFiltrados}
                />

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <FiltrosClientes
                    buscaEmpresa={buscaEmpresa}
                    setBuscaEmpresa={setBuscaEmpresa}
                    buscaCodigo={buscaCodigo}
                    setBuscaCodigo={setBuscaCodigo}
                    filtroStatus={filtroStatus}
                    setFiltroStatus={setFiltroStatus}
                    filtroEstado={filtroEstado}
                    setFiltroEstado={setFiltroEstado}
                    filtroSegmento={filtroSegmento}
                    setFiltroSegmento={setFiltroSegmento}
                    estadosUnicos={estadosUnicos}
                    segmentosUnicos={segmentosUnicos}
                    filtrosAtivos={filtrosAtivos}
                    totalClientes={clientes.length}
                    totalFiltrado={clientesFiltrados.length}
                    onLimparFiltros={limparFiltros}
                  />

                  <TabelaClientes
                    clientes={clientesFiltrados}
                    totalClientes={clientes.length}
                    ordenacao={ordenacao}
                    onOrdenar={alternarOrdenacao}
                    onSelecionarCliente={selecionarCliente}
                    onLimparFiltros={limparFiltros}
                  />
                </section>
              </div>
            ) : null}

            {areaAtiva === 'mapa' ? (
              <section className="crm-card overflow-hidden rounded-3xl p-3 sm:p-4">
                <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white sm:h-[520px]">
                  <MapaClientes
                    clientes={clientesFiltrados}
                    clienteSelecionadoId={clienteSelecionado?.id}
                    onSelecionarCliente={selecionarCliente}
                  />
                </div>
              </section>
            ) : null}

            {(areaAtiva === 'orcamentos' ||
              (!isAdmin &&
                (areaAtiva === 'administracao' || areaAtiva === 'auditoria'))) ? (
              <section className="crm-card overflow-hidden rounded-3xl p-4">
                <AlertaOrcamentosAbertos
                  refreshKey={versaoOrcamentosAbertos}
                  mostrarVazio
                  onSelecionarOrcamento={abrirHistoricoPorOrcamentoAberto}
                />
              </section>
            ) : null}

            {isAdmin && areaAtiva === 'administracao' ? (
              <section className="space-y-4">
                <GestaoUsuarios
                  segmentosDisponiveis={segmentosUnicos}
                  estadosDisponiveis={estadosUnicos}
                />
              </section>
            ) : null}

            {isAdmin && areaAtiva === 'auditoria' ? (
              <section className="space-y-4">
                <AuditoriaAdmin />
              </section>
            ) : null}
          </>
        )}
      </div>

      {clienteSelecionado ? (
        <ClienteModal
          key={clienteSelecionado.id}
          cliente={clienteSelecionado}
          contatos={contatos}
          carregandoContatos={carregandoContatos}
          erroContatos={erroContatos}
          historicoInicialAberto={historicoInicialAberto}
          orcamentoHistoricoFoco={orcamentoHistoricoFoco}
          secaoInicial={secaoParametro}
          onSecaoChange={alterarSecaoCliente}
          onOrcamentoHistoricoChange={alterarOrcamentoHistorico}
          onClose={fecharClienteSelecionado}
          onAtualizarCliente={atualizarClienteSelecionado}
          onAdicionarContato={adicionarContato}
          onAtualizarContato={atualizarContato}
          onExcluirContato={excluirContato}
        />
      ) : null}
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