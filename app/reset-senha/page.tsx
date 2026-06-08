'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetSenha() {
  const [novaSenha, setNovaSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const router = useRouter()

  async function handleAtualizarSenha(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      setCarregando(false)
      return
    }

    // Como o usuário clicou no link do email, ele JÁ ESTÁ logado.
    // Então usamos updateUser para alterar a senha dele.
    const { error } = await supabase.auth.updateUser({
      password: novaSenha
    })

    if (error) {
      setErro(`Erro ao atualizar senha: ${error.message}`)
    } else {
      setMensagem('Senha atualizada com sucesso! Redirecionando...')
      setTimeout(() => {
        router.push('/') // Joga pro CRM depois de 2 segundos
      }, 2000)
    }
    
    setCarregando(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-lg border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Criar Nova Senha</h1>
          <p className="text-slate-500 text-sm mt-1">Digite sua nova credencial de acesso</p>
        </div>

        <form onSubmit={handleAtualizarSenha} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Nova Senha</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-slate-100 text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 transition"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              disabled={carregando}
            />
          </div>

          {erro && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
              {erro}
            </div>
          )}
          {mensagem && (
            <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-xl border border-green-100">
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-medium py-3 rounded-xl transition"
          >
            {carregando ? 'Atualizando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
