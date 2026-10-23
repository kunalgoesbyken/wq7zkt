# Windward: GB wind decision desk

Windward helps a GB day-ahead trading team answer two questions before each auction:

1. **What did the latest wind forecast say at my gate closure?** For every delivery hour, it shows the most recent Elexon WINDFOR forecast published before the chosen market's deadline (Nord Pool N2EX or EPEX SPOT), alongside the metered outturn (FUELHH, `WIND`).
2. **How far can I trust it?** It reports error metrics at any lead time from 0 to 48 h or exactly at gate closure. It also gives a calibrated P10 to P90 range, a firm volume to plan on, and the energy at risk.

The scope is purchase decisions made in January 2026, which means delivery days from 2 January to 1 February 2026.

**Live app:** https://wq7zkt.vercel.app

## Running it

### Docker

```bash
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:8000/api/v1/meta (interactive docs at http://localhost:8000/docs)

### Local development

Requirements: Python 3.12 with [uv](https://docs.astral.sh/uv/), and Node 22 or later.

```bash
cd api
uv sync
uv run uvicorn windesk.main:app --port 8000

cd web
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The web app proxies `/api/*` to `API_ORIGIN` (set in `.env.local`).

### Refreshing the data snapshot

The API serves a validated Parquet snapshot committed in `api/data`. To rebuild it from Elexon:

```bash
cd api
uv run python -m windesk.ingest
```

## Deployment

The repo deploys to Vercel as a single project using [Vercel Services](https://vercel.com/docs/services), configured in `vercel.json`:

- `/api/*` goes to the FastAPI service in `api/`, which runs as a Python function.
- Every other path goes to the Next.js service in `web/`.

Each push to `master` triggers a deploy.

## Repository layout

```
.
├── vercel.json              Vercel Services: routes /api to api/, everything else to web/
├── docker-compose.yml       Runs both services locally (API health-checked before web starts)
├── .github/workflows/ci.yml Lint, type-check, build, then docker compose build and smoke test
│
├── api/                     Python 3.12 · FastAPI · Polars
│   ├── pyproject.toml       Runtime deps, plus dependency groups: dev, ingest, serve
│   ├── Dockerfile
│   ├── data/                Validated snapshot: actuals.parquet, forecasts.parquet, manifest.json
│   └── windesk/
│       ├── main.py          App factory, error handlers, CDN cache headers
│       ├── settings.py      Every tunable (WINDESK_* env vars): windows, quantiles, buckets, horizons, timezone
│       ├── config/markets.json  Markets as data: venue, timezone, gate closure, delivery-day start
│       ├── markets.py       Gate closure and delivery-hour calculations (DST-aware: 23, 24 or 25 h days)
│       ├── store.py         ForecastStore protocol + ParquetStore (swappable storage)
│       ├── desk.py          Application service: caching, windows, composes analytics per request
│       ├── schemas.py       Pydantic response contract (source of the OpenAPI spec)
│       ├── errors.py        Typed API errors (UNKNOWN_MARKET, OUT_OF_WINDOW, INVALID_RANGE)
│       ├── analytics/       Pure functions over Polars frames
│       │   ├── alignment.py   Half-hourly actuals to hourly means
│       │   ├── selection.py   forecast_as_of: the single as-of join behind both views
│       │   ├── decision.py    Gate-closure day, conformal band, energy at risk, quality flags
│       │   ├── accuracy.py    Lead-time and gate-closure reports, horizon curve
│       │   └── metrics.py     MAE, RMSE, bias, error percentiles, nMAE, histogram
│       ├── ingest/          Elexon client (chunked, retrying), validation, snapshot pipeline, CLI
│       └── routers/         /health, /meta, /markets, /decisions, /accuracy
│
└── web/                     Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · evilcharts (ECharts)
    ├── openapi.json         API contract snapshot; TS types are generated from it at build time
    ├── messages/en-GB.json  All UI text (next-intl); add a locale by adding a catalog
    ├── Dockerfile
    └── src/
        ├── app/             Routes: / (decision desk), /accuracy, /methodology
        ├── features/
        │   ├── decision/    Headline (plan-on vs expected), facts, band chart, month strip, date picker
        │   ├── accuracy/    Basis toggle, lead-time slider, metrics, four charts
        │   └── methodology/ Method write-up plus live pilot scope from the API
        ├── components/      Layout, panels, stats, shared ECharts wrapper, states, theme, shadcn/ui
        ├── lib/api/         Typed openapi-fetch client plus a single SWR hook
        ├── lib/format/      Intl formatting for MW, GWh, %, dates and times in the market timezone
        └── i18n/            Locale config and request setup
```

## How the numbers are produced

- **Alignment.** WINDFOR is hourly and FUELHH is half-hourly. Each hour's actual is the mean of its two half-hours, which equals that hour's energy and matches the hourly products being bought. Hours with a missing half are excluded, never filled in.
- **Forecast selection.** One primitive serves both views: for each target hour, take the forecast with the latest `publishTime` at or before a cutoff.
  - At gate closure, the cutoff is the market deadline on the day before delivery.
  - At a fixed lead time, the cutoff is the target hour minus the lead time.
  - Hours that come from an older run, because the newest run didn't cover them, are flagged `FALLBACK_RUN`.
- **Uncertainty range.**
  - Residuals are grouped into buckets by forecast level, because errors grow with wind output.
  - Quantiles use a finite-sample (conformal) order-statistic correction.
  - Each day is left out of its own calibration.
  - The decision desk reports live how often actual wind met the firm (P10) level across the pilot.
- **Sign convention.** Error is forecast minus actual. A positive bias means the forecast was too high, so a buyer who relied on it ends up short.

## Design notes

- **One contract.** Pydantic schemas generate the OpenAPI spec, and the frontend generates its TypeScript types from that spec, so the two sides cannot drift apart.
- **Ready to scale without extra features.**
  - Ingestion is separate from serving.
  - Storage sits behind a protocol.
  - Markets and tunables are configuration, not code.
  - The API is stateless with CDN cache headers.
  - View state lives in the URL, so views can be shared between users.
  - The API returns only numbers, ISO timestamps and enum codes, so all wording is localised in one catalog.
- **Data quality is visible.** Ingest validates the schema, removes duplicates and hindcasts, and reports gaps. The API exposes coverage through `/meta`.
