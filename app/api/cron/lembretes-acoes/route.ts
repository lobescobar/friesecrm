import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { enviarEmailMicrosoft365 } from '../../../../lib/microsoftGraph';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FUSO_HORARIO = 'America/Sao_Paulo';
const UM_DIA_MS = 24 * 60 * 60 * 1000;

type TipoLembrete = 'previo' | 'data';

type OrcamentoInteracaoLembrete = {
  id: string;
  cliente_id: string;
  numero_orcamento: string;
  observacao: string;
  proximo_passo: string | null;
  data_retorno: string | null;
  responsavel_email: string | null;
  criado_por_email: string | null;
  lembrete_previo_enviado_em: string | null;
  lembrete_data_enviado_em: string | null;
};

function criarSupabaseServico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Configuração de serviço do Supabase ausente.');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function validarCron(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET não configurado.' },
      { status: 500 }
    );
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  return null;
}

function obterDataSaoPaulo(offsetDias = 0) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_HORARIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const ano = Number(partes.find((parte) => parte.type === 'year')?.value);
  const mes = Number(partes.find((parte) => parte.type === 'month')?.value);
  const dia = Number(partes.find((parte) => parte.type === 'day')?.value);

  return new Date(Date.UTC(ano, mes - 1, dia) + offsetDias * UM_DIA_MS)
    .toISOString()
    .slice(0, 10);
}

function formatarDataBrasileira(dataIso: string) {
  const [ano, mes, dia] = dataIso.split('-');

  if (!ano || !mes || !dia) {
    return dataIso;
  }

  return `${dia}/${mes}/${ano}`;
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function montarCorpoEmail(
  interacao: OrcamentoInteracaoLembrete,
  dataLimite: string
) {
  return [
    'Ação pendente',
    '',
    `Orçamento: ${interacao.numero_orcamento}`,
    `Data limite: ${formatarDataBrasileira(dataLimite)}`,
    '',
    'Registro referente:',
    interacao.observacao,
    '',
    'Ação a ser tomada:',
    interacao.proximo_passo?.trim() || '-',
    '',
    'Este é um lembrete automático do CRM Friese.'
  ].join('\n');
}

export async function GET(request: NextRequest) {
  const erroAutorizacao = validarCron(request);

  if (erroAutorizacao) {
    return erroAutorizacao;
  }

  const hoje = obterDataSaoPaulo();
  const amanha = obterDataSaoPaulo(1);
  const supabase = criarSupabaseServico();

  const { data, error } = await supabase
    .from('orcamentos_interacoes')
    .select(
      [
        'id',
        'cliente_id',
        'numero_orcamento',
        'observacao',
        'proximo_passo',
        'data_retorno',
        'responsavel_email',
        'criado_por_email',
        'lembrete_previo_enviado_em',
        'lembrete_data_enviado_em'
      ].join(', ')
    )
    .not('data_retorno', 'is', null)
    .not('proximo_passo', 'is', null)
    .in('data_retorno', [hoje, amanha]);

  if (error) {
    console.error('Erro ao consultar lembretes de ações pendentes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const interacoes = (data || []) as unknown as OrcamentoInteracaoLembrete[];

  const eventos = interacoes.flatMap(
    (interacao) => {
      const eventosInteracao: Array<{
        interacao: OrcamentoInteracaoLembrete;
        tipo: TipoLembrete;
      }> = [];

      if (
        interacao.data_retorno === amanha &&
        !interacao.lembrete_previo_enviado_em
      ) {
        eventosInteracao.push({ interacao, tipo: 'previo' });
      }

      if (
        interacao.data_retorno === hoje &&
        !interacao.lembrete_data_enviado_em
      ) {
        eventosInteracao.push({ interacao, tipo: 'data' });
      }

      return eventosInteracao;
    }
  );

  const enviados: Array<{
    id: string;
    numero_orcamento: string;
    tipo: TipoLembrete;
    destinatario: string;
  }> = [];
  const ignorados: Array<{ id: string; motivo: string }> = [];
  const erros: Array<{ id: string; mensagem: string }> = [];

  for (const evento of eventos) {
    const { interacao, tipo } = evento;
    const destinatario =
      interacao.responsavel_email?.trim() ||
      interacao.criado_por_email?.trim() ||
      '';
    const acao = interacao.proximo_passo?.trim() || '';
    const dataLimite = interacao.data_retorno || '';

    if (!validarEmail(destinatario)) {
      ignorados.push({ id: interacao.id, motivo: 'responsavel_sem_email' });
      continue;
    }

    if (!acao || !dataLimite) {
      ignorados.push({ id: interacao.id, motivo: 'acao_ou_data_ausente' });
      continue;
    }

    try {
      await enviarEmailMicrosoft365({
        destinatarios: [destinatario],
        assunto: 'ação pendente',
        corpo: montarCorpoEmail(interacao, dataLimite)
      });

      const campoControle =
        tipo === 'previo'
          ? 'lembrete_previo_enviado_em'
          : 'lembrete_data_enviado_em';

      const { error: erroAtualizacao } = await supabase
        .from('orcamentos_interacoes')
        .update({ [campoControle]: new Date().toISOString() })
        .eq('id', interacao.id)
        .is(campoControle, null);

      if (erroAtualizacao) {
        throw erroAtualizacao;
      }

      enviados.push({
        id: interacao.id,
        numero_orcamento: interacao.numero_orcamento,
        tipo,
        destinatario
      });
    } catch (erro) {
      const mensagem =
        erro instanceof Error ? erro.message : 'Erro inesperado no envio.';

      console.error('Erro ao enviar lembrete de ação pendente:', erro);
      erros.push({ id: interacao.id, mensagem });
    }
  }

  return NextResponse.json({
    ok: erros.length === 0,
    hoje,
    amanha,
    enviados,
    ignorados,
    erros
  });
}
