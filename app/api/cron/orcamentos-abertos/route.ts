import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { enviarEmailMicrosoft365 } from '../../../../lib/microsoftGraph';
import {
  buscarResumoOrcamentosAbertos,
  montarEmailResumoOrcamentosAbertos,
  ResumoOrcamentosAbertosVendedor
} from '../../../../lib/resumoOrcamentosAbertos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FUSO_HORARIO = 'America/Sao_Paulo';

function criarSupabaseServico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Configuração de serviço do Supabase ausente.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function validarCron(request: NextRequest) {
  const segredos = [
    process.env.CRON_SECRET,
    process.env.REMINDER_DISPATCH_SECRET
  ]
    .map((segredo) => segredo?.trim())
    .filter((segredo): segredo is string => Boolean(segredo));
  const autorizacao = request.headers.get('authorization');

  if (segredos.length === 0) {
    return NextResponse.json(
      { error: 'Segredo do agendador não configurado.' },
      { status: 500 }
    );
  }

  if (!segredos.some((segredo) => autorizacao === `Bearer ${segredo}`)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  return null;
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function dataAtualSaoPaulo() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_HORARIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function assunto(dataReferencia: string, teste: boolean) {
  const data = dataReferencia.split('-').reverse().join('/');
  return `${teste ? '[TESTE] ' : ''}Orçamentos em aberto - ${data}`;
}

function escolherResumoTeste(
  resumos: ResumoOrcamentosAbertosVendedor[],
  vendedorSolicitado: string | null
) {
  if (vendedorSolicitado) {
    const encontrado = resumos.find(
      (item) => item.vendedorEmail === vendedorSolicitado.trim().toLowerCase()
    );
    if (encontrado) return encontrado;
  }

  return [...resumos].sort(
    (a, b) => b.orcamentos.length - a.orcamentos.length
  )[0];
}

async function reservarEnvio(
  supabase: SupabaseClient,
  dados: {
    chaveExecucao: string;
    dataReferencia: string;
    vendedorEmail: string;
    destinatario: string;
    modoTeste: boolean;
    quantidadeOrcamentos: number;
    origemImportacao: string | null;
  }
) {
  const { data: existente, error: erroConsulta } = await supabase
    .from('emails_resumo_orcamentos_abertos')
    .select('id,status')
    .eq('chave_execucao', dados.chaveExecucao)
    .maybeSingle();

  if (erroConsulta) throw erroConsulta;

  if (existente && existente.status !== 'erro') {
    return null;
  }

  const valores = {
    status: 'processando',
    quantidade_orcamentos: dados.quantidadeOrcamentos,
    origem_importacao: dados.origemImportacao,
    erro: null,
    enviado_em: null,
    updated_at: new Date().toISOString()
  };

  if (existente) {
    const { data, error } = await supabase
      .from('emails_resumo_orcamentos_abertos')
      .update(valores)
      .eq('id', existente.id)
      .select('id')
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('emails_resumo_orcamentos_abertos')
    .insert({
      chave_execucao: dados.chaveExecucao,
      data_referencia: dados.dataReferencia,
      vendedor_email: dados.vendedorEmail,
      destinatario: dados.destinatario,
      modo_teste: dados.modoTeste,
      ...valores
    })
    .select('id')
    .single();

  if (error?.code === '23505') return null;
  if (error) throw error;
  return data;
}

export async function GET(request: NextRequest) {
  const erroAutorizacao = validarCron(request);
  if (erroAutorizacao) return erroAutorizacao;

  const modoTeste = request.nextUrl.searchParams.get('modo') === 'teste';
  const destinatarioTeste =
    request.nextUrl.searchParams.get('destinatario')?.trim().toLowerCase() || '';
  const vendedorTeste = request.nextUrl.searchParams.get('vendedor');

  if (modoTeste && !validarEmail(destinatarioTeste)) {
    return NextResponse.json(
      { error: 'Informe um destinatário de teste válido.' },
      { status: 400 }
    );
  }

  const supabase = criarSupabaseServico();
  const dataReferencia = dataAtualSaoPaulo();

  try {
    const resumo = await buscarResumoOrcamentosAbertos(supabase);
    const resumosParaEnviar = modoTeste
      ? [escolherResumoTeste(resumo.vendedores, vendedorTeste)].filter(
          (item): item is ResumoOrcamentosAbertosVendedor => Boolean(item)
        )
      : resumo.vendedores;

    const enviados: Array<{
      vendedor: string;
      destinatario: string;
      quantidade: number;
    }> = [];
    const ignorados: Array<{ vendedor: string; motivo: string }> = [];
    const erros: Array<{ vendedor: string; mensagem: string }> = [];

    for (const item of resumosParaEnviar) {
      const destinatario = modoTeste ? destinatarioTeste : item.vendedorEmail;
      const chaveExecucao = modoTeste
        ? `${dataReferencia}:teste:${destinatario}:${Date.now()}`
        : `${dataReferencia}:${item.vendedorEmail}`;

      if (!validarEmail(destinatario) || item.orcamentos.length === 0) {
        ignorados.push({
          vendedor: item.vendedorEmail,
          motivo: 'destinatario_invalido_ou_sem_orcamentos'
        });
        continue;
      }

      const registro = await reservarEnvio(supabase, {
        chaveExecucao,
        dataReferencia,
        vendedorEmail: item.vendedorEmail,
        destinatario,
        modoTeste,
        quantidadeOrcamentos: item.orcamentos.length,
        origemImportacao: resumo.origemImportacao
      });

      if (!registro) {
        ignorados.push({
          vendedor: item.vendedorEmail,
          motivo: 'resumo_ja_enviado_ou_em_processamento'
        });
        continue;
      }

      try {
        await enviarEmailMicrosoft365({
          destinatarios: [destinatario],
          assunto: assunto(dataReferencia, modoTeste),
          corpo: montarEmailResumoOrcamentosAbertos(item, dataReferencia),
          remetente:
            process.env.REMINDER_MAIL_SENDER?.trim() ||
            (modoTeste ? destinatarioTeste : undefined)
        });

        const { error: erroAtualizacao } = await supabase
          .from('emails_resumo_orcamentos_abertos')
          .update({
            status: 'enviado',
            enviado_em: new Date().toISOString(),
            erro: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', registro.id);

        if (erroAtualizacao) throw erroAtualizacao;

        enviados.push({
          vendedor: item.vendedorEmail,
          destinatario,
          quantidade: item.orcamentos.length
        });
      } catch (erroEnvio) {
        const mensagem =
          erroEnvio instanceof Error
            ? erroEnvio.message
            : 'Erro inesperado no envio.';

        await supabase
          .from('emails_resumo_orcamentos_abertos')
          .update({
            status: 'erro',
            erro: mensagem.slice(0, 2000),
            updated_at: new Date().toISOString()
          })
          .eq('id', registro.id);

        console.error('Erro ao enviar resumo de orçamentos abertos:', erroEnvio);
        erros.push({ vendedor: item.vendedorEmail, mensagem });
      }
    }

    return NextResponse.json({
      ok: erros.length === 0,
      modo: modoTeste ? 'teste' : 'diario',
      dataReferencia,
      lote: resumo.origemImportacao,
      totalOrcamentos: resumo.totalOrcamentos,
      totalSemResponsavel: resumo.totalSemResponsavel,
      enviados,
      ignorados,
      erros
    });
  } catch (erro) {
    const mensagem =
      erro instanceof Error ? erro.message : 'Erro inesperado no relatório.';
    console.error('Erro ao processar resumo de orçamentos abertos:', erro);
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
