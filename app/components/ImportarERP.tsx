'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { Cliente } from '../../types'

type ImportarERPProps = {
  onSucesso?: () => void
}

export default function ImportarERP({ onSucesso }: ImportarERPProps) {
  const [carregando, setCarregando] = useState(false)

  async function importarERP(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    setCarregando(true)

    try {
      const dados = await arquivo.arrayBuffer()
      const workbook = XLSX.read(dados)
      const nomeAba = workbook.SheetNames[0]
      const aba = workbook.Sheets[nomeAba]

      const rows: any[][] = XLSX.utils.sheet_to_json(aba, { header: 1 })
      
      let headerIndex = -1
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].includes('Codigo')) {
          headerIndex = i
          break
        }
      }

      if (headerIndex === -1) {
        alert('Não foi possível encontrar a coluna "Codigo" na planilha.')
        setCarregando(false)
        return
      }

      const json: any[] = XLSX.utils.sheet_to_json(aba, { range: headerIndex })

      const clientesParaInserir = json.map((linha): Partial<Cliente> => {
        const nomeEmpresa = String(linha['N Fantasia'] || linha['Nome'] || '').trim()
        
        return {
          codigo_cliente: `${String(linha['Codigo'] || '').trim()}-${String(linha['Loja'] || '').padStart(2, '0')}`,
          empresa: nomeEmpresa,
          nome_fantasia: nomeEmpresa,
          razao_social: String(linha['Nome'] || '').trim(),
          cnpj: String(linha['CNPJ/CPF'] || '').trim(),
          segmento: String(linha['Tp. Mercado'] || '').trim(),
          cidade: String(linha['Municipio'] || '').trim(),
          estado: String(linha['Estado'] || '').trim(),
          endereco: String(linha['Endereco'] || '').trim(),
          status: 'Novo',
        }
      }).filter(c => c.empresa !== '' && !c.empresa?.includes('Nome'))

      if (clientesParaInserir.length === 0) {
        alert('Nenhum dado válido encontrado para importação.')
        setCarregando(false)
        return
      }

      // Inserção em lotes de 100 para evitar timeout e travamento do navegador
      const TAMANHO_LOTE = 100
      let erroOcorrido = false
      let totalImportado = 0

      for (let i = 0; i < clientesParaInserir.length; i += TAMANHO_LOTE) {
        const lote = clientesParaInserir.slice(i, i + TAMANHO_LOTE)
        // Usa upsert para atualizar se o codigo_cliente já existir, baseando-se na constraint unique
        const { error } = await supabase.from('clientes').upsert(lote, { 
          onConflict: 'codigo_cliente',
          ignoreDuplicates: false // Se for false, ele atualiza os dados existentes
        })
        
        if (error) {
          console.error('Erro no lote:', error)
          erroOcorrido = true
          alert('Erro parcial na importação: ' + error.message)
          break
        }
        totalImportado += lote.length
      }

      if (!erroOcorrido) {
        alert(`${totalImportado} clientes importados com sucesso!`)
        onSucesso?.()
      }

    } catch (err) {
      console.error('Erro na importação:', err)
      alert('Erro ao processar o arquivo .xlsx. Verifique o formato do arquivo.')
    } finally {
      setCarregando(false)
      if (e.target) e.target.value = ''
    }
  }

  return (
    <div>
      <input id="importarERP" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importarERP} disabled={carregando} />
      <button type="button" onClick={() => document.getElementById('importarERP')?.click()} disabled={carregando} className={`${carregando ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800'} text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2`}>
        {carregando ? (
          <>
            <span className="animate-spin">⏳</span>
            Processando...
          </>
        ) : (
          <>
            <span>📥</span>
            Importar ERP
          </>
        )}
      </button>
    </div>
  )
}
