import { SEGMENTOS_CLIENTES } from '../../../utils/constants';

export default function ImportarERPSegmentosOficiais() {
  return (
    <section
      aria-labelledby="importar-erp-segmentos-oficiais"
      className="rounded-2xl border border-blue-100 bg-blue-50 p-4"
    >
      <p
        id="importar-erp-segmentos-oficiais"
        className="text-sm font-semibold text-blue-900"
      >
        Segmentos oficiais aceitos na coluna EK
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {SEGMENTOS_CLIENTES.map((segmento) => (
          <span
            key={segmento}
            className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-blue-700"
          >
            {segmento}
          </span>
        ))}
      </div>

      <p className="mt-2 text-xs text-blue-700">
        Células vazias são desconsideradas. Valores fora dessa lista não serão
        gravados como segmento.
      </p>
    </section>
  );
}
