import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { HEROES, MAKES, TYPES, YEARS, bikeId, normalizeBike } from './catalog.js'
import { indiaPrice } from './prices.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(ROOT, '.env') })
const app = express()
const PORT = Number(process.env.PORT) || 8787
const API_KEY = process.env.API_NINJAS_KEY
const API_BASE = 'https://api.api-ninjas.com/v1/motorcycles'
const CACHE_TTL = 1000 * 60 * 30

const cache = new Map()
const MAX_IN_FLIGHT = 4
let inFlight = 0
const waiters = []

app.use(cors())
app.use(express.json())

function cacheGet(key) {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return hit.value
}

function cacheSet(key, value) {
  cache.set(key, { at: Date.now(), value })
  return value
}

async function enqueue(task) {
  if (inFlight >= MAX_IN_FLIGHT) {
    await new Promise((resolve) => waiters.push(resolve))
  }
  inFlight += 1
  try {
    return await task()
  } finally {
    inFlight -= 1
    const next = waiters.shift()
    if (next) next()
  }
}

async function ninjasFetch(params) {
  if (!API_KEY) {
    const error = new Error('Missing API_NINJAS_KEY')
    error.status = 500
    throw error
  }

  const url = new URL(API_BASE)
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value).trim())
    }
  })

  const key = url.toString()
  const cached = cacheGet(key)
  if (cached) return cached

  return enqueue(async () => {
    const again = cacheGet(key)
    if (again) return again

    const response = await fetch(key, {
      headers: { 'X-Api-Key': API_KEY },
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      const error = new Error(payload.error || `API Ninjas ${response.status}`)
      error.status = response.status
      throw error
    }

    const bikes = Array.isArray(payload) ? payload.map(normalizeBike) : []
    return cacheSet(key, bikes)
  })
}

function uniqueBikes(list) {
  const seen = new Set()
  const next = []
  for (const bike of list) {
    if (!bike?.id || seen.has(bike.id)) continue
    seen.add(bike.id)
    next.push(bike)
  }
  return next
}

function applyFilters(bikes, { type, q }) {
  let list = bikes
  if (type && type !== 'All') {
    list = list.filter((bike) => bike.type === type)
  }
  if (q) {
    const needle = q.toLowerCase()
    list = list.filter((bike) =>
      [bike.make, bike.model, bike.type, bike.engine, bike.year]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }
  return list
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, garage: 'open', year: 2026 })
})

app.get('/api/meta', (_req, res) => {
  res.json({ years: YEARS, makes: MAKES, types: TYPES, heroes: HEROES })
})

app.get('/api/bikes', async (req, res) => {
  try {
    const make = String(req.query.make || '').trim()
    const model = String(req.query.model || '').trim()
    const year = String(req.query.year || '').trim()
    const type = String(req.query.type || '').trim()
    const q = String(req.query.q || '').trim()

    if (!make && !model && !q) {
      return res.status(400).json({
        error: 'Choose a brand, model, or search term to fetch bikes.',
      })
    }

    const bikes = await ninjasFetch({
      make: make || undefined,
      model: model || q || undefined,
      year: year || undefined,
    })

    res.json({
      count: applyFilters(bikes, { type, q: make || model ? q : '' }).length,
      bikes: applyFilters(bikes, { type, q: make || model ? q : '' }),
      source: 'api-ninjas',
    })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/api/featured', async (req, res) => {
  try {
    const year = String(req.query.year || '2026').trim()
    const cacheKey = `featured:${year}`
    const cached = cacheGet(cacheKey)
    if (cached) return res.json(cached)

    const batches = await Promise.all(
      HEROES.map((hero) =>
        ninjasFetch({ make: hero.make, model: hero.model, year }).catch(() => []),
      ),
    )

    const bikes = uniqueBikes(batches.flat()).slice(0, 24)
    const payload = {
      year,
      count: bikes.length,
      bikes,
      source: 'api-ninjas',
    }
    cacheSet(cacheKey, payload)
    res.json(payload)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/api/bike', async (req, res) => {
  try {
    const make = String(req.query.make || '').trim()
    const model = String(req.query.model || '').trim()
    const year = String(req.query.year || '').trim()
    if (!make && !model) {
      return res.status(400).json({ error: 'make or model is required' })
    }

    const bikes = await ninjasFetch({
      make: make || undefined,
      model: model || undefined,
      year: year || undefined,
    })
    const exact = bikes.find((bike) => bike.id === bikeId({ make, model, year }))
    const bike = exact || bikes[0]
    if (!bike) return res.status(404).json({ error: 'No motorcycle matched that query.' })
    res.json(bike)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/api/price', async (req, res) => {
  try {
    const make = String(req.query.make || '').trim()
    const model = String(req.query.model || '').trim()
    const city = String(req.query.city || 'delhi').trim()
    if (!make || !model) {
      return res.status(400).json({ error: 'make and model are required' })
    }

    const cacheKey = `in-price:${make}:${model}:${city}`.toLowerCase()
    const cached = cacheGet(cacheKey)
    if (cached) return res.json(cached)

    const payload = await indiaPrice({ make, model, city })
    if (payload.found || payload.reason === 'unlisted' || payload.reason === 'unpriced') {
      cacheSet(cacheKey, payload)
    }
    res.json(payload)
  } catch (error) {
    res.status(error.status || 502).json({ error: 'India prices are unavailable right now.' })
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(ROOT, 'dist')))
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(ROOT, 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`BIKEPAGLU api on http://127.0.0.1:${PORT}`)
})
