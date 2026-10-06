const SOURCE = 'https://www.bikewale.com'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

export const CITIES = [
  { slug: 'delhi', name: 'Delhi' },
  { slug: 'mumbai', name: 'Mumbai' },
  { slug: 'bangalore', name: 'Bengaluru' },
  { slug: 'pune', name: 'Pune' },
  { slug: 'hyderabad', name: 'Hyderabad' },
  { slug: 'chennai', name: 'Chennai' },
  { slug: 'kolkata', name: 'Kolkata' },
  { slug: 'lucknow', name: 'Lucknow' },
]

const makeLists = new Map()
const MAKE_TTL = 1000 * 60 * 60 * 12

function makeSlug(make) {
  return String(make || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function tokens(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function scoreModel(query, slug) {
  const queryTokens = tokens(query).filter((token) => !/^(19|20)\d{2}$/.test(token))
  const slugTokens = tokens(slug)
  const core = slugTokens.filter((token) => !/^(19|20)\d{2}$/.test(token))
  if (!queryTokens.length || !core.length) return 0

  const wanted = new Set(queryTokens)
  const overlap = core.filter((token) => wanted.has(token)).length
  if (!overlap) return 0

  const coverage = overlap / queryTokens.length
  const precision = overlap / core.length
  let score = coverage * 70 + precision * 30
  if (queryTokens.join(' ') === core.join(' ')) score = 100
  if (/-(19|20)\d{2}$/.test(slug)) score -= 12
  return score
}

function pickModel(models, query) {
  let best = null
  for (const slug of models) {
    const score = scoreModel(query, slug)
    if (!best || score > best.score || (score === best.score && slug.length < best.slug.length)) {
      best = { slug, score }
    }
  }
  if (!best || best.score < 64) return null
  return best.slug
}

async function getText(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    redirect: 'follow',
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) {
    const error = new Error(`Price source returned ${response.status}`)
    error.status = response.status
    throw error
  }
  return response.text()
}

function extractState(html) {
  const marker = 'window.__INITIAL_STATE__ = '
  const at = html.indexOf(marker)
  if (at < 0) return null
  const start = html.indexOf('{', at)
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < html.length; i += 1) {
    const char = html[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) return JSON.parse(html.slice(start, i + 1))
    }
  }
  return null
}

async function listModels(make) {
  const slug = makeSlug(make)
  if (!slug) return []
  const cached = makeLists.get(slug)
  if (cached && Date.now() - cached.at < MAKE_TTL) return cached.models

  let html
  try {
    html = await getText(`${SOURCE}/${slug}-bikes/`)
  } catch (error) {
    if (error.status === 404) return []
    throw error
  }

  const models = []
  const seen = new Set()
  const pattern = new RegExp(`/${slug}-bikes/([a-z0-9-]+)/`, 'g')
  for (const match of html.matchAll(pattern)) {
    if (seen.has(match[1])) continue
    seen.add(match[1])
    models.push(match[1])
  }
  makeLists.set(slug, { at: Date.now(), models })
  return models
}

function readVariants(state) {
  const page = state?.priceInCityPage
  const rows = page?.versionsPriceBreakupDetails || []
  const variants = rows
    .map((row) => {
      const breakup = row.priceBreakup?.[0]
      if (!breakup) return null
      const charges = (breakup.charges || [])
        .filter((charge) => Number(charge.value) > 0)
        .map((charge) => ({
          name: charge.name || charge.chargeGroupName,
          value: Math.round(Number(charge.value)),
        }))
      const onRoad = Math.round(Number(breakup.onRoad) || 0)
      const exShowroom = Math.round(Number(breakup.exShowRoom) || 0)
      if (!onRoad && !exShowroom) return null
      return {
        name: row.versionDetails?.versionName || 'Standard',
        onRoad,
        exShowroom,
        charges,
      }
    })
    .filter(Boolean)

  variants.sort((a, b) => (a.onRoad || a.exShowroom) - (b.onRoad || b.exShowroom))
  return variants
}

export function cityBySlug(slug) {
  return CITIES.find((city) => city.slug === String(slug || '').toLowerCase()) || CITIES[0]
}

export async function indiaPrice({ make, model, city }) {
  const selected = cityBySlug(city)
  const brand = makeSlug(make)
  const models = await listModels(make)
  const matched = pickModel(models, model)
  if (!matched) {
    return {
      found: false,
      reason: 'unlisted',
      city: selected,
      cities: CITIES,
      message: 'No current India price is listed for this model.',
    }
  }

  const sourceUrl = `${SOURCE}/${brand}-bikes/${matched}/price-in-${selected.slug}/`
  let html
  try {
    html = await getText(sourceUrl)
  } catch (error) {
    if (error.status === 404) {
      return {
        found: false,
        reason: 'unlisted',
        city: selected,
        cities: CITIES,
        message: 'No current India price is listed for this model.',
      }
    }
    throw error
  }

  const variants = readVariants(extractState(html))
  if (!variants.length) {
    return {
      found: false,
      reason: 'unpriced',
      city: selected,
      cities: CITIES,
      matched,
      message: 'This model is listed in India, but no on-road quote is published for this city.',
    }
  }

  return {
    found: true,
    source: 'BikeWale',
    sourceUrl,
    matched,
    city: selected,
    cities: CITIES,
    variants,
    note: 'Current India quote. Ex-showroom, RTO and insurance change by city and variant.',
  }
}
