from __future__ import annotations

import os

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.dados import (
    carregar_base,
    estatistica,
    filtrar,
    kpis,
    opcoes_filtro,
    ranking_estacoes,
    recomendacoes,
    registros,
    serie_diaria,
)

app = FastAPI(
    title="Qualidade do Ar — São Paulo",
    description="API do dashboard de gestão pública da qualidade do ar.",
    version="1.0.0",
)

origens = os.getenv("CORS_ORIGINS", "*")
lista_origens = [item.strip() for item in origens.split(",") if item.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=lista_origens,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _recorte(
    estacao: str | None,
    qualidade: str | None,
    inicio: str | None,
    fim: str | None,
):
    return filtrar(carregar_base(), estacao, qualidade, inicio, fim)


@app.get("/saude")
def saude():
    base = carregar_base()
    return {"ok": True, "registros": int(len(base))}


@app.get("/filtros")
def rota_filtros():
    return opcoes_filtro(carregar_base())


@app.get("/kpis")
def rota_kpis(
    estacao: str | None = None,
    qualidade: str | None = None,
    inicio: str | None = Query(default=None),
    fim: str | None = Query(default=None),
):
    return kpis(_recorte(estacao, qualidade, inicio, fim))


@app.get("/registros")
def rota_registros(
    estacao: str | None = None,
    qualidade: str | None = None,
    inicio: str | None = None,
    fim: str | None = None,
):
    recorte = _recorte(estacao, qualidade, inicio, fim)
    return {
        "itens": registros(recorte),
        "serieDiaria": serie_diaria(recorte),
    }


@app.get("/estacoes")
def rota_estacoes(
    estacao: str | None = None,
    qualidade: str | None = None,
    inicio: str | None = None,
    fim: str | None = None,
):
    return ranking_estacoes(_recorte(estacao, qualidade, inicio, fim))


@app.get("/estatistica")
def rota_estatistica(
    estacao: str | None = None,
    qualidade: str | None = None,
    inicio: str | None = None,
    fim: str | None = None,
):
    return estatistica(_recorte(estacao, qualidade, inicio, fim))


@app.get("/recomendacoes")
def rota_recomendacoes(
    estacao: str | None = None,
    qualidade: str | None = None,
    inicio: str | None = None,
    fim: str | None = None,
):
    return recomendacoes(_recorte(estacao, qualidade, inicio, fim))
