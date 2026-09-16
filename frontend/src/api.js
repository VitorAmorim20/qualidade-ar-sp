const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function query(params) {
  const busca = new URLSearchParams();
  Object.entries(params).forEach(([chave, valor]) => {
    if (valor) busca.set(chave, valor);
  });
  const texto = busca.toString();
  return texto ? `?${texto}` : "";
}

async function get(caminho, params = {}) {
  const resposta = await fetch(`${API}${caminho}${query(params)}`);
  if (!resposta.ok) {
    throw new Error(`Falha ao consultar ${caminho}`);
  }
  return resposta.json();
}

export const api = {
  saude: () => get("/saude"),
  filtros: () => get("/filtros"),
  kpis: (params) => get("/kpis", params),
  registros: (params) => get("/registros", params),
  estacoes: (params) => get("/estacoes", params),
  estatistica: (params) => get("/estatistica", params),
  recomendacoes: (params) => get("/recomendacoes", params),
};

export { API };
