export const ESTACOES_MAPA = [
  { nome: "Lapa", lat: -23.5217, lng: -46.7044, raio: 2200, cor: "#9ca3af" },
  { nome: "Pinheiros", lat: -23.5674, lng: -46.6932, raio: 1300, cor: "#f472b6" },
  { nome: "Santana", lat: -23.5028, lng: -46.6289, raio: 2100, cor: "#a8a03a" },
  { nome: "Marginal Tietê", lat: -23.5168, lng: -46.5824, raio: 2400, cor: "#f59e0b" },
  { nome: "Centro", lat: -23.5505, lng: -46.6333, raio: 1700, cor: "#7dd3fc" },
  { nome: "Paulista", lat: -23.5614, lng: -46.656, raio: 1100, cor: "#4ade80", rotulo: "top" },
  { nome: "Ibirapuera", lat: -23.5874, lng: -46.6576, raio: 1400, cor: "#86efac", rotulo: "left" },
  { nome: "Moema", lat: -23.6019, lng: -46.6666, raio: 1600, cor: "#84cc16", rotulo: "bottom" },
  { nome: "Vila Mariana", lat: -23.5893, lng: -46.6346, raio: 1500, cor: "#67e8f9", rotulo: "right" },
  { nome: "Santo Amaro", lat: -23.6544, lng: -46.7106, raio: 2600, cor: "#d8b4fe" },
  { nome: "Itaquera", lat: -23.5401, lng: -46.4555, raio: 2600, cor: "#93c5fd" },
  { nome: "São Mateus", lat: -23.5983, lng: -46.4817, raio: 2500, cor: "#22d3ee" },
];

export const COR_ESTACAO = Object.fromEntries(
  ESTACOES_MAPA.map((item) => [item.nome, item.cor])
);
