"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import { Cliente } from "../../types";

type ImportarERPProps = {
  onSucesso?: () => void;
};

type ClienteImportacao = Partial<Cliente> & {
  codigo_cliente: string;
  cnpj?: string;
};

const texto = (valor: unknown) => String(valor ?? "").trim();

const normalizar = (valor: string) =>
  valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const somenteNumeros = (valor: string) => valor.replace(/\D/g, "");

function acharIndice(headers: unknown[], nomes: string[]) {
  const headersNormalizados = headers.map((header) =>
    normalizar(String(header ?? ""))
  );

  const nomesNormalizados = nomes.map(normalizar);

  return headersNormalizados.findIndex((header) =>
    nomesNormalizados.some(
      (nome) => header === nome || header.includes(nome)
    )
  );
}

function porCabecalho(
  linha: unknown[],
  headers: unknown[],
  nomes: string[]
) {
  const indice = acharIndice(headers, nomes);
  return indice >= 0 ? texto(linha[indice]) : "";
}

function lotes<T>(lista: T[], tamanho: number) {
  const resultado: T[][] = [];

  for (let i = 0; i < lista.length; i += tamanho) {
    resultado.push(lista.slice(i, i + tamanho));
  }

  return resultado;
}

function montarCodigoCliente(codigo: string, loja: string) {
  const codigoBase = somenteNumeros(String(codigo || ""));
  const lojaBase = somenteNumeros(String(loja || "0")) || "0";

  if (!codigoBase) return "";

  return `${codigoBase.padStart(6, "0")}-${lojaBase.padStart(2, "0")}`;
}

export default function ImportarERP({ onSucesso }: ImportarERPProps) {
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState("");

  async function importarERP(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo || carregando) return;

    setCarregando(true);
    setProgresso("Lendo planilha...");

    try {
      const dados = await arquivo.arrayBuffer();

      const workbook = XLSX.read(dados, {
        type: "array",
        cellDates: false,
      });

      const nomeAba = workbook.SheetNames[0];
      const aba = workbook.Sheets[nomeAba];

      const rows: unknown[][] = XLSX.utils.sheet_to_json(aba, {
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
        const linhaNormalizada = rows[i].map((celula) =>
          normalizar(String(celula ?? ""))
        );

        const temCodigo = linhaNormalizada.some(
          (valor) =>
            valor === "codigo" ||
            valor === "cod" ||
            valor.includes("codigo")
        );

        const temNome = linhaNormalizada.some(
          (valor) =>
            valor.includes("razao") ||
            valor.includes("nome") ||
            valor.includes("fantasia")
        );

        if (temCodigo && temNome) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) {
        alert(
          'Não foi possível encontrar o cabeçalho da planilha. Verifique se existe a coluna "Código".'
        );
        return;
      }

      const headers = rows[headerIndex];
      const linhasDados = rows.slice(headerIndex + 1);

      setProgresso("Convertendo dados...");

      const clientesUnicos = new Map<string, ClienteImportacao>();
      let ignoradosSemCodigo = 0;
      let ignoradosDuplicados = 0;

      for (const [indiceLinha, linha] of linhasDados.entries()) {
        const numeroLinhaExcel = headerIndex + 2 + indiceLinha;

        const valorCelula = (coluna: string) => {
          const celula = aba[`${coluna}${numeroLinhaExcel}`];
          return texto(celula?.v ?? celula?.w ?? "");
        };

        // Colunas fixas do ERP:
        // D = Razão Social | E = Nome Fantasia | AF = CNPJ | EK = Segmento
        const razaoSocialD = valorCelula("D");
        const nomeFantasiaE = valorCelula("E");
        const cnpjAF = valorCelula("AF");
        const segmentoEK = valorCelula("EK");

        const codigo =
          porCabecalho(linha, headers, ["Codigo", "Código", "Cod"]) ||
          texto(linha[0]);

        const loja = porCabecalho(linha, headers, ["Loja"]) || texto(linha[1]);

        const codigo_cliente = montarCodigoCliente(codigo, loja);

        if (!codigo_cliente) {
          ignoradosSemCodigo++;
          continue;
        }

        if (clientesUnicos.has(codigo_cliente)) {
          ignoradosDuplicados++;
          continue;
        }

        const razao_social =
          razaoSocialD ||
          porCabecalho(linha, headers, [
            "Razao Social",
            "Razão Social",
            "Nome",
            "Cliente",
          ]);

        const nome_fantasia =
          nomeFantasiaE ||
          porCabecalho(linha, headers, [
            "Nome Fantasia",
            "N Fantasia",
            "Fantasia",
          ]);

        const empresa = nome_fantasia || razao_social;

        const cnpj =
          cnpjAF ||
          porCabecalho(linha, headers, ["CNPJ", "CNPJ/CPF", "CNPJ CPF"]);

        if (!empresa && !razao_social && !cnpj) {
          continue;
        }

        const cidade = porCabecalho(linha, headers, [
          "Municipio",
          "Município",
          "Cidade",
        ]);

        const estado = porCabecalho(linha, headers, ["Estado", "UF"]);

        const endereco = porCabecalho(linha, headers, [
          "Endereco",
          "Endereço",
          "Logradouro",
        ]);

        const cliente: ClienteImportacao = {
          codigo_cliente,
          empresa,
          nome_fantasia,
          razao_social,
          cnpj,
          segmento: segmentoEK ? segmentoEK.toUpperCase() : "",
          cidade,
          estado: estado ? estado.toUpperCase() : "",
          endereco,
          status: "Novo",
        };

        clientesUnicos.set(codigo_cliente, cliente);
      }

      const clientesParaImportar = Array.from(clientesUnicos.values());

      if (!clientesParaImportar.length) {
        alert("Nenhum dado válido encontrado para importação.");
        return;
      }

      let inseridos = 0;
      let atualizados = 0;
      let ignoradosComErro = 0;
      let primeiraMensagemErro = "";

      const lotesImportacao = lotes(clientesParaImportar, 50);

      for (let i = 0; i < lotesImportacao.length; i++) {
        setProgresso(`Importando lote ${i + 1}/${lotesImportacao.length}...`);

        const { error } = await supabase.from("clientes").upsert(
          lotesImportacao[i],
          {
            onConflict: "codigo_cliente",
            ignoreDuplicates: false,
          }
        );

        if (error) {
          console.warn("Erro ao importar lote:", error.message);

          // Se um lote falhar, tenta item por item para salvar o máximo possível.
          for (const cliente of lotesImportacao[i]) {
            const { error: erroIndividual } = await supabase
              .from("clientes")
              .upsert(cliente, {
                onConflict: "codigo_cliente",
                ignoreDuplicates: false,
              });

            if (erroIndividual) {
              console.warn(
                "Erro ao importar cliente:",
                cliente.codigo_cliente,
                erroIndividual.message
              );

              ignoradosComErro++;

              if (!primeiraMensagemErro) {
                primeiraMensagemErro = erroIndividual.message;
              }
            } else {
              atualizados++;
            }
          }
        } else {
          atualizados += lotesImportacao[i].length;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      alert(
        `Importação concluída.\n\nInseridos: ${inseridos}\nAtualizados: ${atualizados}\nIgnorados sem código ERP: ${ignoradosSemCodigo}\nIgnorados por código duplicado: ${ignoradosDuplicados}\nIgnorados com erro: ${ignoradosComErro}${
          primeiraMensagemErro
            ? `\n\nPrimeiro erro encontrado:\n${primeiraMensagemErro}`
            : ""
        }`
      );

      onSucesso?.();
    } catch (err) {
      console.error("Erro na importação:", err);
      alert(
        "Erro inesperado durante a importação. Verifique o console ou tente novamente."
      );
    } finally {
      setCarregando(false);
      setProgresso("");

      if (e.target) {
        e.target.value = "";
      }
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
