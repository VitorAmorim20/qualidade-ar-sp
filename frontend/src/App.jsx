import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "./api";

const VISÕES = [
  { id: "operacional", rotulo: "Operacional" },
  { id: "tatico", rotulo: "Tático" },
  { id: "estrategico", rotulo: "Estratégico" },
];

const CORES_QUALIDADE = {
  Boa: "#16a34a",
  Moderada: "#d97706",
  Ruim: "#dc2626",
};

function formatarNumero(valor, casas = 1) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function formatarP(valor) {
  if (valor === null || valor === undefined) return "—";
  if (valor < 0.001) return "< 0,001";
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 4 });
}

export default function App() {
  const [visao, setVisao] = useState("operacional");
  const [filtros, setFiltros] = useState(null);
  const [params, setParams] = useState({
    estacao: "",
    qualidade: "",
    inicio: "",
    fim: "",
  });
  const [kpis, setKpis] = useState(null);
  const [estacoes, setEstacoes] = useState([]);
  const [registros, setRegistros] = useState({ itens: [], serieDiaria: [] });
  const [estatistica, setEstatistica] = useState(null);
  const [recomendacoes, setRecomendacoes] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api
      .filtros()
      .then((dados) => {
        setFiltros(dados);
        setParams((atual) => ({
          ...atual,
          inicio: atual.inicio || dados.inicio,
          fim: atual.fim || dados.fim,
        }));
      })
      .catch(() => setErro("Não foi possível conectar à API. Verifique o VITE_API_URL."));
  }, []);

  useEffect(() => {
    if (!params.inicio || !params.fim) return;
    let ativo = true;
    setCarregando(true);
    Promise.all([
      api.kpis(params),
      api.estacoes(params),
      api.registros(params),
      api.estatistica(params),
      api.recomendacoes(params),
    ])
      .then(([k, e, r, s, rec]) => {
        if (!ativo) return;
        setKpis(k);
        setEstacoes(e);
        setRegistros(r);
        setEstatistica(s);
        setRecomendacoes(rec);
        setErro("");
      })
      .catch(() => {
        if (ativo) setErro("Falha ao carregar os indicadores.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [params]);

  const heatmap = useMemo(() => {
    if (!estatistica?.matrizCorrelacao) return [];
    const { colunas, valores } = estatistica.matrizCorrelacao;
    const nomes = colunas.map((c) => c.split(" (")[0]);
    const celulas = [];
    valores.forEach((linha, i) => {
      linha.forEach((valor, j) => {
        celulas.push({ x: nomes[j], y: nomes[i], v: valor });
      });
    });
    return { nomes, valores };
  }, [estatistica]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ar-500">
              Gestão pública · São Paulo
            </p>
            <h1 className="mt-1 text-2xl font-bold text-ar-900 sm:text-3xl">
              Qualidade do ar
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Leituras de agosto de 2026 por região, tráfego e poluentes. Painel para
              operação, tática e decisão estratégica.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {VISÕES.map((item) => (
              <button
                key={item.id}
                onClick={() => setVisao(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  visao === item.id
                    ? "bg-ar-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.rotulo}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Filtros filtros={filtros} params={params} setParams={setParams} />

        {erro && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        {carregando && !kpis ? (
          <p className="text-sm text-slate-500">Carregando indicadores…</p>
        ) : null}

        {visao === "operacional" && kpis && (
          <Operacional kpis={kpis} estacoes={estacoes} />
        )}
        {visao === "tatico" && (
          <Tatico
            registros={registros}
            estacoes={estacoes}
            r={estatistica?.pearsonTrafegoPm25?.r}
          />
        )}
        {visao === "estrategico" && estatistica && (
          <Estrategico
            estatistica={estatistica}
            heatmap={heatmap}
            recomendacoes={recomendacoes}
          />
        )}
      </main>
    </div>
  );
}

function Filtros({ filtros, params, setParams }) {
  if (!filtros) return null;
  const campo =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-ar-500";
  return (
    <section className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Estação / região
        <select
          className={campo}
          value={params.estacao}
          onChange={(e) => setParams({ ...params, estacao: e.target.value })}
        >
          <option value="">Todas</option>
          {filtros.estacoes.map((estacao) => (
            <option key={estacao} value={estacao}>
              {estacao}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Classificação
        <select
          className={campo}
          value={params.qualidade}
          onChange={(e) => setParams({ ...params, qualidade: e.target.value })}
        >
          <option value="">Todas</option>
          {filtros.qualidades.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Início
        <input
          type="date"
          className={campo}
          value={params.inicio}
          min={filtros.inicio}
          max={filtros.fim}
          onChange={(e) => setParams({ ...params, inicio: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Fim
        <input
          type="date"
          className={campo}
          value={params.fim}
          min={filtros.inicio}
          max={filtros.fim}
          onChange={(e) => setParams({ ...params, fim: e.target.value })}
        />
      </label>
    </section>
  );
}

function Cartao({ titulo, valor, detalhe }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-2 text-2xl font-bold text-ar-900">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-slate-500">{detalhe}</p>}
    </article>
  );
}

function Operacional({ kpis, estacoes }) {
  return (
    <section className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          titulo="PM2.5 médio"
          valor={`${formatarNumero(kpis.pm25Medio)} µg/m³`}
          detalhe={`${kpis.diasAcima50} leituras acima de 50 µg/m³`}
        />
        <Cartao
          titulo="Tráfego médio"
          valor={`${formatarNumero(kpis.trafegoMedio, 0)} veíc/h`}
        />
        <Cartao
          titulo="Dias classificados Ruim"
          valor={`${formatarNumero(kpis.percentualRuim, 1)}%`}
          detalhe={`${formatarNumero(kpis.percentualBoa, 1)}% Boa · ${formatarNumero(kpis.percentualModerada, 1)}% Moderada`}
        />
        <Cartao
          titulo="Pior estação no recorte"
          valor={kpis.piorEstacao?.estacao || "—"}
          detalhe={
            kpis.piorEstacao
              ? `PM2.5 médio ${formatarNumero(kpis.piorEstacao.pm25Medio)} µg/m³`
              : null
          }
        />
      </div>

      {kpis.piorEstacao?.estacao === "Marginal Tietê" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Alerta operacional: a Marginal Tietê concentra os piores índices. Acionar
          boletim à população sensível e reforçar o monitoramento do corredor.
        </div>
      )}

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-ar-900">Ranking das estações</h2>
          <p className="text-xs text-slate-500">Ordenado pelo PM2.5 médio do recorte</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Estação</th>
                <th className="px-4 py-2">PM2.5</th>
                <th className="px-4 py-2">Tráfego</th>
                <th className="px-4 py-2">Dias Ruim</th>
                <th className="px-4 py-2">Dias Boa</th>
              </tr>
            </thead>
            <tbody>
              {estacoes.map((item) => (
                <tr key={item.estacao} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{item.estacao}</td>
                  <td className="px-4 py-2">{formatarNumero(item.pm25Medio)}</td>
                  <td className="px-4 py-2">{formatarNumero(item.trafegoMedio, 0)}</td>
                  <td className="px-4 py-2 text-red-600">{item.diasRuim}</td>
                  <td className="px-4 py-2 text-green-700">{item.diasBoa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function Tatico({ registros, estacoes, r }) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-ar-900">Tráfego × PM2.5</h2>
        <p className="mb-3 text-xs text-slate-500">
          Cada ponto é uma leitura diária. r = {formatarNumero(r, 2)}
        </p>
        <div className="h-72">
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trafego" name="Tráfego" type="number" />
              <YAxis dataKey="pm25" name="PM2.5" type="number" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={registros.itens} fill="#145c45">
                {registros.itens.map((item, indice) => (
                  <Cell key={indice} fill={CORES_QUALIDADE[item.qualidade] || "#145c45"} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-ar-900">Série diária de PM2.5</h2>
        <p className="mb-3 text-xs text-slate-500">Média das estações no recorte</p>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={registros.serieDiaria}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pm25" name="PM2.5" stroke="#145c45" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
        <h2 className="font-semibold text-ar-900">PM2.5 médio por estação</h2>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={estacoes} layout="vertical" margin={{ left: 110 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="estacao" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="pm25Medio" name="PM2.5 médio" fill="#1f7a5c" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}

function Estrategico({ estatistica, heatmap, recomendacoes }) {
  const nomesCurtos = heatmap.nomes || [];
  return (
    <section className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-3">
        <Cartao
          titulo="Pearson tráfego × PM2.5"
          valor={`r = ${formatarNumero(estatistica.pearsonTrafegoPm25?.r, 2)}`}
          detalhe={`p-valor ${formatarP(estatistica.pearsonTrafegoPm25?.pValor)}`}
        />
        <Cartao
          titulo="Teste t (tráfego alto vs baixo)"
          valor={`t = ${formatarNumero(estatistica.testeTTrafego?.t, 2)}`}
          detalhe={`PM2.5 ${formatarNumero(estatistica.testeTTrafego?.mediaPm25Alto)} vs ${formatarNumero(estatistica.testeTTrafego?.mediaPm25Baixo)}`}
        />
        <Cartao
          titulo="Amostra × população"
          valor={`${formatarNumero(estatistica.amostraVsPopulacao?.pm25Amostra)} / ${formatarNumero(estatistica.amostraVsPopulacao?.pm25Populacao)}`}
          detalhe="PM2.5 da amostra de 100 vs média da base"
        />
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-ar-900">Matriz de correlação</h2>
        <p className="mb-4 text-xs text-slate-500">Variáveis numéricas da base tratada</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-center text-sm">
            <thead>
              <tr>
                <th />
                {nomesCurtos.map((nome) => (
                  <th key={nome} className="px-2 py-1 text-xs text-slate-500">
                    {nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(heatmap.valores || []).map((linha, i) => (
                <tr key={nomesCurtos[i]}>
                  <th className="px-2 py-1 text-left text-xs text-slate-500">{nomesCurtos[i]}</th>
                  {linha.map((valor, j) => (
                    <td
                      key={`${i}-${j}`}
                      className="px-2 py-2 font-medium"
                      style={{ background: corHeat(valor), color: Math.abs(valor) > 0.5 ? "white" : "#0f172a" }}
                    >
                      {formatarNumero(valor, 2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600">{estatistica.pearsonTrafegoPm25?.interpretacao}</p>
        <p className="text-sm text-slate-600">{estatistica.pearsonTemperaturaPm25?.interpretacao}</p>
        <p className="text-sm text-slate-600">{estatistica.testeTTrafego?.interpretacao}</p>
      </article>

      <div className="grid gap-4 lg:grid-cols-3">
        {recomendacoes.map((item) => (
          <article key={item.titulo} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ar-500">{item.nivel}</p>
            <h3 className="mt-1 font-semibold text-ar-900">{item.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.texto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function corHeat(valor) {
  const v = Math.max(-1, Math.min(1, valor));
  if (v >= 0) {
    const t = v;
    const r = Math.round(255 - t * 210);
    const g = Math.round(255 - t * 80);
    const b = Math.round(255 - t * 140);
    return `rgb(${r},${g},${b})`;
  }
  const t = -v;
  const r = Math.round(255 - t * 40);
  const g = Math.round(255 - t * 90);
  const b = Math.round(255 - t * 20);
  return `rgb(${r},${g},${b})`;
}
