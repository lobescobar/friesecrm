"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import { Cliente } from "../../types";

type ImportarERPProps = {
  onSucesso?: () => void;
};

type ClienteImportacao = Partial<Cliente> & {
  codigo_cliente?: string;
  cnpj?: string;
};

const texto = (v: unknown) => String(v ?? "").trim();

const normalizar = (v: string) =>
  texto(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const somenteNumeros = (v: string) => texto(v).replace(/\D/g, "");

function acharIndice(headers: unknown[], nomes: string[]) {
  const headersNormalizados = headers.map((x) => normalizar(String(x ?? "")));
  const nomesNormalizados = nomes.map(normalizar);

  return headersNormalizados.findIndex((header) =>
    nomesNormalizados.some((nome) => header === nome || header.includes(nome))
  );
}

function porCabecalho(linha: unknown[], headers: unknown[], nomes: string[]) {
  const indice = acharIndice(headers, nomes);
  return indice >= 0 ? texto(linha[indice]) : "";
}

function montarCodigoCliente(codigo: string, loja: string) {
  const codigoNumeros = somenteNumeros(codigo);

  if (!codigoNumeros) {
    return "";
  }

  const lojaNumeros = somenteNumeros(loja) || "0";

  return `${codigoNumeros.padStart(6, "0")}-${lojaNumeros.padStart(2, "0")}`;
}

function lotes<T>(lista: T[], tamanho: number) {
  const resultado: T[][] = [];

  for (let i = 0; i < lista.length; i += tamanho) {
    resultado.push(lista.slice(i, i + tamanho));
  }

  return resultado;
}

function mesclarCliente(
  atual: ClienteImportacao,
  novo: ClienteImportacao
): ClienteImportacao {
  return {
    ...atual,
    ...Object.fromEntries(
      Object.entries(novo).filter(([, valor]) => texto(valor).length > 0)
    ),
    status: atual.status || novo.status || "Novo",
  };
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
        const linha = rows[i].map((c) => normalizar(String(c ?? "")));
        const temCodigo = linha.some(
          (v) => v === "codigo" || v === "cod" || v.includes("codigo")
        );
        const temLoja = linha.some((v) => v === "loja" || v.includes("loja"));
        const temNome = linha.some(
          (v) =>
            v.includes("razao") ||
            v.includes("nome") ||
            v.includes("fantasia") ||
            v.includes("cnpj")
        );

        if (temCodigo && temNome) {
          headerIndex = i;
          break;
        }

        if (temCodigo && temLoja) {
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

      setProgresso("Convertendo dados...");

      const clientesConvertidos = linhasDados
        .map((linha): ClienteImportacao | null => {
          // Colunas fixas do ERP:
          // D = Razão Social | E = Nome Fantasia | AF = CNPJ
          const razaoSocialD = texto(linha[3]);
          const nomeFantasiaE = texto(linha[4]);
          const cnpjAF = texto(linha[31]);

          const codigo =
            porCabecalho(linha, headers, ["Codigo", "Código", "Cod"]) ||
            texto(linha[0]);

          const loja =
            porCabecalho(linha, headers, ["Loja"]) || texto(linha[1]);

          const codigo_cliente = montarCodigoCliente(codigo, loja);

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

          const cnpj =
            cnpjAF ||
            porCabecalho(linha, headers, ["CNPJ", "CNPJ/CPF", "CNPJ CPF"]);

          const empresa = nome_fantasia || razao_social;

          if (!codigo_cliente && !empresa && !razao_social && !cnpj) {
            return null;
          }

          const segmento = porCabecalho(linha, headers, [
            "Tp. Mercado",
            "Tipo Mercado",
            "Segmento",
            "Mercado",
          ]);

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

          return {
            codigo_cliente,
            empresa,
            nome_fantasia,
            razao_social,
            cnpj,
            segmento: segmento ? segmento.toUpperCase() : "",
            cidade,
            estado: estado ? estado.toUpperCase() : "",
            endereco,
            status: "Novo",
          };
        })
        .filter((cliente): cliente is ClienteImportacao => {
          if (!cliente) return false;

          const nome = normalizar(texto(cliente.empresa));
          const razao = normalizar(texto(cliente.razao_social));
          const codigo = texto(cliente.codigo_cliente);
          const cnpj = texto(cliente.cnpj);

          if (!codigo && !nome && !razao && !cnpj) return false;
          if (nome.includes("nome fantasia")) return false;
          if (razao.includes("razao social")) return false;
          if (normalizar(codigo).includes("codigo")) return false;

          return true;
        });

      if (!clientesConvertidos.length) {
        alert("Nenhum dado válido encontrado para importação.");
        return;
      }

      setProgresso("Removendo duplicados da planilha...");

      const clientesUnicos = new Map<string, ClienteImportacao>();
      let duplicadosNaPlanilha = 0;
      let semCodigo = 0;

      for (const cliente of clientesConvertidos) {
        const codigo = texto(cliente.codigo_cliente);
        const cnpjNumeros = somenteNumeros(texto(cliente.cnpj));

        if (!codigo) {
          semCodigo++;
          continue;
        }

        // O código ERP completo é o identificador único:
        // 000000-00. Os 6 primeiros dígitos podem repetir; o sufixo da loja diferencia.
        const chave = `codigo:${codigo}`;

        if (clientesUnicos.has(chave)) {
          duplicadosNaPlanilha++;
          clientesUnicos.set(chave, mesclarCliente(clientesUnicos.get(chave)!, cliente));
        } else {
          clientesUnicos.set(chave, cliente);
        }

        // Mantido apenas para possível conferência futura.
        if (!cnpjNumeros) {
          // sem ação; CNPJ vazio não impede importação quando existe código ERP.
        }
      }

      const clientesParaImportar = Array.from(clientesUnicos.values());

      if (!clientesParaImportar.length) {
        alert("Nenhum cliente com código ERP válido foi encontrado para importar.");
        return;
      }

      let importados = 0;
      let ignoradosComErro = 0;
      let primeiraMensagemErro = "";

      const lotesImportacao = lotes(clientesParaImportar, 50);

      for (let i = 0; i < lotesImportacao.length; i++) {
        setProgresso(`Importando lote ${i + 1}/${lotesImportacao.length}...`);

        const { error } = await supabase.from("clientes").upsert(lotesImportacao[i], {
          onConflict: "codigo_cliente",
          ignoreDuplicates: false,
        });

        if (error) {
          console.error("Erro no lote de importação:", error);

          // Fallback: tenta item a item para não travar a planilha inteira.
          for (const cliente of lotesImportacao[i]) {
            const { error: erroItem } = await supabase.from("clientes").upsert(cliente, {
              onConflict: "codigo_cliente",
              ignoreDuplicates: false,
            });

            if (erroItem) {
              ignoradosComErro++;
              primeiraMensagemErro ||= `${texto(cliente.codigo_cliente)} - ${erroItem.message}`;
              console.error("Erro ao importar cliente:", cliente, erroItem);
            } else {
              importados++;
            }
          }
        } else {
          importados += lotesImportacao[i].length;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      alert(
        `Importação concluída.\n\n` +
          `Importados/atualizados: ${importados}\n` +
          `Duplicados ignorados na planilha: ${duplicadosNaPlanilha}\n` +
          `Linhas sem código ERP ignoradas: ${semCodigo}\n` +
          `Ignorados com erro: ${ignoradosComErro}` +
          (primeiraMensagemErro ? `\n\nPrimeiro erro:\n${primeiraMensagemErro}` : "")
      );

      onSucesso?.();
    } catch (err) {
      console.error("Erro na importação:", err);
      alert("Erro ao processar o arquivo .xlsx. Verifique o formato do arquivo.");
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
