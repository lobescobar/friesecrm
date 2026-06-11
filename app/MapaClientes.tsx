'use client'

import { useEffect, useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-geosearch/dist/geosearch.css'
import L from 'leaflet'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import { STATUS_COLORS, StatusType } from '../utils/constants'
import { Cliente } from '../types'

// Configuração dos ícones do Leaflet para evitar erro de imagem não encontrada
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
    popupAnchor: [0, -24],
  })

const icones = Object.entries(STATUS_COLORS).reduce((acc, [key, value]) => {
  acc[key as StatusType] = criarIcone(value.hex);
  return acc;
}, {} as Record<StatusType, L.DivIcon>);

// Componente para adicionar o controle de busca com segurança
function BuscaMapa() {
  const map = useMap()

  useEffect(() => {
    const provider = new OpenStreetMapProvider()
    const searchControl = GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: true,
      showPopup: true,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Pesquisar endereço...',
    })

    // Adiciona o controle ao mapa
    map.addControl(searchControl as any)

    // Remove o controle ao desmontar o componente para evitar o erro appendChild
    return () => {
      map.removeControl(searchControl as any)
    }
  }, [map])

  return null
}

export default function MapaClientes({ clientes }: { clientes: Cliente[] }) {
  // Memoiza os clientes com coordenadas para evitar filtragem em toda renderização
  const clientesComCoordenadas = useMemo(() => {
    return clientes.filter(
      (c) => c.latitude && c.longitude && !isNaN(parseFloat(c.latitude)) && !isNaN(parseFloat(c.longitude))
    )
  }, [clientes])

  return (
    <MapContainer
      center={[-15.7801, -47.9292]} // Centro do Brasil
      zoom={4}
      scrollWheelZoom={true}
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <BuscaMapa />

      {clientesComCoordenadas.map((cliente) => (
        <Marker
          key={cliente.id}
          position={[parseFloat(cliente.latitude!), parseFloat(cliente.longitude!)]}
          icon={icones[cliente.status as StatusType] || icones.Novo}
        >
          <Popup>
            <div className="text-sm">
              <strong className="block text-base">{cliente.empresa}</strong>
              <span className="text-slate-500">{cliente.cidade} - {cliente.estado}</span>
              <div className="mt-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  STATUS_COLORS[cliente.status as StatusType]?.classes || STATUS_COLORS.Novo.classes
                }`}>
                  {cliente.status}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
