import { FiltrosAuditoria } from '../../../hooks/useAuditoria';
import Button from '../../ui/Button';

type AuditoriaFiltrosProps = {
  filtros: FiltrosAuditoria;
  tabelas: string[];
  acoes: string[];
  origens: string[];
  loading: boolean;
  onChange: (filtros: FiltrosAuditoria) => void;
  onAtualizar: () => void;
};

const limites = [50, 100, 200, 500];

export default function AuditoriaFiltros({
  filtros,
  tabelas,
  acoes,
  origens,
  loading,
  onChange,
  onAtualizar
}: AuditoriaFiltrosProps) {
  function atualizar(campo: keyof FiltrosAuditoria, valor: string | number) {
    onChange({
      ...filtros,
      [campo]: valor
    });
  }

  function limparFiltros() {
    onChange({
      dataInicio: '',
      dataFim: '',
      usuario: '',
      tabela: '',
      acao: '',
      origem: '',
      busca: '',
      limite: 200
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 lg:grid-cols-6">
        <label className="space-y-1 text-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Data inicial
          </span>
          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(event) => atualizar('dataInicio', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Data final
          </span>
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(event) => atualizar('dataFim', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Usuário
          </span>
          <input
            type="search"
            value={filtros.usuario}
            onChange={(event) => atualizar('usuario', event.target.value)}
            placeholder="email"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Tabela
          </span>
          <select
            value={filtros.tabela}
            onChange={(event) => atualizar('tabela', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {tabelas.map((tabela) => (
              <option key={tabela} value={tabela}>
                {tabela}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Ação
          </span>
          <select
            value={filtros.acao}
            onChange={(event) => atualizar('acao', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {acoes.map((acao) => (
              <option key={acao} value={acao}>
                {acao}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Origem
          </span>
          <select
            value={filtros.origem}
            onChange={(event) => atualizar('origem', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {origens.map((origem) => (
              <option key={origem} value={origem}>
                {origem}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_160px_auto_auto] lg:items-end">
        <label className="space-y-1 text-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Busca geral
          </span>
          <input
            type="search"
            value={filtros.busca}
            onChange={(event) => atualizar('busca', event.target.value)}
            placeholder="cliente, código, arquivo, registro ou detalhe"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Limite
          </span>
          <select
            value={filtros.limite}
            onChange={(event) => atualizar('limite', Number(event.target.value))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {limites.map((limite) => (
              <option key={limite} value={limite}>
                {limite}
              </option>
            ))}
          </select>
        </label>

        <Button type="button" variant="secondary" onClick={limparFiltros}>
          Limpar
        </Button>

        <Button type="button" onClick={onAtualizar} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>
    </div>
  );
}
