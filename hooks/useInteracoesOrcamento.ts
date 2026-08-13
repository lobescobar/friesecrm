import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  FormularioInteracaoOrcamento,
  HistoricoOrcamentoAgrupado,
  OrcamentoInteracao
} from '../types/historico';
import { formularioInteracaoInicial } from '../types/historico';

type UseInteracoesOrcamentoParams = {
  clienteId: string;
  usuarioId?: string | null;
  usuarioEmail?: string | null;
};

export function useInteracoesOrcamento({
  clienteId,
  usuarioId,
  usuarioEmail
}: UseInteracoesOrcamentoParams) {
  const [interacoesOrcamento, setInteracoesOrcamento] = useState<
    OrcamentoInteracao[]
  >([]);
  const [formularioInteracao, setFormularioInteracao] =
    useState<FormularioInteracaoOrcamento>(formularioInteracaoInicial);
  const [carregandoInteracoes, setCarregandoInteracoes] = useState(false);
  const [salvandoInteracao, setSalvandoInteracao] = useState(false);
  const [erroInteracao, setErroInteracao] = useState<string | null>(null);
  const [mensagemInteracao, setMensagemInteracao] = useState<string | null>(
    null
  );

  const limparInteracoesOrcamento = useCallback(() => {
    setInteracoesOrcamento([]);
    setFormularioInteracao(formularioInteracaoInicial);
    setErroInteracao(null);
    setMensagemInteracao(null);
  }, []);

  const carregarInteracoesOrcamento = useCallback(
    async (item: HistoricoOrcamentoAgrupado) => {
      setCarregandoInteracoes(true);
      setErroInteracao(null);
      setMensagemInteracao(null);

      const { data, error: erroConsulta } = await supabase
        .from('orcamentos_interacoes')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('numero_orcamento', item.numero_orcamento)
        .order('created_at', { ascending: false });

      if (erroConsulta) {
        setErroInteracao(
          `Erro ao carregar histórico do orçamento: ${erroConsulta.message}`
        );
        setInteracoesOrcamento([]);
        setCarregandoInteracoes(false);
        return;
      }

      setInteracoesOrcamento((data || []) as OrcamentoInteracao[]);
      setCarregandoInteracoes(false);
    },
    [clienteId]
  );

  const salvarInteracaoOrcamento = useCallback(
    async (
      item: HistoricoOrcamentoAgrupado | null,
      formulario: FormularioInteracaoOrcamento
    ) => {
      if (!item) return false;

      const observacao = formulario.observacao.trim();

      if (observacao.length < 3) {
        setErroInteracao(
          'Informe uma observação com pelo menos 3 caracteres para salvar o histórico.'
        );
        return false;
      }

      setSalvandoInteracao(true);
      setErroInteracao(null);
      setMensagemInteracao('Salvando histórico do orçamento...');

      const { error: erroInsert } = await supabase
        .from('orcamentos_interacoes')
        .insert({
          cliente_id: clienteId,
          numero_orcamento: item.numero_orcamento,
          observacao,
          proximo_passo: formulario.proximo_passo.trim() || null,
          data_retorno: formulario.data_retorno || null,
          responsavel_email: usuarioEmail || null,
          criado_por: usuarioId || null,
          criado_por_email: usuarioEmail || null
        });

      if (erroInsert) {
        setErroInteracao(`Erro ao salvar histórico: ${erroInsert.message}`);
        setMensagemInteracao(null);
        setSalvandoInteracao(false);
        return false;
      }

      setMensagemInteracao('Histórico salvo com sucesso.');
      setFormularioInteracao(formularioInteracaoInicial);
      setSalvandoInteracao(false);
      await carregarInteracoesOrcamento(item);
      return true;
    },
    [carregarInteracoesOrcamento, clienteId, usuarioEmail, usuarioId]
  );

  return {
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
  };
}
