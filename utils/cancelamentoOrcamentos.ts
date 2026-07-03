import { supabase } from '../lib/supabase';

const EMAIL_CANCELAMENTO_PADRAO = 'vendas.ai@friese.com.br';
const EMAIL_CANCELAMENTO_CORRUGADOS = 'vendas.cr@friese.com.br';

type EmailCancelamentoConsulta = {
  email: string;
};

type RegraCancelamentoConsulta = {
  email_cancelamento_id: string | null;
};

function normalizarSegmentoCancelamento(segmento?: string | null) {
  return (segmento || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function obterEmailCancelamentoFallback(segmento?: string | null) {
  const segmentoNormalizado = normalizarSegmentoCancelamento(segmento);

  if (segmentoNormalizado === 'corrugados') {
    return EMAIL_CANCELAMENTO_CORRUGADOS;
  }

  return EMAIL_CANCELAMENTO_PADRAO;
}

export async function buscarEmailCancelamentoConfigurado(
  segmento?: string | null
) {
  const fallback = obterEmailCancelamentoFallback(segmento);
  const segmentoNormalizado = normalizarSegmentoCancelamento(segmento);

  try {
    if (segmentoNormalizado) {
      const { data: regra, error: erroRegra } = await supabase
        .from('regras_cancelamento_segmentos')
        .select('email_cancelamento_id')
        .eq('segmento_normalizado', segmentoNormalizado)
        .maybeSingle<RegraCancelamentoConsulta>();

      if (erroRegra) {
        throw erroRegra;
      }

      if (regra?.email_cancelamento_id) {
        const { data: destino, error: erroDestino } = await supabase
          .from('emails_cancelamento_orcamentos')
          .select('email')
          .eq('id', regra.email_cancelamento_id)
          .eq('ativo', true)
          .maybeSingle<EmailCancelamentoConsulta>();

        if (erroDestino) {
          throw erroDestino;
        }

        if (destino?.email) {
          return destino.email;
        }
      }
    }

    const { data: padrao, error: erroPadrao } = await supabase
      .from('emails_cancelamento_orcamentos')
      .select('email')
      .eq('ativo', true)
      .eq('padrao', true)
      .maybeSingle<EmailCancelamentoConsulta>();

    if (erroPadrao) {
      throw erroPadrao;
    }

    return padrao?.email || fallback;
  } catch (erro) {
    console.warn(
      'Falha ao buscar regra de cancelamento. Usando fallback seguro.',
      erro
    );
    return fallback;
  }
}

export function montarUrlEmailCancelamento(params: {
  numeroOrcamento: string;
  solicitante: string;
  motivo: string;
  destinatario: string;
  segmentoCliente?: string | null;
}) {
  const assunto = `Solicitação de cancelamento do orçamento ${params.numeroOrcamento}`;
  const corpo = [
    'Favor cancelar o orçamento a seguir.',
    '',
    `Número do orçamento: ${params.numeroOrcamento}`,
    `Segmento do cliente: ${params.segmentoCliente || '-'}`,
    `Vendedor/Solicitante CRM: ${params.solicitante}`,
    `Motivo: ${params.motivo}`,
    '',
    'Solicitação enviada pelo Painel comercial.'
  ].join('\n');

  return `mailto:${params.destinatario}?subject=${encodeURIComponent(
    assunto
  )}&body=${encodeURIComponent(corpo)}`;
}
