'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function IconeSenha({ visivel }: { visivel: boolean }) {
  if (visivel) {
    return (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M9.9 5.2A9.6 9.6 0 0112 5c5 0 8.3 4.1 9.4 5.8a2.2 2.2 0 010 2.4 17.8 17.8 0 01-2.2 2.7M14.1 14.1A3 3 0 019.9 9.9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 6.9a17.4 17.4 0 00-3.9 3.9 2.2 2.2 0 000 2.4C3.7 14.9 7 19 12 19a9.7 9.7 0 004.1-.9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M2.6 10.8C3.7 9.1 7 5 12 5s8.3 4.1 9.4 5.8a2.2 2.2 0 010 2.4C20.3 14.9 17 19 12 19s-8.3-4.1-9.4-5.8a2.2 2.2 0 010-2.4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const router = useRouter();

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setMensagem('');
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      setErro('E-mail ou senha inválidos.');
      setCarregando(false);
      return;
    }

    router.push('/crm');
  }

  async function handleRecuperarSenha() {
    if (!email) {
      setErro('Digite seu e-mail no campo acima primeiro.');
      return;
    }

    setCarregando(true);
    setErro('');
    setMensagem('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-senha`
    });

    if (error) {
      setErro(error.message);
    } else {
      setMensagem('Foi enviado um link de recuperação para o seu e-mail.');
    }

    setCarregando(false);
  }

  return (
    <main className="crm-industrial-shell flex min-h-screen items-center justify-center px-4 py-10">
      <section className="crm-card w-full max-w-md rounded-[2rem] p-7 sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-2xl bg-white px-4 py-3">
            <Image
              src="/logo.png"
              alt="Friese Agroindústria"
              width={220}
              height={82}
              priority
              className="h-16 w-auto object-contain"
            />
          </div>

          <p className="mt-4 text-lg font-medium text-slate-600">
            Plataforma comercial
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="crm-label">E-mail</span>
            <input
              type="email"
              required
              className="crm-field w-full rounded-xl px-4 py-3 text-sm"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={carregando}
              autoComplete="email"
              placeholder="seu.email@empresa.com.br"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <label className="crm-label" htmlFor="senha">
              Senha
            </label>

            <div className="relative">
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                required
                className="crm-field w-full rounded-xl px-4 py-3 pr-14 text-sm"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                disabled={carregando}
                autoComplete="current-password"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                onClick={() => setMostrarSenha((atual) => !atual)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={mostrarSenha}
                disabled={carregando}
              >
                <IconeSenha visivel={mostrarSenha} />
              </button>
            </div>
          </div>

          {erro ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {erro}
            </div>
          ) : null}

          {mensagem ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {mensagem}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#0b1225] bg-[#0b1225] px-4 py-3 font-bold text-white shadow-sm transition hover:border-[#172033] hover:bg-[#172033] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

          <button
            type="button"
            onClick={handleRecuperarSenha}
            disabled={carregando}
            className="self-center rounded-lg px-3 py-2 text-xs font-bold text-[#0b4aa0] transition hover:bg-blue-50 hover:underline disabled:opacity-60"
          >
            Esqueceu a senha?
          </button>
        </form>
      </section>
    </main>
  );
}
