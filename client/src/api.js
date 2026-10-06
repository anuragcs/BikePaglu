const json = async (path) => {
  const response = await fetch(path)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Garage request failed')
  }
  return data
}

export const api = {
  meta: () => json('/api/meta'),
  featured: (year) => json(`/api/featured?year=${encodeURIComponent(year)}`),
  bikes: ({ make, model, year, type, q } = {}) => {
    const params = new URLSearchParams()
    if (make) params.set('make', make)
    if (model) params.set('model', model)
    if (year) params.set('year', year)
    if (type && type !== 'All') params.set('type', type)
    if (q) params.set('q', q)
    return json(`/api/bikes?${params.toString()}`)
  },
  bike: ({ make, model, year }) => {
    const params = new URLSearchParams()
    if (make) params.set('make', make)
    if (model) params.set('model', model)
    if (year) params.set('year', year)
    return json(`/api/bike?${params.toString()}`)
  },
  price: ({ make, model, city }) => {
    const params = new URLSearchParams()
    if (make) params.set('make', make)
    if (model) params.set('model', model)
    if (city) params.set('city', city)
    return json(`/api/price?${params.toString()}`)
  },
}
