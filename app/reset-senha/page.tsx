'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function ResetSenha() {
  const [novaSenha, setNovaSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const router = useRouter();

  async function handleAtualizarSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setMensagem('');

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.updateUser({
      password: novaSenha
    });

    if (error) {
      setErro(`Erro ao atualizar senha: ${error.message}`);
      setCarregando(false);
      return;
    }

    setMensagem('Senha atualizada com sucesso. Redirecionando...');
    setCarregando(false);

    window.setTimeout(() => {
      router.push('/crm');
    }, 1500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Criar Nova Senha</h1>
          <p className="mt-1 text-sm text-slate-500">
            Digite sua nova credencial de acesso
          </p>
        </div>

        <form onSubmit={handleAtualizarSenha} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">
              Nova Senha
            </span>
            <input
              type="password"
              required
              className="w-full rounded-xl bg-slate-100 px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-slate-400"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              disabled={carregando}
              autoComplete="new-password"
            />
          </label>

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
            {carregando ? 'Atualizando...' : 'Salvar nova senha'}
          </button>
        </form>
      </section>
    </main>
  );
}
