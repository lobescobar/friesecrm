export default function ClienteChamadoEquipamentos() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">
          Chamado Equipamentos
        </h4>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
        Nenhum chamado de equipamento registrado.
      </div>
    </section>
  );
}
