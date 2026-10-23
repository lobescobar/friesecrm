import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { enviarEmailMicrosoft365 } from '../../../../lib/microsoftGraph';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FUSO_HORARIO = 'America/Sao_Paulo';
const JANELA_ENVIO_MS = 61 * 60 * 1000;

type OrcamentoInteracaoLembrete = {
  id: string;
  cliente_id: string;
  numero_orcamento: string;
  observacao: string;
  proximo_passo: string | null;
  data_retorno: string | null;
};

type EquipamentoClienteLembrete = {
  id: string;
  cliente_id: string;
  modelo_maquina: string;
  fabricante: string | null;
  codigo_maquina: string | null;
  data_ultima_compra: string | null;
  lembrete_em: string | null;
  historico: string | null;
};

type ClienteCarteira = {
  id: string;
  estado: string | null;
  segmento: string | null;
  nome_fantasia: string | null;
  empresa: string | null;
  razao_social: string | null;
};

type VendedorAlcada = {
  email: string;
  estados_permitidos: string[] | null;
  segmentos_permitidos: string[] | null;
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
  const segredosValidos = [
    process.env.CRON_SECRET,
    process.env.REMINDER_DISPATCH_SECRET
  ]
    .map((segredo) => segredo?.trim())
    .filter((segredo): segredo is string => Boolean(segredo));

  if (segredosValidos.length === 0) {
    return NextResponse.json(
      { error: 'Segredo do agendador não configurado.' },
      { status: 500 }
    );
  }

  const autorizacao = request.headers.get('authorization');

  if (!segredosValidos.some((segredo) => autorizacao === `Bearer ${segredo}`)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  return null;
}

function normalizarChave(valor?: string | null) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatarDataHoraBrasileira(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return dataIso;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_HORARIO,
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(data);
}

function formatarDataBrasileira(dataIso?: string | null) {
  if (!dataIso) return '-';

  const [ano, mes, dia] = dataIso.split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : dataIso;
}

function vendedorAtendeCliente(
  vendedor: VendedorAlcada,
  cliente: ClienteCarteira
) {
  const estado = normalizarChave(cliente.estado);
  const segmento = normalizarChave(cliente.segmento);
  const estados = (vendedor.estados_permitidos || []).map(normalizarChave);
  const segmentos = (vendedor.segmentos_permitidos || []).map(normalizarChave);

  if (!estado) {
    return false;
  }

  const atendeEstado = estados.length === 0 || estados.includes(estado);
  const atendeSegmento =
    segmentos.length === 0 || (segmento !== '' && segmentos.includes(segmento));

  return atendeEstado && atendeSegmento;
}

function escolherVendedorResponsavel(
  cliente: ClienteCarteira,
  vendedores: VendedorAlcada[]
) {
  return vendedores
    .filter((vendedor) => vendedorAtendeCliente(vendedor, cliente))
    .map((vendedor) => ({
      vendedor,
      especificidade:
        (vendedor.estados_permitidos?.length ? 1 : 0) +
        (vendedor.segmentos_permitidos?.length ? 2 : 0)
    }))
    .sort(
      (a, b) =>
        b.especificidade - a.especificidade ||
        a.vendedor.email.localeCompare(b.vendedor.email, 'pt-BR', {
          sensitivity: 'base'
        })
    )[0]?.vendedor;
}

function montarCorpoEmail(interacao: OrcamentoInteracaoLembrete) {
  return [
    'Ação pendente',
    '',
    `Orçamento: ${interacao.numero_orcamento}`,
    `Data limite: ${formatarDataHoraBrasileira(interacao.data_retorno || '')}`,
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

function montarCorpoEmailEquipamento(
  equipamento: EquipamentoClienteLembrete,
  cliente: ClienteCarteira
) {
  const nomeCliente =
    cliente.nome_fantasia ||
    cliente.empresa ||
    cliente.razao_social ||
    'Cliente não identificado';

  return [
    'Lembrete de equipamento',
    '',
    `Cliente: ${nomeCliente}`,
    `Modelo da máquina: ${equipamento.modelo_maquina}`,
    `Fabricante: ${equipamento.fabricante || '-'}`,
    `Cód. da máquina: ${equipamento.codigo_maquina || '-'}`,
    `Data da última compra: ${formatarDataBrasileira(
      equipamento.data_ultima_compra
    )}`,
    `Data do lembrete: ${formatarDataHoraBrasileira(
      equipamento.lembrete_em || ''
    )}`,
    '',
    'Histórico:',
    equipamento.historico?.trim() || '-',
    '',
    'Este é um lembrete automático do CRM Friese.'
  ].join('\n');
}

export async function GET(request: NextRequest) {
  const erroAutorizacao = validarCron(request);

  if (erroAutorizacao) {
    return erroAutorizacao;
  }

  const supabase = criarSupabaseServico();
  const agora = new Date();
  const ate = new Date(agora.getTime() + JANELA_ENVIO_MS);
  const agoraIso = agora.toISOString();

  const [resultadoInteracoes, resultadoEquipamentos] = await Promise.all([
    supabase.rpc('crm_claim_lembretes_acoes', {
      p_agora: agoraIso,
      p_ate: ate.toISOString(),
      p_limite: 100
    }),
    supabase.rpc('crm_claim_lembretes_equipamentos', {
      p_agora: agoraIso,
      p_limite: 100
    })
  ]);

  const interacoes = (resultadoInteracoes.data ||
    []) as OrcamentoInteracaoLembrete[];
  const equipamentos = (resultadoEquipamentos.data ||
    []) as EquipamentoClienteLembrete[];

  if (resultadoInteracoes.error || resultadoEquipamentos.error) {
    await Promise.all([
      ...interacoes.map((interacao) =>
        supabase
          .from('orcamentos_interacoes')
          .update({ lembrete_processando_em: null })
          .eq('id', interacao.id)
          .eq('lembrete_processando_em', agoraIso)
      ),
      ...equipamentos.map((equipamento) =>
        supabase
          .from('equipamentos_clientes')
          .update({ lembrete_processando_em: null })
          .eq('id', equipamento.id)
          .eq('lembrete_processando_em', agoraIso)
      )
    ]);

    const erroReserva =
      resultadoInteracoes.error || resultadoEquipamentos.error;
    console.error('Erro ao reservar lembretes pendentes:', erroReserva);
    return NextResponse.json(
      { error: erroReserva?.message || 'Erro ao reservar lembretes.' },
      { status: 500 }
    );
  }

  const clienteIds = [
    ...new Set([
      ...interacoes.map((item) => item.cliente_id),
      ...equipamentos.map((item) => item.cliente_id)
    ])
  ];

  const [resultadoClientes, resultadoVendedores] = await Promise.all([
    clienteIds.length
      ? supabase
          .from('clientes')
          .select('id,estado,segmento,nome_fantasia,empresa,razao_social')
          .in('id', clienteIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('profiles')
      .select('email,estados_permitidos,segmentos_permitidos')
      .eq('role', 'vendedor')
      .order('email', { ascending: true })
  ]);

  if (resultadoClientes.error || resultadoVendedores.error) {
    const erroConsulta = resultadoClientes.error || resultadoVendedores.error;

    await Promise.all([
      ...interacoes.map((interacao) =>
        supabase
          .from('orcamentos_interacoes')
          .update({ lembrete_processando_em: null })
          .eq('id', interacao.id)
          .eq('lembrete_processando_em', agoraIso)
      ),
      ...equipamentos.map((equipamento) =>
        supabase
          .from('equipamentos_clientes')
          .update({ lembrete_processando_em: null })
          .eq('id', equipamento.id)
          .eq('lembrete_processando_em', agoraIso)
      )
    ]);

    console.error('Erro ao resolver vendedores dos lembretes:', erroConsulta);
    return NextResponse.json(
      { error: erroConsulta?.message || 'Erro ao resolver vendedores.' },
      { status: 500 }
    );
  }

  const clientes = new Map(
    ((resultadoClientes.data || []) as ClienteCarteira[]).map((cliente) => [
      cliente.id,
      cliente
    ])
  );
  const vendedores = (resultadoVendedores.data || []) as VendedorAlcada[];
  const enviados: Array<{ id: string; numero_orcamento: string }> = [];
  const equipamentosEnviados: Array<{ id: string; modelo_maquina: string }> = [];
  const ignorados: Array<{ id: string; motivo: string }> = [];
  const equipamentosIgnorados: Array<{ id: string; motivo: string }> = [];
  const erros: Array<{ id: string; mensagem: string }> = [];
  const errosEquipamentos: Array<{ id: string; mensagem: string }> = [];

  for (const interacao of interacoes) {
    const cliente = clientes.get(interacao.cliente_id);
    const vendedor = cliente
      ? escolherVendedorResponsavel(cliente, vendedores)
      : null;
    const destinatario = vendedor?.email.trim().toLowerCase() || '';
    const acao = interacao.proximo_passo?.trim() || '';
    const dataLimite = interacao.data_retorno || '';

    if (!validarEmail(destinatario) || !acao || !dataLimite) {
      const motivo = !cliente
        ? 'cliente_nao_encontrado'
        : !validarEmail(destinatario)
          ? 'vendedor_responsavel_sem_email'
          : 'acao_ou_data_ausente';

      await supabase
        .from('orcamentos_interacoes')
        .update({ lembrete_processando_em: null })
        .eq('id', interacao.id)
        .eq('lembrete_processando_em', agoraIso);

      ignorados.push({ id: interacao.id, motivo });
      continue;
    }

    try {
      await enviarEmailMicrosoft365({
        destinatarios: [destinatario],
        assunto: 'Ação pendente',
        corpo: montarCorpoEmail(interacao)
      });

      const { error: erroAtualizacao } = await supabase
        .from('orcamentos_interacoes')
        .update({
          responsavel_email: destinatario,
          lembrete_processando_em: null,
          lembrete_enviado_em: new Date().toISOString()
        })
        .eq('id', interacao.id)
        .eq('lembrete_processando_em', agoraIso)
        .is('lembrete_enviado_em', null);

      if (erroAtualizacao) {
        throw erroAtualizacao;
      }

      enviados.push({
        id: interacao.id,
        numero_orcamento: interacao.numero_orcamento
      });
    } catch (erro) {
      await supabase
        .from('orcamentos_interacoes')
        .update({ lembrete_processando_em: null })
        .eq('id', interacao.id)
        .eq('lembrete_processando_em', agoraIso)
        .is('lembrete_enviado_em', null);

      const mensagem =
        erro instanceof Error ? erro.message : 'Erro inesperado no envio.';

      console.error('Erro ao enviar lembrete de ação pendente:', erro);
      erros.push({ id: interacao.id, mensagem });
    }
  }

  for (const equipamento of equipamentos) {
    const cliente = clientes.get(equipamento.cliente_id);
    const vendedor = cliente
      ? escolherVendedorResponsavel(cliente, vendedores)
      : null;
    const destinatario = vendedor?.email.trim().toLowerCase() || '';

    if (!cliente || !validarEmail(destinatario) || !equipamento.lembrete_em) {
      const motivo = !cliente
        ? 'cliente_nao_encontrado'
        : !validarEmail(destinatario)
          ? 'vendedor_responsavel_sem_email'
          : 'data_lembrete_ausente';

      await supabase
        .from('equipamentos_clientes')
        .update({ lembrete_processando_em: null })
        .eq('id', equipamento.id)
        .eq('lembrete_processando_em', agoraIso);

      equipamentosIgnorados.push({ id: equipamento.id, motivo });
      continue;
    }

    try {
      await enviarEmailMicrosoft365({
        destinatarios: [destinatario],
        assunto: 'Lembrete de equipamento',
        corpo: montarCorpoEmailEquipamento(equipamento, cliente)
      });

      const { error: erroAtualizacao } = await supabase
        .from('equipamentos_clientes')
        .update({
          lembrete_responsavel_email: destinatario,
          lembrete_processando_em: null,
          lembrete_enviado_em: new Date().toISOString()
        })
        .eq('id', equipamento.id)
        .eq('lembrete_processando_em', agoraIso)
        .is('lembrete_enviado_em', null);

      if (erroAtualizacao) {
        throw erroAtualizacao;
      }

      equipamentosEnviados.push({
        id: equipamento.id,
        modelo_maquina: equipamento.modelo_maquina
      });
    } catch (erro) {
      await supabase
        .from('equipamentos_clientes')
        .update({ lembrete_processando_em: null })
        .eq('id', equipamento.id)
        .eq('lembrete_processando_em', agoraIso)
        .is('lembrete_enviado_em', null);

      const mensagem =
        erro instanceof Error ? erro.message : 'Erro inesperado no envio.';

      console.error('Erro ao enviar lembrete de equipamento:', erro);
      errosEquipamentos.push({ id: equipamento.id, mensagem });
    }
  }

  return NextResponse.json({
    ok: erros.length === 0 && errosEquipamentos.length === 0,
    processados: interacoes.length + equipamentos.length,
    processadosAcoes: interacoes.length,
    processadosEquipamentos: equipamentos.length,
    enviados,
    equipamentosEnviados,
    ignorados,
    equipamentosIgnorados,
    erros,
    errosEquipamentos
  });
}
