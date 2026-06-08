import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {

  try {

    const body = await request.json();

    const {
      email,
      password,
      role,
      segmentos_permitidos,
      estados_permitidos
    } = body;

    if (!email || !password) {

      return NextResponse.json(
        { error: 'E-mail e senha obrigatórios.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // cria usuário no auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    if (authError) {

      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // cria profile
    const { error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email,
          role: role || 'vendedor',
          segmentos_permitidos:
            segmentos_permitidos || [],
          estados_permitidos:
            estados_permitidos || []
        });

    if (profileError) {

      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso.'
    });

  } catch (error: any) {

    return NextResponse.json(
      {
        error:
          error.message ||
          'Erro interno do servidor.'
      },
      { status: 500 }
    );
  }
}