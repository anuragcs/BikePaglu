import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

const DEFAULT_MAKE = 'Ducati'

export function useGarage() {
  const [meta, setMeta] = useState({ years: [2026], makes: [DEFAULT_MAKE], types: ['All'] })
  const [year, setYear] = useState(2026)
  const [make, setMake] = useState(DEFAULT_MAKE)
  const [type, setType] = useState('All')
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [mode, setMode] = useState('brand')
  const [bikes, setBikes] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  const bike = bikes[index] || null

  useEffect(() => {
    api.meta().then(setMeta).catch(() => {})
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = query.trim()
      setSubmittedQuery(next)
      if (next.length >= 2) setMode('search')
      else setMode((current) => (current === 'search' ? 'brand' : current))
    }, 380)
    return () => clearTimeout(handle)
  }, [query])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')

    const run = async () => {
      try {
        let list = []
        if (mode === 'featured') {
          const payload = await api.featured(year)
          list = (payload.bikes || []).filter((item) => type === 'All' || item.type === type)
        } else if (mode === 'search' && submittedQuery.length >= 2) {
          const payload = await api.bikes({
            model: submittedQuery,
            year,
            type,
          })
          list = payload.bikes || []
        } else {
          const payload = await api.bikes({ make, year, type })
          list = payload.bikes || []
        }
        if (!alive) return
        setBikes(list)
        setIndex(0)
        setSheetOpen(false)
      } catch (err) {
        if (!alive) return
        setBikes([])
        setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [make, year, type, submittedQuery, mode])

  const selectIndex = useCallback(
    (next) => {
      if (!bikes.length) return
      const wrapped = (next + bikes.length) % bikes.length
      if (wrapped === index) return
      setIndex(wrapped)
      setSheetOpen(false)
    },
    [bikes.length, index],
  )

  const chooseMake = useCallback((name) => {
    setQuery('')
    setSubmittedQuery('')
    setMake(name)
    setMode('brand')
  }, [])

  const loadFeatured = useCallback(() => {
    setQuery('')
    setSubmittedQuery('')
    setMode('featured')
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.target.matches('input, textarea')) return
      if (event.key === 'ArrowRight') selectIndex(index + 1)
      if (event.key === 'ArrowLeft') selectIndex(index - 1)
      if (event.key === 'ArrowUp') {
        const years = meta.years
        const at = years.indexOf(year)
        if (at > 0) setYear(years[at - 1])
      }
      if (event.key === 'ArrowDown') {
        const years = meta.years
        const at = years.indexOf(year)
        if (at >= 0 && at < years.length - 1) setYear(years[at + 1])
      }
      if (event.key === 'Enter') setSheetOpen((open) => !open)
      if (event.key === 'Escape') setSheetOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, meta.years, selectIndex, year])

  return {
    meta,
    year,
    setYear,
    make,
    chooseMake,
    type,
    setType,
    query,
    setQuery,
    mode,
    bikes,
    bike,
    index,
    loading,
    error,
    sheetOpen,
    setSheetOpen,
    selectIndex,
    loadFeatured,
  }
}
