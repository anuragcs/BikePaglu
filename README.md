# BIKEPAGLU

A spec archive for 2026 motorcycles and earlier years. Live figures come from the [API Ninjas Motorcycles API](https://api-ninjas.com/api/motorcycles). A small tyre spins only while those specs are loading.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Put your key in `.env` as `API_NINJAS_KEY`. The browser never sees it — the Express server at `http://127.0.0.1:8787` proxies every request and caches results for 30 minutes.

## How to look around

- **Year rail** — 2018 through 2026
- **Make list** — Ducati, Aprilia, BMW, and the rest of the garage
- **Type pills** — Sport, Naked, Adventure, Cruiser, Touring, Off-road
- **Search** — type a model (`Panigale`, `Ninja`, `Himalayan`)
- **2026 Icons** — curated hero bikes for the selected year
- **Arrow keys** — left/right change bikes, up/down change year
- **Enter** or **Full spec** — complete dossier
- **India price** — on-road, ex-showroom, RTO and insurance for the selected bike, by city

The make/model list endpoints on API Ninjas need a paid plan. This app uses `/v1/motorcycles` with curated brands plus model search, which works on the free key.
