"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import { Cliente } from "../../types";

type ImportarERPProps = {
  onSucesso?: () => void;
};

function texto(valor: any) {
  return String(valor ?? "").trim();
}

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function encontrarIndiceCabecalho(headers: any[], nomesPossiveis: string[]) {
  const headersNormalizados = headers.map((h) => normalizar(String(h ?? "")));
  const nomesNormalizados = nomesPossiveis.map((n) => normalizar(n));

  return headersNormalizados.findIndex((header) =>
    nomesNormalizados.some((nome) => header === nome || header.includes(nome))
  );
}

function valorPorCabecalho(
  linha: any[],
  headers: any[],
  nomesPossiveis: string[]
) {
  const indice = encontrarIndiceCabecalho(headers, nomesPossiveis);

  if (indice < 0) return "";

  return texto(linha[indice]);
}

export default function ImportarERP({ onSucesso }: ImportarERPProps) {
  const [carregando, setCarregando] = useState(false);

  async function importarERP(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    setCarregando(true);

    try {
      const dados = await arquivo.arrayBuffer();

      const workbook = XLSX.read(dados, {
        type: "array",
        cellDates: false,
      });

      const nomeAba = workbook.SheetNames[0];
      const aba = workbook.Sheets[nomeAba];

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
        const linhaNormalizada = rows[i].map((celula) =>
          normalizar(String(celula ?? ""))
        );

        const temCodigo = linhaNormalizada.some(
          (valor) => valor === "codigo" || valor === "cod" || valor.includes("codigo")
        );

        const temRazaoOuFantasia = linhaNormalizada.some(
          (valor) =>
            valor.includes("razao") ||
            valor.includes("nome") ||
            valor.includes("fantasia")
        );

        if (temCodigo && temRazaoOuFantasia) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) {
        alert(
          'Não foi possível encontrar o cabeçalho da planilha. Verifique se existe a coluna "Codigo".'
        );
        return;
      }

      const headers = rows[headerIndex];
      const linhasDados = rows.slice(headerIndex + 1);

      const clientesParaImportar = linhasDados
        .map((linha): Partial<Cliente> | null => {
          // Colunas fixas da planilha ERP:
          // D = Razão Social
          // E = Nome Fantasia
          // AF = CNPJ
          const razaoSocialColunaD = texto(linha[3]);
          const nomeFantasiaColunaE = texto(linha[4]);
          const cnpjColunaAF = texto(linha[31]);

          const codigo =
            valorPorCabecalho(linha, headers, ["Codigo", "Código", "Cod"]) ||
            texto(linha[0]);

          const loja =
            valorPorCabecalho(linha, headers, ["Loja"]) ||
            texto(linha[1]);

          const razaoSocial =
            razaoSocialColunaD ||
            valorPorCabecalho(linha, headers, [
              "Razao Social",
              "Razão Social",
              "Nome",
              "Cliente",
            ]);

          const nomeFantasia =
            nomeFantasiaColunaE ||
            valorPorCabecalho(linha, headers, [
              "Nome Fantasia",
              "N Fantasia",
              "Fantasia",
            ]);

          const cnpj =
            cnpjColunaAF ||
            valorPorCabecalho(linha, headers, [
              "CNPJ",
              "CNPJ/CPF",
              "CNPJ CPF",
            ]);

          const segmento = valorPorCabecalho(linha, headers, [
            "Tp. Mercado",
            "Tipo Mercado",
            "Segmento",
            "Mercado",
          ]);

          const cidade = valorPorCabecalho(linha, headers, [
            "Municipio",
            "Município",
            "Cidade",
          ]);

          const estado = valorPorCabecalho(linha, headers, [
            "Estado",
            "UF",
          ]).toUpperCase();

          const endereco = valorPorCabecalho(linha, headers, [
            "Endereco",
            "Endereço",
            "Logradouro",
          ]);

          const empresa = nomeFantasia || razaoSocial;

          if (!empresa && !razaoSocial && !cnpj) return null;

          const codigoCliente =
            codigo || loja
              ? `${String(codigo).trim()}-${String(loja || "0").padStart(2, "0")}`
              : "";

          return {
            codigo_cliente: codigoCliente,
            empresa,
            nome_fantasia: nomeFantasia,
            razao_social: razaoSocial,
            cnpj,
            segmento: segmento ? segmento.toUpperCase() : "",
            cidade,
            estado,
            endereco,
            status: "Novo",
          };
        })
        .filter((cliente): cliente is Partial<Cliente> => {
          if (!cliente) return false;

          const nome = texto(cliente.empresa);
          const razao = texto(cliente.razao_social);
          const cnpj = texto(cliente.cnpj);

          if (!nome && !razao && !cnpj) return false;
          if (normalizar(nome).includes("nome fantasia")) return false;
          if (normalizar(razao).includes("razao social")) return false;

          return true;
        });

      if (clientesParaImportar.length === 0) {
        alert("Nenhum dado válido encontrado para importação.");
        return;
      }

      let inseridos = 0;
      let atualizados = 0;
      let ignorados = 0;

      for (const cliente of clientesParaImportar) {
        const codigoCliente = texto(cliente.codigo_cliente);
        const cnpjNumeros = somenteNumeros(texto(cliente.cnpj));

        let clienteExistenteId: string | null = null;

        if (codigoCliente) {
          const { data } = await supabase
            .from("clientes")
            .select("id")
            .eq("codigo_cliente", codigoCliente)
            .maybeSingle();

          if (data?.id) {
            clienteExistenteId = data.id;
          }
        }

        if (!clienteExistenteId && cnpjNumeros) {
          const { data } = await supabase
            .from("clientes")
            .select("id, cnpj")
            .not("cnpj", "is", null);

          const encontrado = (data || []).find(
            (item: any) => somenteNumeros(String(item.cnpj || "")) === cnpjNumeros
          );

          if (encontrado?.id) {
            clienteExistenteId = encontrado.id;
          }
        }

        if (clienteExistenteId) {
          const { error } = await supabase
            .from("clientes")
            .update(cliente)
            .eq("id", clienteExistenteId);

          if (error) {
            console.warn("Erro ao atualizar cliente:", error.message);
            ignorados++;
          } else {
            atualizados++;
          }
        } else {
          const { error } = await supabase
            .from("clientes")
            .insert(cliente);

          if (error) {
            console.warn("Erro ao inserir cliente:", error.message);
            ignorados++;
          } else {
            inseridos++;
          }
        }
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

      if (e.target) {
        e.target.value = "";
      }
    }
  }

  return (
    <div>
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
          carregando
            ? "bg-slate-400"
            : "bg-slate-900 hover:bg-slate-800"
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
    </div>
  );
}
