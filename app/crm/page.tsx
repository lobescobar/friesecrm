'use client';

import { useEffect, useState } from 'react';
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
  const { user, profile, loading: verificandoLogin, error: erroAuth, isAdmin } = useAuth();
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

  const {
    contatos,
    carregarContatos,
    adicionarContato,
    atualizarContato,
    excluirContato,
    loading: carregandoContatos,
    error: erroContatos
  } = useContatos();

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

  const sair = async () => {
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

  if (verificandoLogin) {
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
          onSair={sair}
        />

        {erroAuth ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erroAuth}
          </div>
        ) : null}

        {carregandoClientes ? (
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
        ) : erroClientes ? (
          <EmptyState
            title="Não foi possível carregar os clientes"
            description={erroClientes}
            action={
              <Button type="button" onClick={carregarClientes}>
                Tentar novamente
              </Button>
            }
          />
        ) : (
          <>
            <ResumoIndicadores
              clientes={clientes}
              clientesFiltrados={clientesFiltrados}
            />

            <section className="mb-4 h-[420px] overflow-hidden rounded-2xl border bg-white p-3 shadow-sm">
              <MapaClientes
                clientes={clientesFiltrados}
                clienteSelecionadoId={clienteSelecionado?.id}
                onSelecionarCliente={setClienteSelecionado}
              />
            </section>

            {isAdmin ? (
              <GestaoUsuarios
                segmentosDisponiveis={segmentosUnicos}
                estadosDisponiveis={estadosUnicos}
              />
            ) : null}

            <section className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
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
                onSelecionarCliente={setClienteSelecionado}
                onLimparFiltros={limparFiltros}
              />
            </section>
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
          onClose={() => setClienteSelecionado(null)}
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
