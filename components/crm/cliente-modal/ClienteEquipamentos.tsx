'use client';

import { useId, useState } from 'react';
import { useEquipamentosCliente } from '../../../hooks/useEquipamentosCliente';
import type { EquipamentoCliente } from '../../../types';
import Button from '../../ui/Button';

type FormularioEquipamento = {
  modelo_maquina: string;
  fabricante: string;
  codigo_maquina: string;
  matrizes_ano: string;
  capas_ano: string;
  historico: string;
};

type CamposEquipamentoProps = {
  formulario: FormularioEquipamento;
  prefixo: string;
  desabilitado?: boolean;
  onChange: (formulario: FormularioEquipamento) => void;
};

const formularioVazio: FormularioEquipamento = {
  modelo_maquina: '',
  fabricante: '',
  codigo_maquina: '',
  matrizes_ano: '',
  capas_ano: '',
  historico: ''
};

function CamposEquipamento({
  formulario,
  prefixo,
  desabilitado = false,
  onChange
}: CamposEquipamentoProps) {
  const alterar = (campo: keyof FormularioEquipamento, valor: string) => {
    onChange({ ...formulario, [campo]: valor });
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block" htmlFor={`${prefixo}-modelo`}>
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Modelo da máquina
        </span>
        <input
          id={`${prefixo}-modelo`}
          type="text"
          required
          maxLength={150}
          value={formulario.modelo_maquina}
          onChange={(event) => alterar('modelo_maquina', event.target.value)}
          disabled={desabilitado}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block" htmlFor={`${prefixo}-fabricante`}>
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Fabricante
        </span>
        <input
          id={`${prefixo}-fabricante`}
          type="text"
          maxLength={150}
          value={formulario.fabricante}
          onChange={(event) => alterar('fabricante', event.target.value)}
          disabled={desabilitado}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block" htmlFor={`${prefixo}-codigo`}>
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Cód. da máquina
        </span>
        <input
          id={`${prefixo}-codigo`}
          type="text"
          maxLength={100}
          value={formulario.codigo_maquina}
          onChange={(event) => alterar('codigo_maquina', event.target.value)}
          disabled={desabilitado}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block" htmlFor={`${prefixo}-matrizes`}>
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Matrizes/ano
          </span>
          <input
            id={`${prefixo}-matrizes`}
            type="number"
            min={0}
            max={999999999}
            step={1}
            inputMode="numeric"
            value={formulario.matrizes_ano}
            onChange={(event) => alterar('matrizes_ano', event.target.value)}
            disabled={desabilitado}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block" htmlFor={`${prefixo}-capas`}>
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Capas/ano
          </span>
          <input
            id={`${prefixo}-capas`}
            type="number"
            min={0}
            max={999999999}
            step={1}
            inputMode="numeric"
            value={formulario.capas_ano}
            onChange={(event) => alterar('capas_ano', event.target.value)}
            disabled={desabilitado}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="block sm:col-span-2" htmlFor={`${prefixo}-historico`}>
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Histórico
        </span>
        <textarea
          id={`${prefixo}-historico`}
          rows={4}
          maxLength={10000}
          value={formulario.historico}
          onChange={(event) => alterar('historico', event.target.value)}
          disabled={desabilitado}
          className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm"
          placeholder="Registre informações, manutenções ou observações sobre o equipamento."
        />
      </label>
    </div>
  );
}

function montarFormulario(equipamento: EquipamentoCliente) {
  return {
    modelo_maquina: equipamento.modelo_maquina,
    fabricante: equipamento.fabricante || '',
    codigo_maquina: equipamento.codigo_maquina || '',
    matrizes_ano: equipamento.matrizes_ano?.toString() || '',
    capas_ano: equipamento.capas_ano?.toString() || '',
    historico: equipamento.historico || ''
  };
}

function obterQuantidade(valor: string) {
  return valor.trim() ? Number(valor) : null;
}

function validarFormulario(formulario: FormularioEquipamento) {
  if (!formulario.modelo_maquina.trim()) {
    return 'Informe o modelo da máquina.';
  }

  const quantidades = [
    ['Matrizes/ano', formulario.matrizes_ano],
    ['Capas/ano', formulario.capas_ano]
  ] as const;

  for (const [rotulo, valor] of quantidades) {
    if (!valor.trim()) continue;

    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 0 || numero > 999999999) {
      return `${rotulo} deve ser um número inteiro maior ou igual a zero.`;
    }
  }

  return null;
}

function montarDados(formulario: FormularioEquipamento) {
  return {
    modelo_maquina: formulario.modelo_maquina.trim(),
    fabricante: formulario.fabricante.trim() || null,
    codigo_maquina: formulario.codigo_maquina.trim() || null,
    matrizes_ano: obterQuantidade(formulario.matrizes_ano),
    capas_ano: obterQuantidade(formulario.capas_ano),
    historico: formulario.historico.trim() || null
  };
}

function formatarQuantidade(valor?: number | null) {
  return valor === null || valor === undefined
    ? '-'
    : new Intl.NumberFormat('pt-BR').format(valor);
}

export default function ClienteEquipamentos({ clienteId }: { clienteId: string }) {
  const { equipamentos, carregando, erro, adicionar, atualizar, excluir } =
    useEquipamentosCliente(clienteId);
  const [novo, setNovo] = useState<FormularioEquipamento>(formularioVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<FormularioEquipamento>(formularioVazio);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const tituloId = useId();

  const cadastrar = async () => {
    const erroValidacao = validarFormulario(novo);
    if (erroValidacao) {
      setMensagem(erroValidacao);
      return;
    }

    setSalvando(true);
    setMensagem(null);

    const equipamento = await adicionar({
      cliente_id: clienteId,
      ...montarDados(novo)
    });

    setSalvando(false);
    if (equipamento) {
      setNovo(formularioVazio);
      setMensagem('Equipamento cadastrado com sucesso.');
    }
  };

  const iniciarEdicao = (equipamento: EquipamentoCliente) => {
    setEditandoId(equipamento.id);
    setEdicao(montarFormulario(equipamento));
    setMensagem(null);
  };

  const salvarEdicao = async (id: string) => {
    const erroValidacao = validarFormulario(edicao);
    if (erroValidacao) {
      setMensagem(erroValidacao);
      return;
    }

    setSalvando(true);
    setMensagem(null);
    const equipamento = await atualizar(id, montarDados(edicao));
    setSalvando(false);

    if (equipamento) {
      setEditandoId(null);
      setMensagem('Equipamento atualizado com sucesso.');
    }
  };

  const excluirEquipamento = async (equipamento: EquipamentoCliente) => {
    const confirmou = window.confirm(
      `Deseja excluir o equipamento ${equipamento.modelo_maquina}?`
    );
    if (!confirmou) return;

    setSalvando(true);
    setMensagem(null);
    const sucesso = await excluir(equipamento.id);
    setSalvando(false);
    setMensagem(
      sucesso
        ? 'Equipamento excluído com sucesso.'
        : 'Não foi possível excluir o equipamento.'
    );
  };

  const textoMensagem = mensagem || erro;
  const mensagemEhErro = Boolean(erro) || textoMensagem?.startsWith('Informe') ||
    textoMensagem?.includes('deve ser') || textoMensagem?.startsWith('Não foi possível');

  return (
    <section aria-labelledby={tituloId} className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h4
          id={tituloId}
          className="text-xs font-bold uppercase tracking-widest text-slate-400"
        >
          Equipamentos
        </h4>
        <span className="text-xs font-semibold text-slate-500">
          {equipamentos.length} cadastrado(s)
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h5 className="mb-3 text-sm font-bold text-slate-800">
          Novo equipamento
        </h5>
        <CamposEquipamento
          formulario={novo}
          prefixo="novo-equipamento"
          desabilitado={salvando}
          onChange={setNovo}
        />
        <Button
          type="button"
          onClick={cadastrar}
          disabled={salvando}
          loading={salvando}
          loadingText="Cadastrando equipamento..."
          className="mt-3 w-full sm:w-auto"
        >
          Cadastrar equipamento
        </Button>
      </div>

      {textoMensagem ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            mensagemEhErro
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-700'
          }`}
          role={mensagemEhErro ? 'alert' : 'status'}
        >
          {textoMensagem}
        </div>
      ) : null}

      {carregando ? (
        <div className="py-6 text-center text-sm text-slate-500" role="status">
          Carregando equipamentos...
        </div>
      ) : equipamentos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm font-medium text-slate-500">
          Nenhum equipamento registrado.
        </div>
      ) : (
        <div className="space-y-3">
          {equipamentos.map((equipamento) => {
            const editando = editandoId === equipamento.id;

            return (
              <article
                key={equipamento.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {editando ? (
                  <div className="space-y-3">
                    <CamposEquipamento
                      formulario={edicao}
                      prefixo={`equipamento-${equipamento.id}`}
                      desabilitado={salvando}
                      onChange={setEdicao}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => salvarEdicao(equipamento.id)}
                        disabled={salvando}
                        loading={salvando}
                        loadingText="Salvando equipamento..."
                      >
                        Salvar
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditandoId(null)}
                        disabled={salvando}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h5 className="font-bold text-slate-900">
                          {equipamento.modelo_maquina}
                        </h5>
                        <p className="text-sm text-slate-500">
                          {equipamento.fabricante || 'Fabricante não informado'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => iniciarEdicao(equipamento)}
                          disabled={salvando}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => excluirEquipamento(equipamento)}
                          disabled={salvando}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>

                    <dl className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Cód. da máquina
                        </dt>
                        <dd className="mt-1 font-semibold text-slate-700">
                          {equipamento.codigo_maquina || '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Matrizes/ano
                        </dt>
                        <dd className="mt-1 font-semibold text-slate-700">
                          {formatarQuantidade(equipamento.matrizes_ano)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Capas/ano
                        </dt>
                        <dd className="mt-1 font-semibold text-slate-700">
                          {formatarQuantidade(equipamento.capas_ano)}
                        </dd>
                      </div>
                    </dl>

                    {equipamento.historico ? (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Histórico
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {equipamento.historico}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
