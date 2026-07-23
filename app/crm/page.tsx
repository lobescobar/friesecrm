'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '../../lib/supabase';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../../hooks/useAuth';
import { useClientes, useFiltragemClientes } from '../../hooks/useClientes';
import { useContatos } from '../../hooks/useContatos';
import { useClienteMontado } from '../../hooks/useClienteMontado';
import { useNavegacaoCRM } from '../../hooks/useNavegacaoCRM';
import { Cliente } from '../../types';
import type { AreaCRM } from '../../types/crmNavegacao';
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
import FunilOrcamentos from '../../components/crm/FunilOrcamentos';
import NavegacaoAreasCRM from '../../components/crm/pagina/NavegacaoAreasCRM';
import { OrcamentoAbertoResumo } from '../../hooks/useOrcamentosAbertos';
import type { ClienteModalSecao } from '../../components/crm/cliente-modal/ClienteModalNav';
import { limparCachesCRM } from '../../utils/sessionCache';

const MapaClientes = dynamic(() => import('../../components/crm/MapaClientes'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
      Carregando mapa...
    </div>
  )
});

function CRMContent() {
  const router = useRouter();
  const clienteMontado = useClienteMontado();

  const {
    navegacaoCRM,
    navegacaoInicialCarregada,
    atualizarParametrosNavegacao,
    resetarNavegacao
  } = useNavegacaoCRM();

  const [areaAtiva, setAreaAtiva] = useState<AreaCRM>('orcamentos');

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
        resetarNavegacao();
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
    orcamentoParametro,
    resetarNavegacao
  ]);

  const sair = async () => {
    resetarNavegacao();
    limparCachesCRM();
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
    resetarNavegacao();
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
          <div
            className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
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
              <div
                className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
                role="status"
              >
                Sincronizando dados em segundo plano...
              </div>
            ) : null}

            {erroClientes ? (
              <div
                className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
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
              <section className="crm-card space-y-4 overflow-hidden rounded-3xl p-2">
                <FunilOrcamentos
                  isAdmin={isAdmin}
                  refreshKey={versaoOrcamentosAbertos}
                />

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
