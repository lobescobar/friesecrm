"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import { Cliente } from "../../types";

type ImportarERPProps = { onSucesso?: () => void };
type ClienteImportacao = Partial<Cliente> & { codigo_cliente?: string; cnpj?: string };

const texto = (v: any) => String(v ?? "").trim();
const normalizar = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const somenteNumeros = (v: string) => v.replace(/\D/g, "");

function acharIndice(headers: any[], nomes: string[]) {
  const h = headers.map((x) => normalizar(String(x ?? "")));
  const n = nomes.map(normalizar);
  return h.findIndex((header) =>
    n.some((nome) => header === nome || header.includes(nome))
  );
}

function porCabecalho(linha: any[], headers: any[], nomes: string[]) {
  const i = acharIndice(headers, nomes);
  return i >= 0 ? texto(linha[i]) : "";
}

function lotes<T>(lista: T[], tamanho: number) {
  const r: T[][] = [];
  for (let i = 0; i < lista.length; i += tamanho) r.push(lista.slice(i, i + tamanho));
  return r;
}

export default function ImportarERP({ onSucesso }: ImportarERPProps) {
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState("");

  async function importarERP(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setCarregando(true);
    setProgresso("Lendo planilha...");

    try {
      const dados = await arquivo.arrayBuffer();
      const workbook = XLSX.read(dados, { type: "array", cellDates: false });
      const aba = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(aba, {
        header: 1,
        defval: "",
        blankrows: false,
      });

      if (!rows.length) {
        alert("A planilha está vazia.");
        return;
      }

      let headerIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        const linha = rows[i].map((c) => normalizar(String(c ?? "")));
        const temCodigo = linha.some((v) => v === "codigo" || v === "cod" || v.includes("codigo"));
        const temNome = linha.some((v) => v.includes("razao") || v.includes("nome") || v.includes("fantasia"));
        if (temCodigo && temNome) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) {
        alert('Não foi possível encontrar o cabeçalho da planilha. Verifique se existe a coluna "Codigo".');
        return;
      }

      const headers = rows[headerIndex];
      const linhasDados = rows.slice(headerIndex + 1);

      setProgresso("Convertendo dados...");

      const clientesParaImportar = linhasDados
        .map((linha): ClienteImportacao | null => {
          // Colunas fixas do ERP:
          // D = Razão Social | E = Nome Fantasia | AF = CNPJ
          const razaoSocialD = texto(linha[3]);
          const nomeFantasiaE = texto(linha[4]);
          const cnpjAF = texto(linha[31]);

          const codigo = porCabecalho(linha, headers, ["Codigo", "Código", "Cod"]) || texto(linha[0]);
          const loja = porCabecalho(linha, headers, ["Loja"]) || texto(linha[1]);

          const razao_social =
            razaoSocialD ||
            porCabecalho(linha, headers, ["Razao Social", "Razão Social", "Nome", "Cliente"]);

          const nome_fantasia =
            nomeFantasiaE ||
            porCabecalho(linha, headers, ["Nome Fantasia", "N Fantasia", "Fantasia"]);

          const cnpj = cnpjAF || porCabecalho(linha, headers, ["CNPJ", "CNPJ/CPF", "CNPJ CPF"]);
          const empresa = nome_fantasia || razao_social;

          if (!empresa && !razao_social && !cnpj) return null;

          const segmento = porCabecalho(linha, headers, ["Tp. Mercado", "Tipo Mercado", "Segmento", "Mercado"]);
          const cidade = porCabecalho(linha, headers, ["Municipio", "Município", "Cidade"]);
          const estado = porCabecalho(linha, headers, ["Estado", "UF"]).toUpperCase();
          const endereco = porCabecalho(linha, headers, ["Endereco", "Endereço", "Logradouro"]);

          const codigo_cliente =
            codigo || loja
              ? `${String(codigo).trim()}-${String(loja || "0").padStart(2, "0")}`
              : "";

          return {
            codigo_cliente,
            empresa,
            nome_fantasia,
            razao_social,
            cnpj,
            segmento: segmento ? segmento.toUpperCase() : "",
            cidade,
            estado,
            endereco,
            status: "Novo",
          };
        })
        .filter((cliente): cliente is ClienteImportacao => {
          if (!cliente) return false;
          const nome = texto(cliente.empresa);
          const razao = texto(cliente.razao_social);
          const cnpj = texto(cliente.cnpj);
          if (!nome && !razao && !cnpj) return false;
          if (normalizar(nome).includes("nome fantasia")) return false;
          if (normalizar(razao).includes("razao social")) return false;
          return true;
        });

      if (!clientesParaImportar.length) {
        alert("Nenhum dado válido encontrado para importação.");
        return;
      }

      setProgresso("Buscando clientes existentes...");

      const { data: existentes, error: erroExistentes } = await supabase
        .from("clientes")
        .select("id, codigo_cliente, cnpj");

      if (erroExistentes) {
        console.error(erroExistentes);
        alert("Erro ao consultar clientes existentes.");
        return;
      }

      const porCodigo = new Map<string, string>();
      const porCnpj = new Map<string, string>();

      (existentes || []).forEach((c: any) => {
        const codigo = texto(c.codigo_cliente);
        const cnpj = somenteNumeros(texto(c.cnpj));
        if (codigo) porCodigo.set(codigo, c.id);
        if (cnpj) porCnpj.set(cnpj, c.id);
      });

      const paraInserir: ClienteImportacao[] = [];
      const paraAtualizar: Array<{ id: string; dados: ClienteImportacao }> = [];

      clientesParaImportar.forEach((cliente) => {
        const codigo = texto(cliente.codigo_cliente);
        const cnpj = somenteNumeros(texto(cliente.cnpj));
        const id = (codigo && porCodigo.get(codigo)) || (cnpj && porCnpj.get(cnpj)) || "";

        if (id) paraAtualizar.push({ id, dados: cliente });
        else paraInserir.push(cliente);
      });

      let inseridos = 0;
      let atualizados = 0;
      let ignorados = 0;

      const lotesInsercao = lotes(paraInserir, 100);
      for (let i = 0; i < lotesInsercao.length; i++) {
        setProgresso(`Inserindo lote ${i + 1}/${lotesInsercao.length}...`);
        const { error } = await supabase.from("clientes").insert(lotesInsercao[i]);
        if (error) {
          console.warn("Erro ao inserir lote:", error.message);
          ignorados += lotesInsercao[i].length;
        } else {
          inseridos += lotesInsercao[i].length;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const lotesAtualizacao = lotes(paraAtualizar, 10);

for (let i = 0; i < lotesAtualizacao.length; i++) {
  setProgresso(
    `Atualizando lote ${i + 1}/${lotesAtualizacao.length}...`
  );

  for (const item of lotesAtualizacao[i]) {
    const { error } = await supabase
      .from("clientes")
      .update(item.dados)
      .eq("id", item.id);

    if (error) {
      console.warn(
        "Erro ao atualizar cliente:",
        error.message
      );

      ignorados++;
    } else {
      atualizados++;
    }
  }

  await new Promise((resolve) =>
    setTimeout(resolve, 100)
  );
}

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      alert(
        `Importação concluída.\n\nInseridos: ${inseridos}\nAtualizados: ${atualizados}\nIgnorados com erro: ${ignorados}`
      );

      onSucesso?.();
    } catch (err) {
      console.error("Erro na importação:", err);
      alert("Erro ao processar o arquivo .xlsx. Verifique o formato do arquivo.");
    } finally {
      setCarregando(false);
      setProgresso("");
      if (e.target) e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        id="importarERP"
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={importarERP}
        disabled={carregando}
      />

      <button
        type="button"
        onClick={() => document.getElementById("importarERP")?.click()}
        disabled={carregando}
        className={`${
          carregando ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-800"
        } text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2`}
      >
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

      {progresso && (
        <span className="text-[10px] text-slate-500 max-w-[240px] text-right">
          {progresso}
        </span>
      )}
    </div>
  );
}
