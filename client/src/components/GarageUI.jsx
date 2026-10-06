import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { compactPower, compactWeight, metric, specGroups } from '../lib/format.js'
import IndiaPrice from './IndiaPrice.jsx'

function TireLoader({ label }) {
  return (
    <div className="loader" role="status">
      <span className="mini-tire" />
      <span>{label}</span>
    </div>
  )
}

function TypePills({ types, active, onChange }) {
  return (
    <div className="pills">
      {types.map((item) => (
        <button
          key={item}
          className={item === active ? 'pill on' : 'pill'}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

function Meter({ label, value, max, text }) {
  const width = max > 0 && value != null ? Math.max(6, Math.round((value / max) * 100)) : 0
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <b>{text}</b>
      </div>
      <div className="track">
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export default function GarageUI({ garage }) {
  const {
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
  } = garage
  const [groupName, setGroupName] = useState('Powertrain')
  const groups = bike ? specGroups(bike) : []
  const activeGroup = groups.find((group) => group.title === groupName) || groups[0]

  const peaks = useMemo(() => {
    const maxOf = (key) => Math.max(0, ...bikes.map((item) => item[key] || 0))
    return { hp: maxOf('hp'), cc: maxOf('cc'), kg: maxOf('kg') }
  }, [bikes])

  return (
    <div className="board">
      <header className="top">
        <div className="brand-lockup">
          <span className="mark">BP</span>
          <div>
            <p className="wordmark">BIKEPAGLU</p>
            <p className="eyebrow">Spec archive</p>
          </div>
        </div>
        <form className="search" onSubmit={(event) => event.preventDefault()}>
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ninja, Panigale, Himalayan, Road Glide…"
            aria-label="Search motorcycle model"
          />
        </form>
        <div className="top-actions">
          {loading ? <TireLoader label="Loading" /> : null}
          <button className={mode === 'featured' ? 'text-btn on' : 'text-btn'} onClick={loadFeatured}>
            {year} Icons
          </button>
          <button className="text-btn" onClick={() => setSheetOpen(true)} disabled={!bike}>
            Full spec
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="brands">
          <p className="rail-label">Make</p>
          <div className="brand-list">
            {meta.makes.map((name) => (
              <button
                key={name}
                className={name === make && mode !== 'search' ? 'brand on' : 'brand'}
                onClick={() => chooseMake(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </aside>

        <main className="stage-copy">
          <TypePills types={meta.types} active={type} onChange={setType} />
          {loading && !bike ? (
            <TireLoader label="Fetching specs" />
          ) : (
          <AnimatePresence mode="wait">
            {bike ? (
              <motion.div
                key={bike.id}
                className="hero-copy"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
              >
                <p className="kicker">
                  {bike.year} · {bike.make} · {bike.type}
                </p>
                <h1>{bike.model}</h1>
                <div className="meters">
                  <Meter label="Power" value={bike.hp} max={peaks.hp} text={compactPower(bike.hp)} />
                  <Meter
                    label="Capacity"
                    value={bike.cc}
                    max={peaks.cc}
                    text={bike.cc ? `${Math.round(bike.cc)} cc` : '—'}
                  />
                  <Meter label="Weight" value={bike.kg} max={peaks.kg} text={compactWeight(bike.kg)} />
                </div>
                <p className="engine-line">{metric(bike.engine)} · {metric(bike.gearbox)}</p>
                <IndiaPrice bike={bike} />
              </motion.div>
            ) : (
              <div className="hero-copy">
                <p className="kicker">No machines in this lane</p>
                <h1>Try another year or search</h1>
              </div>
            )}
          </AnimatePresence>
          )}
          {error ? <p className="error">{error}</p> : null}
        </main>

        <aside className="spec-peek">
          {bike && activeGroup ? (
            <>
              <div className="group-tabs">
                {groups.map((group) => (
                  <button
                    key={group.title}
                    className={group.title === activeGroup.title ? 'tab on' : 'tab'}
                    onClick={() => setGroupName(group.title)}
                  >
                    {group.title}
                  </button>
                ))}
              </div>
              <ul>
                {activeGroup.rows.map(([label, value]) => (
                  <li key={label}>
                    <span>{label}</span>
                    <b>{value}</b>
                  </li>
                ))}
              </ul>
              <button className="ghost" onClick={() => setSheetOpen(true)}>
                Open full dossier
              </button>
            </>
          ) : null}
        </aside>
      </div>

      <div className="carousel">
        <p className="count">{bikes.length ? `${index + 1} / ${bikes.length}` : '0'}</p>
        <button className="nav" onClick={() => selectIndex(index - 1)} aria-label="Previous bike">
          ‹
        </button>
        <div className="strip">
          {bikes.map((item, i) => (
            <button
              key={item.id}
              className={i === index ? 'chip on' : 'chip'}
              onClick={() => selectIndex(i)}
            >
              <em>{item.make}</em>
              <strong>{item.model}</strong>
            </button>
          ))}
        </div>
        <button className="nav" onClick={() => selectIndex(index + 1)} aria-label="Next bike">
          ›
        </button>
      </div>

      <footer className="years">
        <p className="rail-label">Model year</p>
        <div className="year-row">
          {meta.years.map((value) => (
            <button
              key={value}
              className={value === year ? 'year on' : 'year'}
              onClick={() => setYear(value)}
            >
              {value}
              {value === 2026 ? <i>new</i> : null}
            </button>
          ))}
        </div>
        <p className="hint">← → bikes · ↑ ↓ years · enter for the full dossier</p>
      </footer>

      <AnimatePresence>
        {sheetOpen && bike ? (
          <motion.div className="sheet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="sheet-dim" onClick={() => setSheetOpen(false)} aria-label="Close" />
            <motion.section
              className="dossier"
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <header>
                <div>
                  <p>
                    {bike.year} {bike.make}
                  </p>
                  <h2>{bike.model}</h2>
                </div>
                <button className="text-btn" onClick={() => setSheetOpen(false)}>
                  Close
                </button>
              </header>
              <div className="dossier-grid">
                {groups.map((group) => (
                  <section key={group.title}>
                    <h3>{group.title}</h3>
                    {group.rows.map(([label, value]) => (
                      <div className="row" key={label}>
                        <span>{label}</span>
                        <p>{value}</p>
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
