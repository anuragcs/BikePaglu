import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../api.js'
import { formatInr } from '../lib/format.js'

const CITIES = [
  { slug: 'delhi', name: 'Delhi' },
  { slug: 'mumbai', name: 'Mumbai' },
  { slug: 'bangalore', name: 'Bengaluru' },
  { slug: 'pune', name: 'Pune' },
  { slug: 'hyderabad', name: 'Hyderabad' },
  { slug: 'chennai', name: 'Chennai' },
  { slug: 'kolkata', name: 'Kolkata' },
  { slug: 'lucknow', name: 'Lucknow' },
]

export default function IndiaPrice({ bike }) {
  const [city, setCity] = useState('delhi')
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [variant, setVariant] = useState(0)
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    setOpen(false)
    setVariant(0)
  }, [bike?.id])

  useEffect(() => {
    if (!bike) return undefined
    let alive = true
    setLoading(true)
    setQuote(null)
    setVariant(0)
    api
      .price({ make: bike.make, model: bike.model, city })
      .then((payload) => {
        if (alive) setQuote(payload)
      })
      .catch((error) => {
        if (alive) setQuote({ found: false, message: error.message })
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [bike?.id, bike?.make, bike?.model, city])

  useEffect(() => {
    if (!open) return undefined
    const frame = requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
    return () => cancelAnimationFrame(frame)
  }, [open, quote, variant, city])

  const selected = quote?.variants?.[variant] || quote?.variants?.[0]
  const cityName = CITIES.find((item) => item.slug === city)?.name || 'Delhi'
  const headline = selected ? formatInr(selected.onRoad || selected.exShowroom) : loading ? '…' : '—'

  return (
    <section className="india" ref={panelRef}>
      <button
        className={open ? 'price-model on' : 'price-model'}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div className="meter-top">
          <span>Price</span>
          <b>{headline}</b>
        </div>
        <div className="track">
          <i style={{ width: selected ? '100%' : '0%' }} />
        </div>
        <em>{open ? 'Hide the breakup' : `On-road · ${cityName}`}</em>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="price-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <div className="price-detail-inner">
              <div className="city-row">
                {CITIES.map((item) => (
                  <button
                    key={item.slug}
                    className={item.slug === city ? 'city on' : 'city'}
                    onClick={() => setCity(item.slug)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="loader tight" role="status">
                  <span className="mini-tire" />
                  <span>Checking {cityName}</span>
                </div>
              ) : null}

              {!loading && quote?.found && selected ? (
                <>
                  {quote.variants.length > 1 ? (
                    <div className="variant-row">
                      {quote.variants.map((item, index) => (
                        <button
                          key={item.name}
                          className={index === variant ? 'variant on' : 'variant'}
                          onClick={() => setVariant(index)}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="onroad">
                    <span>On-road · {cityName}</span>
                    <b>{formatInr(selected.onRoad || selected.exShowroom)}</b>
                  </div>
                  <ul className="charges">
                    {(selected.charges.length
                      ? selected.charges
                      : [{ name: 'Ex-showroom', value: selected.exShowroom }]
                    ).map((charge) => (
                      <li key={charge.name}>
                        <span>{charge.name}</span>
                        <b>{formatInr(charge.value)}</b>
                      </li>
                    ))}
                  </ul>
                  <p className="price-note">{quote.note}</p>
                </>
              ) : null}

              {!loading && quote && !quote.found ? <p className="price-note">{quote.message}</p> : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
