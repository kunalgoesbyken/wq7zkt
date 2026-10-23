# Windward: GB wind forecasts for day-ahead buying

Windward answers three questions for a GB day-ahead buying team, for every delivery day in the pilot:

1. **What did the wind forecast say when bids closed?** It shows the newest Elexon WINDFOR forecast published before the chosen market's deadline (Nord Pool N2EX or EPEX SPOT), hour by hour.
2. **How far can I trust it?** It gives a likely range for each hour, a safer figure to plan on, and accuracy measured against metered output (FUELHH, `WIND`) at any lead time from 0 to 48 hours or at the deadline itself.
3. **How much demand is left for other sources?** It takes the national demand forecast available at the same deadline (NDF) and subtracts wind. The result is what gas, nuclear, imports and other sources must cover. It is shown for the expected wind and for the safer figure, and compared with actual demand (INDO).

The pilot covers purchase decisions made in January 2026, so delivery days run from 2 January to 1 February 2026.

Windward does not recommend a purchase volume. The demand figure is national, not one supplier's portfolio. A supplier's own demand forecast could be plugged in through the same path to turn it into a buy volume.

**Live app:** https://wq7zkt.vercel.app

| Page | What it shows |
| --- | --- |
| **Day ahead** (`/`) | For one market and delivery day: which forecast was available at the deadline, the day's wind forecast and safer figure, how forecast demand splits into planned wind, wind that may not arrive and other sources, hourly charts for wind and demand, how the day turned out, and every delivery day shaded by forecast miss. |
| **Accuracy** (`/accuracy`) | How far the forecast was from actual wind, either at the bidding deadline or a set number of hours ahead: a plain-language summary, a table of error measures, and charts of forecast against actual, misses by lead time, the spread of misses, and misses by time of day. |
| **How it works** (`/methodology`) | Each calculation step in plain language, the pilot's scope taken live from the API, and the limits of the analysis. |

## 1. Architecture

```mermaid
flowchart LR
    subgraph Elexon["Elexon Insights API"]
        direction TB
        WINDFOR
        FUELHH
        NDF
        INDO
    end

    subgraph Ingest["Ingest job (offline CLI)"]
        direction TB
        Client["Chunked client<br/>retry and backoff"] --> Validate["Validate<br/>dedupe, drop bad rows,<br/>count gaps"]
        Validate --> Snapshot[("Parquet snapshot<br/>+ manifest.json")]
    end

    subgraph Vercel["Vercel, one project"]
        direction TB
        CDN["CDN cache"] --> Router{"vercel.json<br/>rewrites"}
        subgraph API["api/ : FastAPI"]
            direction TB
            Routes["Routers<br/>Pydantic contract"] --> Desk["Desk service<br/>per-process cache"]
            Desk --> Analytics["Analytics<br/>pure Polars functions"]
            Desk --> Store["ForecastStore<br/>Parquet today"]
        end
        subgraph Web["web/ : Next.js"]
            direction TB
            Pages["Pages and features"] --> Fetch["Typed client<br/>openapi-fetch + SWR"]
        end
        Router -- "/api/*" --> Routes
        Router -- "everything else" --> Pages
    end

    Browser(["Buyer's browser"])

    Elexon --> Client
    Snapshot -. "shipped with the deploy" .-> Store
    Browser --> CDN
    Fetch -- "/api/v1/*" --> CDN
```

**Two services, one repo, one deployment.** The FastAPI service in `api/` does all the data work. The Next.js service in `web/` only presents it. On Vercel they deploy together as one project using [Vercel Services](https://vercel.com/docs/services): `vercel.json` sends `/api/*` to FastAPI, which runs as a Python function, and every other path to Next.js. Locally, `docker-compose.yml` runs the same two services, and Next.js proxies `/api/*` to `API_ORIGIN`.

**Ingest is separate from serving.** A command-line job (`python -m windesk.ingest`) pulls the four Elexon datasets, validates them and writes a Parquet snapshot plus a manifest that records what was dropped and why. The API never calls Elexon at request time, so a slow or failing upstream can't break the app.

**The API is stateless and cached.** Each process loads the snapshot once and memoises the per-market calculations. Responses carry `s-maxage` and `stale-while-revalidate` headers, so Vercel's CDN answers repeat requests without reaching Python.

| Endpoint | Returns |
| --- | --- |
| `GET /api/v1/meta` | Pilot windows, dataset names, range quantiles |
| `GET /api/v1/markets` | Configured markets and their deadlines |
| `GET /api/v1/decisions?market=` | Every delivery day's summary, month accuracy for wind and demand, and live range coverage |
| `GET /api/v1/decisions/{date}?market=` | One delivery day, hour by hour |
| `GET /api/v1/accuracy?basis=&horizon_h=&market=` | Accuracy at the deadline or at a lead time: measures, series, histogram, misses by hour of day |
| `GET /api/v1/accuracy/horizon-curve` | Accuracy for every lead time from 0 to 48 hours |

**Built to grow.** Storage sits behind the `ForecastStore` protocol, so Postgres or object storage can replace Parquet without touching the analytics. Markets are configuration (`config/markets.json`), so a new venue needs no code. Every tunable is a `WINDESK_*` environment variable. All wording lives in a message catalog, so a new language is a new file.

## 2. Design

**Product decisions**

- **Show what the buyer had, not hindsight.** Every figure uses the newest forecast published before the market's deadline, never a later one. Buyers on different markets can see different forecasts for the same day, and the app shows which one each market had.
- **A range, not a single number.** A forecast alone invites false confidence, so each hour has a likely range and a safer figure to plan on. The gap between the forecast and the safer figure is shown as wind that may not arrive.
- **Demand is context, not advice.** National demand shows how much other sources must cover. The app says plainly that it does not recommend a purchase volume.
- **Honest about gaps and bad days.** Missing data is flagged per hour, never filled. The worst days stay in view, and the range's real hit rate is reported next to it.

**Interface**

- **Reads like a briefing.** The day page opens with a few sentences that carry the figures, then a single demand-split bar, then the charts, which sit straight on the page. There are no stat tiles or card grids.
- **Plain language first.** Labels say "typical miss" and "bids closed". The Accuracy page puts each technical measure next to a one-line meaning.
- **Restrained visual system.** One type family (IBM Plex Sans), blue for wind, hatched amber for risk, and neutral tones for demand and other sources. Light and dark themes are supported, and the layout works down to phone width.
- **Shareable views.** The market, delivery day, basis and lead time live in the URL, so any view can be sent as a link.

**API design**

- The API returns only numbers, ISO timestamps and enum codes. It never returns sentences, so all text stays in the frontend catalog.
- Errors are typed codes (`UNKNOWN_MARKET`, `OUT_OF_WINDOW`, `INVALID_RANGE`) with consistent bodies.
- Data-quality flags (`FALLBACK_RUN`, `NO_FORECAST`, `NO_ACTUAL`, `NO_DEMAND_FORECAST`, `PARTIAL_COVERAGE`) travel with each hour and day.

## 3. Analysis

```mermaid
flowchart LR
    subgraph Elexon
        W[WINDFOR<br/>wind forecasts]
        F[FUELHH WIND<br/>actual wind]
        N[NDF<br/>demand forecasts]
        I[INDO<br/>actual demand]
    end
    subgraph Ingest
        V[Validate<br/>dedupe, drop negatives,<br/>drop hindcasts, count gaps]
        P[(Parquet snapshot<br/>+ manifest)]
    end
    subgraph API
        A[Hourly alignment<br/>mean of two half-hours]
        S[Forecast as of the deadline<br/>newest run published before cutoff]
        E[Errors<br/>forecast minus actual]
        B[Likely range<br/>grouped, leave-day-out, conformal]
        D[Demand after wind<br/>demand minus wind]
    end
    UI[Next.js pages]
    W & F & N & I --> V --> P --> A --> S --> E --> B --> D --> UI
```

### Collect and validate

`python -m windesk.ingest` pulls four datasets from the Elexon Insights API in 7-day chunks, retrying with backoff:

| Dataset | Use | Resolution |
| --- | --- | --- |
| WINDFOR | Wind forecasts, every run kept with its publish time | Hourly |
| FUELHH (`WIND`) | Actual wind output | Half-hourly |
| NDF | National demand forecasts, every run kept with its publish time | Half-hourly |
| INDO | Actual national demand (same definition as NDF) | Half-hourly |

Duplicates are dropped, along with negative values and forecast rows published after the hour they describe (hindcasts). Missing half-hours are counted in `manifest.json`, never filled in.

### Line up the hours

Each hourly actual is the mean of its two half-hours. That equals the hour's energy and matches the hourly blocks bought in the auction. If either half is missing, the hour is excluded. Using only the half-hour that starts on the hour changes the January gate-closure typical miss by about 18 MW, under 1%.

### Pick the forecast a buyer actually had

One function, `forecast_as_of` in `analytics/selection.py`, does this for every view. For each target hour, it takes the forecast with the latest `publishTime` at or before a cutoff (a backward as-of join).

- **At the deadline:** the cutoff is the market's gate closure on the day before delivery (09:50 UK for N2EX, 09:20 UK for EPEX).
- **At a lead time of *h* hours:** the cutoff is the target hour minus *h*.

If the newest run before the cutoff doesn't cover an hour, the previous run that does is used and the hour is flagged `FALLBACK_RUN`. Demand forecasts go through the same selection, per half-hour, and are then averaged to hours.

### Measure the misses

```
error = forecast − actual
```

A positive error means the forecast was too high, so a buyer who planned on it ends up short.

| Measure | Formula |
| --- | --- |
| Typical miss (MAE) | mean of \|error\| |
| RMSE | √(mean of error²) |
| Average error (bias) | mean of error |
| Half / nine in ten hours missed by less than | 50th / 90th percentile of \|error\| |
| Miss as a share of output (nMAE) | MAE ÷ mean actual |

### Work out the likely range and safer figure

`analytics/decision.py` builds the range in five steps:

1. Take every hour at the deadline with both a forecast and an actual. **Leave out the day being shown**, so a day never shapes its own range.
2. Split those hours into three groups by forecast level (terciles), because misses grow as wind output rises.
3. In each group, take the residuals `actual − forecast` and pick the conformal order statistics at ranks ⌊(n+1)·0.1⌋ and ⌈(n+1)·0.9⌉. This is the finite-sample correction that stops a short history from making the range look too tight.
4. For each hour, add its group's offsets to the forecast to get P10 and P90, clipping P10 at zero. **P10 is the safer figure.**
5. Sum over the day:
   - wind that may not arrive = expected wind − safer figure
   - other sources (expected) = demand forecast − wind forecast
   - other sources (if wind is low) = demand forecast − safer figure

The API also checks the range against what happened, and the day-ahead page shows the result live: the share of pilot hours where actual wind reached the safer figure (target 90%), and the share inside P10 to P90 (target 80%).

### What January showed (N2EX deadline, 744 hours)

| Finding | Value |
| --- | --- |
| Typical wind miss | 2,008 MW, 17.8% of average output |
| Average wind error | +1,729 MW: the forecast ran high, leaving buyers short |
| Wind over the month | 9,691.8 GWh forecast, 8,405.3 GWh delivered |
| Typical miss by lead time | 1,691 MW one hour ahead, 2,310 MW two days ahead |
| Actual wind at or above the safer figure | 90.2% of hours (target 90%) |
| Actual wind inside P10 to P90 | 79.3% of hours (target 80%) |
| Typical demand miss | 650 MW, 2.0% of demand |

These are out-of-sample results. Nothing was tuned to hit the targets.

**Limits.** One winter month only. The data covers transmission-connected wind. The range reflects wind uncertainty alone. The January over-forecast may come from wind farms being paid to turn down when the grid is congested, but that hasn't been checked.

## 4. Codebase

```
.
├── vercel.json              Vercel Services: /api to api/, everything else to web/
├── docker-compose.yml       Runs both services locally (API health-checked before web starts)
├── .github/workflows/ci.yml Lint, type check, build, then Docker Compose build and smoke test
│
├── api/                     Python 3.12 · FastAPI · Polars
│   ├── pyproject.toml       Runtime deps, plus dependency groups: dev, ingest, serve
│   ├── Dockerfile
│   ├── data/                Validated snapshot: wind and demand Parquet files, manifest.json
│   └── windesk/
│       ├── main.py          App factory, error handlers, CDN cache headers
│       ├── settings.py      Every tunable (WINDESK_* env vars): windows, datasets, quantiles, buckets, horizons
│       ├── config/markets.json  Markets as data: venue, timezone, gate closure, delivery-day start
│       ├── markets.py       Gate closure and delivery hours (DST-aware: 23, 24 or 25 hour days)
│       ├── store.py         ForecastStore protocol + ParquetStore (swappable storage)
│       ├── desk.py          Application service: caching, windows, composes analytics per request
│       ├── schemas.py       Pydantic response contract (source of the OpenAPI spec)
│       ├── errors.py        Typed API errors
│       ├── analytics/       Pure functions over Polars frames
│       │   ├── alignment.py   Half-hours to hourly means
│       │   ├── selection.py   forecast_as_of: the one as-of join behind every view
│       │   ├── decision.py    Deadline day, likely range, demand after wind, quality flags
│       │   ├── accuracy.py    Lead-time and deadline reports, lead-time curve
│       │   └── metrics.py     MAE, RMSE, bias, percentiles, nMAE, histogram
│       ├── ingest/          Elexon client (chunked, retrying), validation, snapshot pipeline, CLI
│       └── routers/         /health, /meta, /markets, /decisions, /accuracy
│
└── web/                     Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · evilcharts (ECharts)
    ├── openapi.json         API contract snapshot; TypeScript types are generated from it at build time
    ├── messages/en-GB.json  All UI text (next-intl); add a locale by adding a catalog
    ├── Dockerfile
    └── src/
        ├── app/             Routes: / (day ahead), /accuracy, /methodology
        ├── features/
        │   ├── decision/    Day summary, demand split, wind and demand charts, outcome, details, month strip
        │   ├── accuracy/    Basis toggle, lead-time slider, summary table, four charts
        │   └── methodology/ Step-by-step explanation plus live pilot scope from the API
        ├── components/      Layout, sections, fact lists, shared ECharts wrapper, states, theme, shadcn/ui
        ├── lib/api/         Typed openapi-fetch client plus a single SWR hook
        ├── lib/format/      Intl formatting for MW, GWh, %, dates and times in the market timezone
        └── i18n/            Locale config and request setup
```

The backend is layered: routers handle HTTP, `desk.py` composes, `analytics/` holds the maths as pure functions, and `store.py` handles data access. The frontend is organised by feature, and each feature owns its components and data hooks.

## 5. Key development practices

- **One contract.** Pydantic schemas generate the OpenAPI spec, and the frontend generates its TypeScript types from that spec, so the two sides can't drift apart without failing the build.
- **Configuration, not code.** Markets, datasets, windows, quantiles and cache headers are config or environment variables. Nothing about January or a specific market is hard-coded in the logic.
- **Self-documenting code.** The code has no comments. It relies on clear names, small functions, and pure analytics separated from I/O.
- **Enforced in CI.** On every push, CI runs Ruff lint and format checks for the API, then type checks, ESLint and a production build for the web app. It finishes by building the Docker Compose stack and smoke-testing it.
- **Verified against the source.** Figures were checked by hand against raw Elexon responses, including the January bias and individual demand hours. The UI was checked in a real browser on both markets, in light and dark themes and at phone width.
- **Continuous deployment.** Each push to `master` deploys to Vercel, while CI runs in parallel on GitHub Actions.

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

Open http://localhost:3000. The web app proxies `/api/*` to `API_ORIGIN`, which is set in `.env.local`.

### Refreshing the data snapshot

```bash
cd api
uv run python -m windesk.ingest
```

## Use of AI tools

AI coding assistants were used during development, for drafting code, reviewing it and checking figures. The problem framing, methodology decisions and product scope were mine. Every figure shown in the app was checked against the source Elexon data.
