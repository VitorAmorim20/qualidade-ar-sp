# Qualidade do Ar — São Paulo

Dashboard de Data Intelligence da Fase 5 (PBL): monitoramento da qualidade do ar na cidade de São Paulo, com API em Python e interface React.

Não possui qualquer ligação com outros sistemas internos.

## Links

- **Dashboard:** https://qualidade-ar-sp.vercel.app/
- **API:** https://qualidadearsp-api-7yomps-26551d-152-53-192-161.sslip.io
- **Healthcheck:** https://qualidadearsp-api-7yomps-26551d-152-53-192-161.sslip.io/saude

## Stack

- **Backend:** FastAPI (pandas, SciPy) — deploy via Dokploy
- **Frontend:** React + Vite + Tailwind — deploy via Vercel

## API

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/saude` | Healthcheck (Dokploy) |
| GET | `/filtros` | Estações, datas e classes |
| GET | `/kpis` | Indicadores do recorte |
| GET | `/registros` | Leituras para gráficos |
| GET | `/estacoes` | Ranking por região |
| GET | `/estatistica` | Pearson, teste t, matriz |
| GET | `/recomendacoes` | Ações para gestão pública |

Query opcional nas rotas de dados: `estacao`, `qualidade`, `inicio`, `fim` (`YYYY-MM-DD`).

## Desenvolvimento local

```bash
# backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# frontend
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Deploy

1. **Dokploy** aponta para a pasta `backend` (Dockerfile na 8000, healthcheck `/saude`).
2. **Vercel** aponta para a pasta `frontend`, com `VITE_API_URL` igual à URL HTTPS da API.
3. No Dokploy, `CORS_ORIGINS` deve incluir `https://qualidade-ar-sp.vercel.app`.

Push na `main` atualiza os dois.
