import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type DeleteUserBody = {
  userId?: string;
};

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function normalizarEmail(email?: string | null) {
  return String(email || '').trim().toLowerCase();
}

function erroUsuarioAuthInexistente(error: { message?: string; status?: number }) {
  const mensagem = String(error.message || '').toLowerCase();

  return (
    error.status === 404 ||
    mensagem.includes('not found') ||
    mensagem.includes('user not found')
  );
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

    const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (adminProfileError || !adminProfile) {
      return jsonError('Perfil do administrador não encontrado.', 403);
    }

    if (adminProfile.role !== 'admin') {
      return jsonError('Apenas administradores podem excluir usuários.', 403);
    }

    const body = (await request.json()) as DeleteUserBody;
    const userId = body.userId?.trim();

    if (!userId) {
      return jsonError('ID do usuário é obrigatório.', 400);
    }

    if (userId === user.id) {
      return jsonError('Você não pode excluir o próprio usuário logado.', 400);
    }

    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (targetProfileError || !targetProfile) {
      return jsonError('Usuário não encontrado em profiles.', 404);
    }

    if (targetProfile.role === 'admin') {
      const { count, error: countError } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (countError) {
        return jsonError(`Erro ao validar administradores: ${countError.message}`, 400);
      }

      if ((count || 0) <= 1) {
        return jsonError('Não é permitido excluir o último administrador.', 400);
      }
    }

    const emailNormalizado = normalizarEmail(targetProfile.email);

    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError && !erroUsuarioAuthInexistente(authDeleteError)) {
      console.error('[admin/delete-user] Falha ao excluir usuário do Auth.', {
        userId,
        error: authDeleteError.message
      });

      return jsonError(
        `Erro ao revogar o acesso do usuário: ${authDeleteError.message}`,
        400
      );
    }

    const [profileDeleteResult, metasDeleteResult] = await Promise.all([
      supabaseAdmin.from('profiles').delete().eq('id', userId),
      emailNormalizado
        ? supabaseAdmin
            .from('metas_comerciais')
            .delete()
            .eq('vendedor_email', emailNormalizado)
        : Promise.resolve({ error: null })
    ]);

    if (profileDeleteResult.error || metasDeleteResult.error) {
      console.error('[admin/delete-user] Acesso revogado com limpeza incompleta.', {
        userId,
        profileError: profileDeleteResult.error?.message || null,
        metasError: metasDeleteResult.error?.message || null
      });

      return jsonError(
        [
          'O acesso foi revogado, mas a limpeza do cadastro ficou incompleta.',
          profileDeleteResult.error
            ? `Perfil: ${profileDeleteResult.error.message}`
            : null,
          metasDeleteResult.error
            ? `Metas: ${metasDeleteResult.error.message}`
            : null
        ]
          .filter(Boolean)
          .join(' '),
        400
      );
    }

    const [profileCheckResult, metasCheckResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('id', userId),
      emailNormalizado
        ? supabaseAdmin
            .from('metas_comerciais')
            .select('id', { count: 'exact', head: true })
            .eq('vendedor_email', emailNormalizado)
        : Promise.resolve({ count: 0, error: null })
    ]);

    if (profileCheckResult.error || metasCheckResult.error) {
      return jsonError(
        [
          'O acesso foi revogado, mas não foi possível validar toda a limpeza.',
          profileCheckResult.error
            ? `Perfil: ${profileCheckResult.error.message}`
            : null,
          metasCheckResult.error
            ? `Metas: ${metasCheckResult.error.message}`
            : null
        ]
          .filter(Boolean)
          .join(' '),
        400
      );
    }

    const profilesRestantes = profileCheckResult.count || 0;
    const metasRestantes = metasCheckResult.count || 0;

    if (profilesRestantes > 0 || metasRestantes > 0) {
      return jsonError(
        'O acesso foi revogado, mas ainda existem dados do usuário a limpar. Tente novamente.',
        400
      );
    }

    return NextResponse.json({
      success: true,
      message: `Usuário ${targetProfile.email} excluído com sucesso.`
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno do servidor.';

    return jsonError(message, 500);
  }
}
