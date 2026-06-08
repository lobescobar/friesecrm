'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setMensagem('')
    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro('E-mail ou senha inválidos.')
      setCarregando(false)
    } else {
      // Login com sucesso, redireciona para o mapa/CRM
      router.push('/')
    }
  }

  async function handleRecuperarSenha() {
    if (!email) {
      setErro('Por favor, digite seu e-mail no campo acima primeiro.')
      return
    }

    setCarregando(true)
    setErro('')
    
    // Função nativa do Supabase para enviar email de reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-senha`, // Onde ele volta após clicar no email
    })

    if (error) {
      setErro(error.message)
    } else {
      setMensagem('Foi enviado um link de recuperação para o seu e-mail.')
    }
    
    setCarregando(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-lg border border-slate-100">
<div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Logo Friese" className="h-16 w-auto object-contain mb-4" />
          <p className="text-slate-500 text-sm">Plataforma comercial</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          
          {/* Campo E-mail */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">E-mail</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-100 text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={carregando}
            />
          </div>

          {/* Campo Senha com botão de visualização */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-600">Senha</label>
              <button 
                type="button" 
                onClick={handleRecuperarSenha}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
            
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                required
                className="w-full px-4 py-3 bg-slate-100 text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 transition pr-12"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={carregando}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setMostrarSenha(!mostrarSenha)}
              >
                {/* SVG do olhinho simplificado */}
                {mostrarSenha ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          {/* Feedbacks (Erro ou Sucesso) */}
          {erro && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
              {erro}
            </div>
          )}
          {mensagem && (
            <div className="bg-blue-50 text-blue-600 text-sm px-4 py-3 rounded-xl border border-blue-100">
              {mensagem}
            </div>
          )}

          {/* Botão de Submit */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-medium py-3 rounded-xl transition"
          >
            {carregando ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
