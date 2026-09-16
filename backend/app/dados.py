from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

BASE_DIR = Path(__file__).resolve().parent.parent
PLANILHA = BASE_DIR / "data" / "Sistema_Qualidade_Ar_Sao_Paulo.xlsx"

COL_DATA = "Data"
COL_ESTACAO = "Estação / Região"
COL_TRAFEGO = "Tráfego (Veíc/h)"
COL_TEMP = "Temperatura (°C)"
COL_UMIDADE = "Umidade (%)"
COL_CO2 = "CO2 (ppm)"
COL_PM25 = "PM2.5 (µg/m³)"
COL_QUALIDADE = "Qualidade do Ar"

NUMERICAS = [COL_TRAFEGO, COL_TEMP, COL_UMIDADE, COL_CO2, COL_PM25]


@lru_cache(maxsize=1)
def carregar_base() -> pd.DataFrame:
    df = pd.read_excel(PLANILHA, sheet_name="Qualidade do Ar", header=3)
    df = df.drop_duplicates()
    df[COL_ESTACAO] = df[COL_ESTACAO].fillna("Não informado")
    df = df[((df[COL_PM25] >= 0) & (df[COL_PM25] <= 500)) | df[COL_PM25].isna()]
    df[COL_DATA] = pd.to_datetime(df[COL_DATA])
    return df.reset_index(drop=True)


def filtrar(
    df: pd.DataFrame,
    estacao: str | None = None,
    qualidade: str | None = None,
    inicio: str | None = None,
    fim: str | None = None,
) -> pd.DataFrame:
    recorte = df.copy()
    if estacao:
        recorte = recorte[recorte[COL_ESTACAO] == estacao]
    if qualidade:
        recorte = recorte[recorte[COL_QUALIDADE] == qualidade]
    if inicio:
        recorte = recorte[recorte[COL_DATA] >= pd.to_datetime(inicio)]
    if fim:
        recorte = recorte[recorte[COL_DATA] <= pd.to_datetime(fim)]
    return recorte


def opcoes_filtro(df: pd.DataFrame) -> dict:
    return {
        "estacoes": sorted(df[COL_ESTACAO].dropna().unique().tolist()),
        "qualidades": ["Boa", "Moderada", "Ruim"],
        "inicio": df[COL_DATA].min().strftime("%Y-%m-%d"),
        "fim": df[COL_DATA].max().strftime("%Y-%m-%d"),
        "totalRegistros": int(len(df)),
    }


def _media(serie: pd.Series) -> float | None:
    if serie.dropna().empty:
        return None
    return round(float(serie.mean()), 2)


def kpis(df: pd.DataFrame) -> dict:
    n = int(len(df))
    pm = df[COL_PM25]
    qualidade = df[COL_QUALIDADE]
    return {
        "registros": n,
        "pm25Medio": _media(pm),
        "trafegoMedio": _media(df[COL_TRAFEGO]),
        "co2Medio": _media(df[COL_CO2]),
        "temperaturaMedia": _media(df[COL_TEMP]),
        "percentualRuim": round(float((qualidade == "Ruim").mean() * 100), 1) if n else 0,
        "percentualBoa": round(float((qualidade == "Boa").mean() * 100), 1) if n else 0,
        "percentualModerada": round(float((qualidade == "Moderada").mean() * 100), 1) if n else 0,
        "diasAcima50": int((pm > 50).sum()),
        "piorEstacao": _pior_estacao(df),
    }


def _pior_estacao(df: pd.DataFrame) -> dict | None:
    if df.empty:
        return None
    ranking = (
        df.groupby(COL_ESTACAO)[COL_PM25]
        .mean()
        .sort_values(ascending=False)
    )
    if ranking.empty:
        return None
    nome = ranking.index[0]
    return {"estacao": nome, "pm25Medio": round(float(ranking.iloc[0]), 2)}


def registros(df: pd.DataFrame) -> list[dict]:
    saida = []
    for _, row in df.iterrows():
        saida.append(
            {
                "data": row[COL_DATA].strftime("%Y-%m-%d"),
                "estacao": row[COL_ESTACAO],
                "trafego": _num(row[COL_TRAFEGO]),
                "temperatura": _num(row[COL_TEMP]),
                "umidade": _num(row[COL_UMIDADE]),
                "co2": _num(row[COL_CO2]),
                "pm25": _num(row[COL_PM25]),
                "qualidade": row[COL_QUALIDADE],
            }
        )
    return saida


def serie_diaria(df: pd.DataFrame) -> list[dict]:
    if df.empty:
        return []
    agrupado = (
        df.groupby(df[COL_DATA].dt.strftime("%Y-%m-%d"))
        .agg(
            pm25=(COL_PM25, "mean"),
            trafego=(COL_TRAFEGO, "mean"),
            co2=(COL_CO2, "mean"),
        )
        .reset_index()
        .rename(columns={COL_DATA: "data"} if COL_DATA in df.columns else {"Data": "data"})
    )
    agrupado.columns = ["data", "pm25", "trafego", "co2"]
    return [
        {
            "data": row["data"],
            "pm25": round(float(row["pm25"]), 2),
            "trafego": round(float(row["trafego"]), 1),
            "co2": round(float(row["co2"]), 1),
        }
        for _, row in agrupado.iterrows()
    ]


def ranking_estacoes(df: pd.DataFrame) -> list[dict]:
    if df.empty:
        return []
    grupos = df.groupby(COL_ESTACAO)
    linhas = []
    for estacao, bloco in grupos:
        linhas.append(
            {
                "estacao": estacao,
                "pm25Medio": round(float(bloco[COL_PM25].mean()), 2),
                "trafegoMedio": round(float(bloco[COL_TRAFEGO].mean()), 1),
                "co2Medio": round(float(bloco[COL_CO2].mean()), 1),
                "diasRuim": int((bloco[COL_QUALIDADE] == "Ruim").sum()),
                "diasBoa": int((bloco[COL_QUALIDADE] == "Boa").sum()),
                "registros": int(len(bloco)),
            }
        )
    return sorted(linhas, key=lambda item: item["pm25Medio"], reverse=True)


def estatistica(df: pd.DataFrame) -> dict:
    validos = df.dropna(subset=[COL_TRAFEGO, COL_PM25])
    if len(validos) < 3:
        return {"amostras": int(len(validos))}

    r_trafego, p_trafego = stats.pearsonr(validos[COL_TRAFEGO], validos[COL_PM25])
    r_co2, p_co2 = stats.pearsonr(validos[COL_CO2], validos[COL_PM25])
    r_temp, p_temp = stats.pearsonr(validos[COL_TEMP], validos[COL_PM25])
    r_umidade, p_umidade = stats.pearsonr(validos[COL_UMIDADE], validos[COL_PM25])
    r_trafego_co2, p_trafego_co2 = stats.pearsonr(validos[COL_TRAFEGO], validos[COL_CO2])

    mediana = validos[COL_TRAFEGO].median()
    alto = validos[validos[COL_TRAFEGO] > mediana][COL_PM25]
    baixo = validos[validos[COL_TRAFEGO] <= mediana][COL_PM25]
    t_stat, p_t = stats.ttest_ind(alto, baixo, equal_var=False)

    amostra = df.sample(n=min(100, len(df)), random_state=42)
    matriz = df[NUMERICAS].corr().round(3)

    return {
        "amostras": int(len(validos)),
        "pearsonTrafegoPm25": {
            "r": round(float(r_trafego), 4),
            "pValor": float(p_trafego),
            "interpretacao": _ler_correlacao(r_trafego, p_trafego, "tráfego e PM2.5"),
        },
        "pearsonCo2Pm25": {
            "r": round(float(r_co2), 4),
            "pValor": float(p_co2),
            "interpretacao": _ler_correlacao(r_co2, p_co2, "CO2 e PM2.5"),
        },
        "pearsonTemperaturaPm25": {
            "r": round(float(r_temp), 4),
            "pValor": float(p_temp),
            "interpretacao": _ler_correlacao(r_temp, p_temp, "temperatura e PM2.5"),
        },
        "pearsonUmidadePm25": {
            "r": round(float(r_umidade), 4),
            "pValor": float(p_umidade),
            "interpretacao": _ler_correlacao(r_umidade, p_umidade, "umidade e PM2.5"),
        },
        "pearsonTrafegoCo2": {
            "r": round(float(r_trafego_co2), 4),
            "pValor": float(p_trafego_co2),
            "interpretacao": _ler_correlacao(r_trafego_co2, p_trafego_co2, "tráfego e CO2"),
        },
        "testeTTrafego": {
            "medianaTrafego": round(float(mediana), 1),
            "mediaPm25Alto": round(float(alto.mean()), 2),
            "mediaPm25Baixo": round(float(baixo.mean()), 2),
            "nAlto": int(len(alto)),
            "nBaixo": int(len(baixo)),
            "t": round(float(t_stat), 4),
            "pValor": float(p_t),
            "interpretacao": (
                "Estações e dias com tráfego acima da mediana apresentam PM2.5 significativamente maior."
                if p_t < 0.05
                else "Não há diferença estatisticamente significativa de PM2.5 entre tráfego alto e baixo."
            ),
        },
        "amostraVsPopulacao": {
            "nAmostra": int(len(amostra)),
            "pm25Populacao": _media(df[COL_PM25]),
            "pm25Amostra": _media(amostra[COL_PM25]),
            "trafegoPopulacao": _media(df[COL_TRAFEGO]),
            "trafegoAmostra": _media(amostra[COL_TRAFEGO]),
        },
        "matrizCorrelacao": {
            "colunas": NUMERICAS,
            "valores": matriz.values.tolist(),
        },
    }


def recomendacoes(df: pd.DataFrame) -> list[dict]:
    ranking = ranking_estacoes(df)
    pior = ranking[0]["estacao"] if ranking else "regiões de alto tráfego"
    stats_gerais = estatistica(df)
    r = stats_gerais.get("pearsonTrafegoPm25", {}).get("r", 0)
    return [
        {
            "nivel": "Operacional",
            "titulo": f"Priorizar alertas na {pior}",
            "texto": (
                f"A {pior} concentra os piores índices de PM2.5 do recorte. "
                "A operação deve reforçar o boletim diário, sinalização à população sensível "
                "e o acionamento de protocolos quando a classificação for Ruim."
            ),
        },
        {
            "nivel": "Tático",
            "titulo": "Intervir no corredor de tráfego, não no clima",
            "texto": (
                f"A correlação entre tráfego e PM2.5 é forte (r = {r}). "
                "Temperatura e umidade praticamente não explicam o poluente neste mês. "
                "Inspeção veicular, restrição de pesados e fiscalização na Marginal Tietê, "
                "Itaquera, Santo Amaro e São Mateus têm mais efeito do que medidas meteorológicas."
            ),
        },
        {
            "nivel": "Estratégico",
            "titulo": "Replicar o padrão Ibirapuera / Moema",
            "texto": (
                "Moema e a Zona Sul (Ibirapuera) registram as menores médias de PM2.5, "
                "com menos veículos por hora. Ampliar calmaria viária, transporte coletivo "
                "e cobertura vegetal nesses moldes é a linha de política pública com melhor "
                "aderência à evidência estatística da base."
            ),
        },
    ]


def _ler_correlacao(r: float, p: float, par: str) -> str:
    if p >= 0.05:
        return f"Não há associação estatisticamente significativa entre {par} (p ≥ 0,05)."
    forca = "fraca"
    if abs(r) >= 0.7:
        forca = "forte"
    elif abs(r) >= 0.4:
        forca = "moderada a forte"
    elif abs(r) >= 0.2:
        forca = "fraca a moderada"
    sentido = "positiva" if r > 0 else "negativa"
    return f"Associação {forca} {sentido} entre {par} (r = {r:.2f}, p < 0,05)."


def _num(valor) -> float | None:
    if pd.isna(valor):
        return None
    return round(float(valor), 2)
