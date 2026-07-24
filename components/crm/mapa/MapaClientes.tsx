'use client';

import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { Cliente } from '../../../types';
import { STATUS_COLORS, StatusType } from '../../../utils/constants';
import Button from '../../ui/Button';

type MapaClientesProps = {
  clientes: Cliente[];
  clienteSelecionadoId?: string | null;
  onSelecionarCliente?: (cliente: Cliente) => void;
};

type ClienteComCoordenadas = Cliente & {
  latitude: string;
  longitude: string;
};

const criarIcone = (cor: string) =>
  new L.DivIcon({
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        background: ${cor};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
        <div style="
          position: absolute;
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          top: 6px;
          left: 6px;
        "></div>
      </div>
    `,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });

const icones = Object.entries(STATUS_COLORS).reduce((acc, [key, value]) => {
  acc[key as StatusType] = criarIcone(value.hex);
  return acc;
}, {} as Record<StatusType, L.DivIcon>);

function normalizarStatusCliente(status?: string | null): StatusType {
  return status === 'Ativo' ? 'Ativo' : 'Inativo';
}

function BuscaMapa() {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: true,
      showPopup: true,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Pesquisar endereÃ§o...'
    }) as L.Control;

    map.addControl(searchControl);

    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
}

function AjustarBounds({ clientes }: { clientes: ClienteComCoordenadas[] }) {
  const map = useMap();

  useEffect(() => {
    if (!clientes.length) return;

    const bounds = L.latLngBounds(
      clientes.map((cliente) => [
        Number(cliente.latitude),
        Number(cliente.longitude)
      ])
    );

    map.fitBounds(bounds, {
      padding: [30, 30],
      maxZoom: 13
    });
  }, [clientes, map]);

  return null;
}

function CentralizarCliente({
  cliente
}: {
  cliente?: ClienteComCoordenadas;
}) {
  const map = useMap();

  useEffect(() => {
    if (!cliente) return;

    map.setView([Number(cliente.latitude), Number(cliente.longitude)], 14, {
      animate: true
    });
  }, [cliente, map]);

  return null;
}

export default function MapaClientes({
  clientes,
  clienteSelecionadoId,
  onSelecionarCliente
}: MapaClientesProps) {
  const clientesComCoordenadas = useMemo(() => {
    return clientes.filter((cliente): cliente is ClienteComCoordenadas => {
      if (!cliente.latitude || !cliente.longitude) return false;

      return (
        !Number.isNaN(Number(cliente.latitude)) &&
        !Number.isNaN(Number(cliente.longitude))
      );
    });
  }, [clientes]);

  const clienteSelecionado = clientesComCoordenadas.find(
    (cliente) => cliente.id === clienteSelecionadoId
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <MapContainer
        center={[-15.7801, -47.9292]}
        zoom={4}
        scrollWheelZoom
        className="z-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <BuscaMapa />
        <AjustarBounds clientes={clientesComCoordenadas} />
        <CentralizarCliente cliente={clienteSelecionado} />

        {clientesComCoordenadas.map((cliente) => {
          const status = normalizarStatusCliente(cliente.status);
          const icone = icones[status] || icones.Inativo;

          return (
            <Marker
              key={cliente.id}
              position={[Number(cliente.latitude), Number(cliente.longitude)]}
              icon={icone}
            >
              <Popup>
                <div className="space-y-2">
                  <div>
                    <strong>{cliente.empresa}</strong>
                    <br />
                    <span>
                      {[cliente.cidade, cliente.estado].filter(Boolean).join(' - ')}
                    </span>
                    <br />
                    <span>Status: {status}</span>
                  </div>

                  {onSelecionarCliente ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onSelecionarCliente(cliente)}
                      className="rounded"
                    >
                      Abrir detalhes
                    </Button>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-sm">
        <p className="mb-2 font-bold text-slate-700">Legenda</p>
        <div className="grid gap-1">
          {Object.entries(STATUS_COLORS).map(([status, cor]) => (
            <span key={status} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: cor.hex }}
              />
              {status}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}



