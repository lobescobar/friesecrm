'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Profile } from '../../types'

export default function GestaoUsuarios() {
  const [usuarios, setUsuarios] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Profile | null>(null)

  useEffect(() => {
    carregarUsuarios()
  }, [])

  async function carregarUsuarios() {
    const { data, error } = await supabase.from('profiles').select('*')
    if (!error) setUsuarios(data)
    setLoading(false)
  }

  async function salvarAlteracoes() {
    if (!editando) return
    const { error } = await supabase
      .from('profiles')
      .update({
        role: editando.role,
        segmentos_permitidos: editando.segmentos_permitidos,
        estados_permitidos: editando.estados_permitidos
      })
      .eq('id', editando.id)

    if (!error) {
      alert('Usuário atualizado com sucesso!')
      setEditando(null)
      carregarUsuarios()
    } else {
      alert('Erro ao atualizar: ' + error.message)
    }
  }

  if (loading) return <div className="p-4">Carregando usuários...</div>

  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden mt-4">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold">Gestão de Usuários e Alçadas</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 font-semibold">E-mail</th>
              <th className="text-left px-6 py-3 font-semibold">Cargo</th>
              <th className="text-left px-6 py-3 font-semibold">Alçadas (Segmentos/Estados)</th>
              <th className="text-right px-6 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {u.role === 'admin' ? 'Acesso Total' : (
                    <div>
                      <p><strong>Seg:</strong> {u.segmentos_permitidos?.join(', ') || 'Todos'}</p>
                      <p><strong>Est:</strong> {u.estados_permitidos?.join(', ') || 'Todos'}</p>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setEditando(u)} className="text-blue-600 font-bold hover:underline">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditando(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
            <h3 className="text-xl font-bold mb-6">Editar Alçada: {editando.email}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cargo</label>
                <select 
                  value={editando.role} 
                  onChange={e => setEditando({...editando, role: e.target.value as any})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {editando.role === 'vendedor' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Segmentos Permitidos (separados por vírgula)</label>
                    <input 
                      type="text" 
                      value={editando.segmentos_permitidos?.join(', ')} 
                      onChange={e => setEditando({...editando, segmentos_permitidos: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                      placeholder="Ex: Alimentos, Bebidas"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estados Permitidos (separados por vírgula)</label>
                    <input 
                      type="text" 
                      value={editando.estados_permitidos?.join(', ')} 
                      onChange={e => setEditando({...editando, estados_permitidos: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                      placeholder="Ex: RS, SC, PR"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={salvarAlteracoes} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-slate-800 transition">Salvar</button>
              <button onClick={() => setEditando(null)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-200 transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
