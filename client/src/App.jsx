import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import GarageUI from './components/GarageUI.jsx'
import { useGarage } from './hooks/useGarage.js'

function Intro({ onEnter }) {
  return (
    <motion.div className="intro" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
      <span className="mini-tire big" />
      <p className="eyebrow">Motorcycles · 2018 — 2026</p>
      <h1>BIKEPAGLU</h1>
      <p className="lede">Live specifications for the 2026 machines, and the years that led here.</p>
      <button className="enter" onClick={onEnter}>
        Open the archive
      </button>
    </motion.div>
  )
}

export default function App() {
  const [entered, setEntered] = useState(
    () => new URLSearchParams(window.location.search).has('garage'),
  )
  const garage = useGarage()

  return (
    <div className="app" style={{ '--paint': garage.bike?.color || '#c87a3a' }}>
      {entered ? <GarageUI garage={garage} /> : null}
      <AnimatePresence>{entered ? null : <Intro onEnter={() => setEntered(true)} />}</AnimatePresence>
    </div>
  )
}
