import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { enviarEmailMicrosoft365 } from '../../../../lib/microsoftGraph';
import {
  montarConteudoEmailCancelamento,
  normalizarSegmentoCancelamento,
  obterEmailCancelamentoFallback
} from '../../../../utils/cancelamentoOrcamentos';

export const runtime = 'nodejs';

type CorpoSolicitacao = {
  clienteId?: string;
  numeroOrcamento?: string;
  motivo?: string;
  segmentoCliente?: string | null;
  chaveIdempotencia?: string;
};

function criarSupabaseAutenticado(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Configuração pública do Supabase ausente no servidor.');
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let solicitacaoId: string | null = null;

  try {
    const autorizacao = request.headers.get('authorization');
    const token = autorizacao?.startsWith('Bearer ')
      ? autorizacao.slice(7)
      : '';

    if (!token) {
      return NextResponse.json(
        { error: 'Sessão não informada.' },
        { status: 401 }
      );
    }

    const corpo = (await request.json()) as CorpoSolicitacao;
    const clienteId = corpo.clienteId?.trim() || '';
    const numeroOrcamento = corpo.numeroOrcamento?.trim() || '';
    const motivo = corpo.motivo?.trim() || '';
    const segmentoCliente = corpo.segmentoCliente?.trim() || null;
    const chaveIdempotencia = corpo.chaveIdempotencia?.trim() || '';

    if (!clienteId || !numeroOrcamento || motivo.length < 5) {
      return NextResponse.json(
        { error: 'Cliente, orçamento ou motivo inválido.' },
        { status: 400 }
      );
    }

    if (!/^[0-9a-f-]{36}$/i.test(chaveIdempotencia)) {
      return NextResponse.json(
        { error: 'Identificador da solicitação inválido.' },
        { status: 400 }
      );
    }

    const supabase = criarSupabaseAutenticado(token);
    const {
      data: { user },
      error: erroUsuario
    } = await supabase.auth.getUser();

    if (erroUsuario || !user?.id || !user.email) {
      return NextResponse.json(
        { error: 'Sessão inválida ou expirada.' },
        { status: 401 }
      );
    }

    const { data: linhasOrcamento, error: erroOrcamento } = await supabase
      .from('orcamentos_historico')
      .select('id, status, cliente_id, numero_orcamento')
      .eq('cliente_id', clienteId)
      .eq('numero_orcamento', numeroOrcamento)
      .limit(1);

    if (erroOrcamento) {
      throw erroOrcamento;
    }

    const orcamento = linhasOrcamento?.[0];

    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado ou fora da sua alçada.' },
        { status: 404 }
      );
    }

    if (orcamento.status !== 'A') {
      return NextResponse.json(
        { error: 'Somente orçamentos abertos podem ter cancelamento solicitado.' },
        { status: 409 }
      );
    }

    const segmentoNormalizado =
      normalizarSegmentoCancelamento(segmentoCliente);
    let emailAdministracao = '';

    if (segmentoNormalizado) {
      const { data: regra, error: erroRegra } = await supabase
        .from('regras_cancelamento_segmentos')
        .select('email_cancelamento_id')
        .eq('segmento_normalizado', segmentoNormalizado)
        .maybeSingle();

      if (erroRegra) {
        throw erroRegra;
      }

      if (regra?.email_cancelamento_id) {
        const { data: destino, error: erroDestino } = await supabase
          .from('emails_cancelamento_orcamentos')
          .select('email')
          .eq('id', regra.email_cancelamento_id)
          .eq('ativo', true)
          .maybeSingle();

        if (erroDestino) {
          throw erroDestino;
        }

        emailAdministracao = destino?.email || '';
      }
    }

    if (!emailAdministracao) {
      const { data: padrao, error: erroPadrao } = await supabase
        .from('emails_cancelamento_orcamentos')
        .select('email')
        .eq('ativo', true)
        .eq('padrao', true)
        .maybeSingle();

      if (erroPadrao) {
        throw erroPadrao;
      }

      emailAdministracao =
        padrao?.email || obterEmailCancelamentoFallback(segmentoCliente);
    }

    const destinatarios = [user.email, emailAdministracao].filter(validarEmail);

    const { assunto, corpo: corpoEmail } = montarConteudoEmailCancelamento({
      numeroOrcamento,
      solicitante: user.email,
      motivo,
      segmentoCliente
    });

    const { data: solicitacaoExistente } = await supabase
      .from('solicitacoes_cancelamento_orcamentos')
      .select('id, status_envio, destinatarios')
      .eq('chave_idempotencia', chaveIdempotencia)
      .maybeSingle();

    if (solicitacaoExistente?.status_envio === 'enviado') {
      return NextResponse.json({
        ok: true,
        duplicado: true,
        destinatarios: solicitacaoExistente.destinatarios
      });
    }

    const { data: solicitacao, error: erroRegistro } = await supabase
      .from('solicitacoes_cancelamento_orcamentos')
      .upsert(
        {
          chave_idempotencia: chaveIdempotencia,
          cliente_id: clienteId,
          numero_orcamento: numeroOrcamento,
          solicitante_id: user.id,
          solicitante_email: user.email,
          vendedor_email: user.email,
          segmento_cliente: segmentoCliente,
          motivo,
          destinatarios,
          assunto,
          corpo: corpoEmail,
          status_envio: 'processando',
          erro_envio: null
        },
        { onConflict: 'chave_idempotencia' }
      )
      .select('id')
      .single();

    if (erroRegistro) {
      throw erroRegistro;
    }

    solicitacaoId = solicitacao.id;

    const resultadoEnvio = await enviarEmailMicrosoft365({
      destinatarios,
      assunto,
      corpo: corpoEmail
    });

    const { error: erroAtualizacao } = await supabase
      .from('solicitacoes_cancelamento_orcamentos')
      .update({
        status_envio: 'enviado',
        remetente: resultadoEnvio.remetente,
        enviado_em: new Date().toISOString(),
        erro_envio: null
      })
      .eq('id', solicitacaoId);

    if (erroAtualizacao) {
      console.error('E-mail enviado, mas auditoria não foi atualizada.', erroAtualizacao);
    }

    return NextResponse.json({
      ok: true,
      destinatarios: resultadoEnvio.destinatarios
    });
  } catch (erro) {
    const mensagem =
      erro instanceof Error ? erro.message : 'Erro inesperado ao enviar e-mail.';

    console.error('Erro no envio da solicitação de cancelamento:', erro);

    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
