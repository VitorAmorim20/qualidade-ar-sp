import { useEffect } from "react";
import { Circle, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { ESTACOES_MAPA } from "./estacoesMapa";
import "leaflet/dist/leaflet.css";

const CENTRO_SP = [-23.555, -46.61];

function EnquadrarEstacoes() {
  const map = useMap();
  useEffect(() => {
    const limites = ESTACOES_MAPA.map((item) => [item.lat, item.lng]);
    map.fitBounds(limites, { padding: [36, 36], maxZoom: 12 });
  }, [map]);
  return null;
}

export default function MapaEstacoes({ selecionada, onSelect }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="font-semibold text-white">Regiões monitoradas</h2>
          <p className="text-xs text-slate-400">
            Clique em uma área colorida para filtrar. Clique de novo ou em Todas para
            ver a cidade inteira.
          </p>
        </div>
        {selecionada ? (
          <button
            type="button"
            onClick={() => onSelect("")}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
          >
            Todas as regiões
          </button>
        ) : (
          <span className="text-xs text-slate-500">Todas as regiões</span>
        )}
      </div>

      <div className="relative h-[420px] sm:h-[500px]">
        <MapContainer
          center={CENTRO_SP}
          zoom={12}
          minZoom={10}
          maxZoom={14}
          scrollWheelZoom
          className="mapa-sp h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <EnquadrarEstacoes />
          {ESTACOES_MAPA.map((estacao) => {
            const ativa = !selecionada || selecionada === estacao.nome;
            const marcada = selecionada === estacao.nome;
            return (
              <Circle
                key={estacao.nome}
                center={[estacao.lat, estacao.lng]}
                radius={estacao.raio}
                pathOptions={{
                  color: marcada ? "#ffffff" : estacao.cor,
                  weight: marcada ? 3 : 1.5,
                  fillColor: estacao.cor,
                  fillOpacity: ativa ? 0.72 : 0.18,
                }}
                eventHandlers={{
                  click: (evento) => {
                    evento.originalEvent?.stopPropagation();
                    onSelect(marcada ? "" : estacao.nome);
                  },
                }}
              >
                <Tooltip
                  direction={estacao.rotulo || "center"}
                  permanent
                  className="mapa-rotulo"
                >
                  {estacao.nome}
                </Tooltip>
              </Circle>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
