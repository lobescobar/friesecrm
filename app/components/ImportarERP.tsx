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

const texto = (valor: any) => String(valor ?? "").trim();

const normalizar = (valor: string) =>
  texto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const somenteNumeros = (valor: string) => texto(valor).replace(/\D/g, "");

function acharIndice(headers: any[], nomes: string[]) {
  const cabecalhos = headers.map((item) => normalizar(String(item ?? "")));
  const nomesNormalizados = nomes.map(normalizar);

  return cabecalhos.findIndex((cabecalho) =>
    nomesNormalizados.some(
      (nome) => cabecalho === nome || cabecalho.includes(nome)
    )
  );
}

function porCabecalho(linha: any[], headers: any[], nomes: string[]) {
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

function montarCodigoCliente(codigoOriginal: string, lojaOriginal: string) {
  const codigoTexto = texto(codigoOriginal);
  const lojaTexto = texto(lojaOriginal);

  if (!codigoTexto) return "";

  // Caso a planilha já venha com o código completo no formato 000000-00.
  const codigoCompleto = codigoTexto.match(/^(\d{1,6})\s*-\s*(\d{1,2})$/);

  if (codigoCompleto) {
    const codigo = codigoCompleto[1].padStart(6, "0");
    const loja = codigoCompleto[2].padStart(2, "0");
    return `${codigo}-${loja}`;
  }

  const codigoNumeros = somenteNumeros(codigoTexto);
  const lojaNumeros = somenteNumeros(lojaTexto);

  if (!codigoNumeros) return "";

  // Se vierem 8 dígitos e não houver coluna Loja, considera os 2 últimos como loja.
  if (!lojaNumeros && codigoNumeros.length > 6) {
    const codigo = codigoNumeros.slice(0, 6).padStart(6, "0");
    const loja = codigoNumeros.slice(6, 8).padStart(2, "0");
    return `${codigo}-${loja}`;
  }

  const codigo = codigoNumeros.slice(0, 6).padStart(6, "0");
  const loja = (lojaNumeros || "0").slice(0, 2).padStart(2, "0");

  return `${codigo}-${loja}`;
}

async function carregarClientesExistentes(
  setProgresso: (mensagem: string) => void
) {
  const todos: Array<{ id: string; codigo_cliente?: string; cnpj?: string }> = [];
  const tamanhoPagina = 1000;
  let inicio = 0;

  while (true) {
    setProgresso(`Buscando clientes existentes... ${todos.length}`);

    const { data, error } = await supabase
      .from("clientes")
      .select("id, codigo_cliente, cnpj")
      .range(inicio, inicio + tamanhoPagina - 1);

    if (error) {
      throw new Error(`Erro ao consultar clientes existentes: ${error.message}`);
    }

    const pagina = data || [];
    todos.push(...pagina);

    if (pagina.length < tamanhoPagina) break;

    inicio += tamanhoPagina;
  }

  return todos;
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

      const rows: any[][] = XLSX.utils.sheet_to_json(aba, {
        header: 1,
        defval: "",
        blankrows: false,
        raw: false,
      });

      if (!rows.length) {
        alert("A planilha está vazia.");
        return;
      }

      let headerIndex = -1;

      for (let i = 0; i < rows.length; i++) {
        const linha = rows[i].map((celula) => normalizar(String(celula ?? "")));
        const temCodigo = linha.some(
          (valor) =>
            valor === "codigo" ||
            valor === "cod" ||
            valor.includes("codigo")
        );
        const temNome = linha.some(
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
          'Não foi possível encontrar o cabeçalho da planilha. Verifique se existe a coluna "Codigo".'
        );
        return;
      }

      const headers = rows[headerIndex];
      const linhasDados = rows.slice(headerIndex + 1);

      setProgresso("Convertendo dados da planilha...");

      const clientesUnicos = new Map<string, ClienteImportacao>();
      let ignoradosSemCodigo = 0;

      for (const linha of linhasDados) {
        // Colunas fixas do ERP:
        // D = Razão Social | E = Nome Fantasia | AF = CNPJ
        const razaoSocialD = texto(linha[3]);
        const nomeFantasiaE = texto(linha[4]);
        const cnpjAF = texto(linha[31]);

        const codigo =
          porCabecalho(linha, headers, ["Codigo", "Código", "Cod"]) ||
          texto(linha[0]);

        const loja =
          porCabecalho(linha, headers, ["Loja"]) ||
          texto(linha[1]);

        const codigo_cliente = montarCodigoCliente(codigo, loja);

        if (!codigo_cliente) {
          ignoradosSemCodigo++;
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
          cnpjAF || porCabecalho(linha, headers, ["CNPJ", "CNPJ/CPF", "CNPJ CPF"]);

        if (!empresa && !razao_social && !cnpj) continue;

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

        const cliente: ClienteImportacao = {
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

        const chave = codigo_cliente;

        // Se o mesmo código aparecer duas vezes na própria planilha,
        // mantém a última ocorrência e envia apenas uma vez ao Supabase.
        clientesUnicos.set(chave, cliente);
      }

      const clientesParaImportar = Array.from(clientesUnicos.values());

      if (!clientesParaImportar.length) {
        alert("Nenhum cliente com código ERP válido foi encontrado para importar.");
        return;
      }

      const existentes = await carregarClientesExistentes(setProgresso);

      const porCodigo = new Map<string, string>();
      const porCnpj = new Map<string, string>();

      existentes.forEach((cliente) => {
        const codigo = texto(cliente.codigo_cliente);
        const cnpj = somenteNumeros(texto(cliente.cnpj));

        if (codigo && !porCodigo.has(codigo)) {
          porCodigo.set(codigo, cliente.id);
        }

        if (cnpj && !porCnpj.has(cnpj)) {
          porCnpj.set(cnpj, cliente.id);
        }
      });

      const paraInserir: ClienteImportacao[] = [];
      const paraAtualizar: Array<{ id: string; dados: ClienteImportacao }> = [];
      const codigosReservados = new Set(porCodigo.keys());
      let ignoradosDuplicados = 0;

      clientesParaImportar.forEach((cliente) => {
        const codigo = texto(cliente.codigo_cliente);
        const cnpj = somenteNumeros(texto(cliente.cnpj));

        const idPorCodigo = codigo ? porCodigo.get(codigo) : "";
        const idPorCnpj = cnpj ? porCnpj.get(cnpj) : "";
        const id = idPorCodigo || idPorCnpj || "";

        const dados: ClienteImportacao = { ...cliente };

        if (id) {
          // Nunca tenta trocar o código ERP de um cliente já existente.
          // Isso elimina o erro de chave única clientes_codigo_cliente_unique.
          delete dados.codigo_cliente;
          paraAtualizar.push({ id, dados });
          return;
        }

        if (codigo && codigosReservados.has(codigo)) {
          ignoradosDuplicados++;
          return;
        }

        if (codigo) {
          codigosReservados.add(codigo);
        }

        paraInserir.push(dados);
      });

      let inseridos = 0;
      let atualizados = 0;
      let ignoradosComErro = 0;
      let primeiraMensagemErro = "";

      const lotesInsercao = lotes(paraInserir, 50);

      for (let i = 0; i < lotesInsercao.length; i++) {
        setProgresso(`Inserindo lote ${i + 1}/${lotesInsercao.length}...`);

        const { error } = await supabase.from("clientes").insert(lotesInsercao[i]);

        if (error) {
          console.warn("Erro ao inserir lote:", error.message);
          primeiraMensagemErro ||= error.message;
          ignoradosComErro += lotesInsercao[i].length;
        } else {
          inseridos += lotesInsercao[i].length;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const lotesAtualizacao = lotes(paraAtualizar, 10);

      for (let i = 0; i < lotesAtualizacao.length; i++) {
        setProgresso(`Atualizando lote ${i + 1}/${lotesAtualizacao.length}...`);

        for (const item of lotesAtualizacao[i]) {
          const { error } = await supabase
            .from("clientes")
            .update(item.dados)
            .eq("id", item.id);

          if (error) {
  console.warn("Erro ao atualizar cliente:", error.message);
  ignoradosComErro++;

  if (!primeiraMensagemErro) {
    primeiraMensagemErro = error.message;
  }
} else {
  atualizados++;
}
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      alert(
        `Importação concluída.\n\n` +
          `Inseridos: ${inseridos}\n` +
          `Atualizados: ${atualizados}\n` +
          `Ignorados sem código ERP: ${ignoradosSemCodigo}\n` +
          `Ignorados por código duplicado: ${ignoradosDuplicados}\n` +
          `Ignorados com erro: ${ignoradosComErro}` +
          (primeiraMensagemErro ? `\n\nPrimeiro erro: ${primeiraMensagemErro}` : "")
      );

      onSucesso?.();
    } catch (err) {
      console.error("Erro na importação:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Erro ao processar o arquivo .xlsx. Verifique o formato do arquivo."
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
