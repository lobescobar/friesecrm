import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type CreateUserBody = {
  email?: string;
  password?: string;
  role?: 'admin' | 'vendedor';
  segmentos_permitidos?: string[];
  estados_permitidos?: string[];
};

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function listaSegura(valor: unknown) {
  if (!Array.isArray(valor)) return [];

  return valor
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonError('Variáveis de ambiente do Supabase não configuradas.', 500);
    }

    const authorization = request.headers.get('Authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return jsonError('Usuário não autenticado.', 401);
    }

    const accessToken = authorization.replace('Bearer ', '').trim();

    if (!accessToken) {
      return jsonError('Token de acesso ausente.', 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const {
      data: { user },
      error: userError
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return jsonError('Sessão inválida ou expirada.', 401);
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return jsonError('Perfil do usuário não encontrado.', 403);
    }

    if (profile.role !== 'admin') {
      return jsonError('Apenas administradores podem criar usuários.', 403);
    }

    const body = (await request.json()) as CreateUserBody;

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const role = body.role === 'admin' ? 'admin' : 'vendedor';

    if (!email || !password) {
      return jsonError('E-mail e senha são obrigatórios.', 400);
    }

    if (password.length < 6) {
      return jsonError('A senha provisória deve ter pelo menos 6 caracteres.', 400);
    }

    const segmentosPermitidos =
      role === 'admin' ? [] : listaSegura(body.segmentos_permitidos);

    const estadosPermitidos =
      role === 'admin'
        ? []
        : listaSegura(body.estados_permitidos).map((estado) =>
            estado.toUpperCase()
          );

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    if (authError || !authData.user) {
      return jsonError(authError?.message || 'Erro ao criar usuário.', 400);
    }

    const userId = authData.user.id;

    const { error: profileCreateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        role,
        segmentos_permitidos: segmentosPermitidos,
        estados_permitidos: estadosPermitidos
      });

    if (profileCreateError) {
      return jsonError(profileCreateError.message, 400);
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso.'
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno do servidor.';

    return jsonError(message, 500);
  }
}
