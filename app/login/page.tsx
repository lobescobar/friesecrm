'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Logo da empresa"
            width={190}
            height={70}
            priority
            className="mb-4 h-16 w-auto object-contain"
          />
          <h1 className="text-xl font-bold text-slate-900">Mini CRM Mapa</h1>
          <p className="text-sm text-slate-500">Plataforma comercial</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">E-mail</span>
            <input
              type="email"
              required
              className="w-full rounded-xl bg-slate-100 px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-slate-400"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={carregando}
              autoComplete="email"
            />
          </label>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="senha">
              Senha
            </label>

            <div className="relative">
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                required
                className="w-full rounded-xl bg-slate-100 px-4 py-3 pr-12 text-slate-800 outline-none transition focus:ring-2 focus:ring-slate-400"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                disabled={carregando}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setMostrarSenha((atual) => !atual)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {erro ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {erro}
            </div>
          ) : null}

          {mensagem ? (
            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-600">
              {mensagem}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-500"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

          <button
            type="button"
            onClick={handleRecuperarSenha}
            disabled={carregando}
            className="self-center text-xs font-medium text-blue-600 hover:underline disabled:opacity-60"
          >
            Esqueceu a senha?
          </button>
        </form>
      </section>
    </main>
  );
}
