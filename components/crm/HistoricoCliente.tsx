'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useHistoricoCliente } from '../../hooks/useHistoricoCliente';
import { useInteracoesOrcamento } from '../../hooks/useInteracoesOrcamento';
import type {
  ColunaOrdenacao,
  DirecaoOrdenacao,
  HistoricoOrcamentoAgrupado,
  StatusFiltro
} from '../../types/historico';
import { MESES_HISTORICO_ORCAMENTOS } from '../../utils/constants';
import {
  agruparPorNumeroPrincipal,
  ordenarHistorico,
  rotulosOrdenacao
} from '../../utils/historicoOrcamentos';
import {
  buscarEmailCancelamentoConfigurado,
  montarUrlEmailCancelamento,
  obterEmailCancelamentoFallback
} from '../../utils/cancelamentoOrcamentos';
import LoadingSpinner from '../ui/LoadingSpinner';
import HistoricoFiltros from './historico/HistoricoFiltros';
import HistoricoResumoCards from './historico/HistoricoResumoCards';
import ModalCancelamentoOrcamento from './historico/ModalCancelamentoOrcamento';
import ModalHistoricoOrcamento from './historico/ModalHistoricoOrcamento';
import ModalItensOrcamento from './historico/ModalItensOrcamento';
import TabelaHistoricoOrcamentos from './historico/TabelaHistoricoOrcamentos';

type HistoricoClienteProps = {
  clienteId: string;
  aberto: boolean;
  clienteSegmento?: string | null;
  orcamentoFocoInicial?: string | null;
  onOrcamentoDetalheChange?: (numeroOrcamento: string | null) => void;
};

export default function HistoricoCliente({
  clienteId,
  aberto,
  clienteSegmento,
  orcamentoFocoInicial = null,
  onOrcamentoDetalheChange
}: HistoricoClienteProps) {
  const { historico, loading, error } = useHistoricoCliente(clienteId, aberto);
  const { user, profile } = useAuth();

  const usuarioEmail = profile?.email || user?.email || null;

  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('todos');
  const [colunaOrdenacao, setColunaOrdenacao] =
    useState<ColunaOrdenacao>('data_emissao');
  const [direcaoOrdenacao, setDirecaoOrdenacao] =
    useState<DirecaoOrdenacao>('desc');
  const [orcamentoDetalhado, setOrcamentoDetalhado] =
    useState<HistoricoOrcamentoAgrupado | null>(null);
  const [orcamentoCancelamento, setOrcamentoCancelamento] =
    useState<HistoricoOrcamentoAgrupado | null>(null);
  const [orcamentoHistoricoManual, setOrcamentoHistoricoManual] =
    useState<HistoricoOrcamentoAgrupado | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [erroCancelamento, setErroCancelamento] = useState<string | null>(null);
  const [mensagemCancelamento, setMensagemCancelamento] = useState<string | null>(
    null
  );
  const [emailCancelamento, setEmailCancelamento] = useState(
    obterEmailCancelamentoFallback(clienteSegmento)
  );

  const {
    interacoesOrcamento,
    formularioInteracao,
    setFormularioInteracao,
    carregandoInteracoes,
    salvandoInteracao,
    erroInteracao,
    mensagemInteracao,
    carregarInteracoesOrcamento,
    limparInteracoesOrcamento,
    salvarInteracaoOrcamento
  } = useInteracoesOrcamento({
    clienteId,
    usuarioId: user?.id || null,
    usuarioEmail
  });

  const orcamentoDetalhadoRef =
    useRef<HistoricoOrcamentoAgrupado | null>(null);
  const historicoAgrupadoRef = useRef<HistoricoOrcamentoAgrupado[]>([]);
  const orcamentoFocoInicialRef = useRef<string | null>(orcamentoFocoInicial);

  const historicoAgrupado = useMemo(
    () => agruparPorNumeroPrincipal(historico),
    [historico]
  );

  const historicoFiltradoOrdenado = useMemo(() => {
    const filtrado =
      statusFiltro === 'todos'
        ? historicoAgrupado
        : historicoAgrupado.filter((item) => item.status === statusFiltro);

    return ordenarHistorico(filtrado, colunaOrdenacao, direcaoOrdenacao);
  }, [historicoAgrupado, statusFiltro, colunaOrdenacao, direcaoOrdenacao]);

  const resumo = useMemo(() => {
    return {
      total: historicoAgrupado.length,
      abertos: historicoAgrupado.filter((item) => item.status === 'A').length,
      fechados: historicoAgrupado.filter((item) => item.status === 'B').length,
      cancelados: historicoAgrupado.filter((item) => item.status === 'C').length
    };
  }, [historicoAgrupado]);

  useEffect(() => {
    let ativo = true;

    async function carregarEmailCancelamento() {
      const fallback = obterEmailCancelamentoFallback(clienteSegmento);
      setEmailCancelamento(fallback);

      const emailConfigurado = await buscarEmailCancelamentoConfigurado(
        clienteSegmento
      );

      if (ativo) {
        setEmailCancelamento(emailConfigurado);
      }
    }

    void carregarEmailCancelamento();

    return () => {
      ativo = false;
    };
  }, [clienteSegmento]);

  useEffect(() => {
    historicoAgrupadoRef.current = historicoAgrupado;
  }, [historicoAgrupado]);

  useEffect(() => {
    orcamentoDetalhadoRef.current = orcamentoDetalhado;
  }, [orcamentoDetalhado]);

  useEffect(() => {
    orcamentoFocoInicialRef.current = orcamentoFocoInicial;
  }, [orcamentoFocoInicial]);

  useEffect(() => {
    if (!orcamentoFocoInicial) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const orcamentoEncontrado = historicoAgrupado.find(
        (item) => item.numero_orcamento === orcamentoFocoInicial
      );

      if (!orcamentoEncontrado) {
        return;
      }

      setOrcamentoDetalhado((atual) =>
        atual?.numero_orcamento === orcamentoEncontrado.numero_orcamento
          ? atual
          : orcamentoEncontrado
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [historicoAgrupado, orcamentoFocoInicial]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const restaurarDetalheDoOrcamento = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      const numeroOrcamento = orcamentoFocoInicialRef.current;

      if (!numeroOrcamento || orcamentoDetalhadoRef.current) {
        return;
      }

      const orcamentoEncontrado = historicoAgrupadoRef.current.find(
        (item) => item.numero_orcamento === numeroOrcamento
      );

      if (orcamentoEncontrado) {
        setOrcamentoDetalhado(orcamentoEncontrado);
      }
    };

    const aoVoltarParaPagina = () => {
      window.setTimeout(restaurarDetalheDoOrcamento, 0);
    };

    const aoMudarVisibilidade = () => {
      if (!document.hidden) {
        aoVoltarParaPagina();
      }
    };

    window.addEventListener('focus', aoVoltarParaPagina);
    window.addEventListener('pageshow', aoVoltarParaPagina);
    document.addEventListener('visibilitychange', aoMudarVisibilidade);

    return () => {
      window.removeEventListener('focus', aoVoltarParaPagina);
      window.removeEventListener('pageshow', aoVoltarParaPagina);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    };
  }, []);

  const alternarOrdenacao = (coluna: ColunaOrdenacao) => {
    if (colunaOrdenacao === coluna) {
      setDirecaoOrdenacao((direcaoAtual) =>
        direcaoAtual === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setColunaOrdenacao(coluna);
    setDirecaoOrdenacao(coluna.includes('data') ? 'desc' : 'asc');
  };

  const abrirDetalhes = (item: HistoricoOrcamentoAgrupado) => {
    setOrcamentoDetalhado(item);
    onOrcamentoDetalheChange?.(item.numero_orcamento);
  };

  const fecharDetalhes = () => {
    setOrcamentoDetalhado(null);
    onOrcamentoDetalheChange?.(null);
  };

  const abrirHistoricoManual = (item: HistoricoOrcamentoAgrupado) => {
    setOrcamentoHistoricoManual(item);
    limparInteracoesOrcamento();
    void carregarInteracoesOrcamento(item);
  };

  const fecharHistoricoManual = () => {
    setOrcamentoHistoricoManual(null);
    limparInteracoesOrcamento();
  };

  const salvarHistoricoManual = () => {
    void salvarInteracaoOrcamento(
      orcamentoHistoricoManual,
      formularioInteracao
    );
  };

  const abrirSolicitacaoCancelamento = (item: HistoricoOrcamentoAgrupado) => {
    setOrcamentoCancelamento(item);
    setMotivoCancelamento('');
    setErroCancelamento(null);
    setMensagemCancelamento(null);
  };

  const fecharSolicitacaoCancelamento = () => {
    setOrcamentoCancelamento(null);
    setMotivoCancelamento('');
    setErroCancelamento(null);
  };

  const confirmarSolicitacaoCancelamento = () => {
    if (!orcamentoCancelamento) return;

    const motivo = motivoCancelamento.trim();

    if (motivo.length < 5) {
      setErroCancelamento(
        'Informe um motivo com pelo menos 5 caracteres para solicitar o cancelamento.'
      );
      return;
    }

    const solicitante = usuarioEmail || 'Usuário não identificado no CRM';

    window.location.href = montarUrlEmailCancelamento({
      numeroOrcamento: orcamentoCancelamento.numero_orcamento,
      solicitante,
      motivo,
      destinatario: emailCancelamento,
      segmentoCliente: clienteSegmento
    });

    setMensagemCancelamento(
      `E-mail de solicitação preparado para o orçamento ${orcamentoCancelamento.numero_orcamento}. Confirme o envio no seu aplicativo de e-mail.`
    );
    fecharSolicitacaoCancelamento();
  };

  if (!aberto) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Histórico do Cliente
          </h4>
          <p className="mt-1 text-sm text-slate-500">
            Orçamentos dos últimos {MESES_HISTORICO_ORCAMENTOS} meses agrupados
            pelo número principal.
          </p>
          {orcamentoFocoInicial ? (
            <p className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
              Orçamento selecionado pelo alerta: {orcamentoFocoInicial}
            </p>
          ) : null}
        </div>
      </div>

      {mensagemCancelamento ? (
        <div
          role="status"
          className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800"
        >
          {mensagemCancelamento}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <LoadingSpinner label="Carregando histórico do cliente..." />
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <strong>Erro ao carregar histórico.</strong>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {!loading && !error && historicoAgrupado.length === 0 ? (
        <div
          role="status"
          className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600"
        >
          Ainda não há orçamentos importados para este cliente nos últimos{' '}
          {MESES_HISTORICO_ORCAMENTOS} meses.
        </div>
      ) : null}

      {!loading && !error && historicoAgrupado.length > 0 ? (
        <div className="space-y-4">
          <HistoricoResumoCards
            resumo={resumo}
            statusFiltro={statusFiltro}
            onStatusFiltroChange={setStatusFiltro}
          />

          <HistoricoFiltros
            statusFiltro={statusFiltro}
            colunaOrdenacao={colunaOrdenacao}
            direcaoOrdenacao={direcaoOrdenacao}
            totalExibidos={historicoFiltradoOrdenado.length}
            total={historicoAgrupado.length}
            onStatusFiltroChange={setStatusFiltro}
            onColunaOrdenacaoChange={setColunaOrdenacao}
            onDirecaoOrdenacaoChange={setDirecaoOrdenacao}
          />

          {historicoFiltradoOrdenado.length === 0 ? (
            <div
              role="status"
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600"
            >
              Nenhum orçamento encontrado com o filtro selecionado.
            </div>
          ) : null}

          {historicoFiltradoOrdenado.length > 0 ? (
            <TabelaHistoricoOrcamentos
              historico={historicoFiltradoOrdenado}
              colunaOrdenacao={colunaOrdenacao}
              direcaoOrdenacao={direcaoOrdenacao}
              orcamentoFocoInicial={orcamentoFocoInicial}
              onOrdenar={alternarOrdenacao}
              onAbrirDetalhes={abrirDetalhes}
              onAbrirHistoricoManual={abrirHistoricoManual}
            />
          ) : null}
        </div>
      ) : null}

      {!loading && !error && historicoAgrupado.length > 0 ? (
        <p className="mt-4 text-xs text-slate-400">
          Ordenação atual: {rotulosOrdenacao[colunaOrdenacao]} /{' '}
          {direcaoOrdenacao === 'asc' ? 'crescente' : 'decrescente'}. Clique no
          botão Histórico para registrar informações específicas do orçamento.
        </p>
      ) : null}

      {orcamentoDetalhado ? (
        <ModalItensOrcamento
          clienteId={clienteId}
          orcamento={orcamentoDetalhado}
          onClose={fecharDetalhes}
          onSolicitarCancelamento={abrirSolicitacaoCancelamento}
        />
      ) : null}

      {orcamentoHistoricoManual ? (
        <ModalHistoricoOrcamento
          clienteId={clienteId}
          orcamento={orcamentoHistoricoManual}
          interacoes={interacoesOrcamento}
          formulario={formularioInteracao}
          carregando={carregandoInteracoes}
          salvando={salvandoInteracao}
          erro={erroInteracao}
          mensagem={mensagemInteracao}
          onFormularioChange={setFormularioInteracao}
          onClose={fecharHistoricoManual}
          onSalvar={salvarHistoricoManual}
        />
      ) : null}

      {orcamentoCancelamento ? (
        <ModalCancelamentoOrcamento
          clienteId={clienteId}
          orcamento={orcamentoCancelamento}
          emailCancelamento={emailCancelamento}
          solicitante={usuarioEmail || 'Usuário não identificado'}
          motivo={motivoCancelamento}
          erro={erroCancelamento}
          onMotivoChange={(valor) => {
            setMotivoCancelamento(valor);
            setErroCancelamento(null);
          }}
          onClose={fecharSolicitacaoCancelamento}
          onConfirmar={confirmarSolicitacaoCancelamento}
        />
      ) : null}
    </section>
  );
}
