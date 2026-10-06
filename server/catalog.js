export const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]

export const MAKES = [
  'Ducati',
  'Aprilia',
  'BMW',
  'Kawasaki',
  'Honda',
  'Yamaha',
  'KTM',
  'Triumph',
  'Harley-Davidson',
  'Indian',
  'Royal Enfield',
  'Suzuki',
  'MV Agusta',
  'Husqvarna',
  'Moto Guzzi',
  'CFMoto',
  'Benelli',
  'GasGas',
]

export const TYPES = [
  'All',
  'Sport',
  'Naked',
  'Adventure',
  'Cruiser',
  'Touring',
  'Off-road',
  'Scooter',
  'Classic',
]

export const HEROES = [
  { make: 'Ducati', model: 'Panigale V4 R' },
  { make: 'Aprilia', model: 'RSV4' },
  { make: 'BMW', model: 'R 1300 GS' },
  { make: 'Kawasaki', model: 'Z 900' },
  { make: 'KTM', model: 'Duke 990' },
  { make: 'Triumph', model: 'Street Triple RS' },
  { make: 'Harley-Davidson', model: 'Road Glide' },
  { make: 'Honda', model: 'CBR' },
  { make: 'Indian', model: 'Challenger' },
  { make: 'Royal Enfield', model: 'Continental GT' },
  { make: 'Yamaha', model: 'MT' },
  { make: 'Suzuki', model: 'GSX' },
]

export const MAKE_COLORS = {
  Ducati: '#c8102e',
  Aprilia: '#d4a017',
  BMW: '#1c69d4',
  Kawasaki: '#6fbf00',
  Honda: '#e10600',
  Yamaha: '#003087',
  KTM: '#ff6600',
  Triumph: '#d6d3cb',
  'Harley-Davidson': '#f58220',
  Indian: '#7a1f2b',
  'Royal Enfield': '#c4a574',
  Suzuki: '#0054a6',
  'MV Agusta': '#b11226',
  Husqvarna: '#5a8f3c',
  'Moto Guzzi': '#8b1e1e',
  CFMoto: '#1a6bff',
  Benelli: '#c5a028',
  GasGas: '#e10600',
}

export function cleanText(value) {
  if (value == null) return null
  const text = String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length ? text : null
}

export function normalizeType(raw) {
  const value = (raw || '').toLowerCase()
  if (value.includes('sport')) return 'Sport'
  if (value.includes('naked') || value.includes('supermoto')) return 'Naked'
  if (value.includes('custom') || value.includes('cruiser')) return 'Cruiser'
  if (value.includes('tour')) return 'Touring'
  if (value.includes('scooter') || value.includes('maxi-scooter')) return 'Scooter'
  if (value.includes('classic') || value.includes('vintage')) return 'Classic'
  if (
    value.includes('allround') ||
    value.includes('enduro') ||
    value.includes('adventure') ||
    value.includes('dual')
  ) {
    return 'Adventure'
  }
  if (
    value.includes('cross') ||
    value.includes('motocross') ||
    value.includes('offroad') ||
    value.includes('off-road') ||
    value.includes('trial')
  ) {
    return 'Off-road'
  }
  return raw ? cleanText(raw) : 'Other'
}

export function parseNumber(text, pattern) {
  if (!text) return null
  const match = String(text).match(pattern)
  return match ? Number(match[1]) : null
}

export function bikeId(bike) {
  return [bike.make, bike.model, bike.year]
    .map((part) => String(part || '').trim().toLowerCase())
    .join('::')
}

export function normalizeBike(raw) {
  const make = cleanText(raw.make)
  const model = cleanText(raw.model)
  const year = cleanText(raw.year)
  const type = normalizeType(raw.type)
  const power = cleanText(raw.power)
  const torque = cleanText(raw.torque)
  const displacement = cleanText(raw.displacement)

  return {
    id: bikeId({ make, model, year }),
    make,
    model,
    year,
    type,
    typeRaw: cleanText(raw.type),
    displacement,
    engine: cleanText(raw.engine),
    power,
    torque,
    compression: cleanText(raw.compression),
    boreStroke: cleanText(raw.bore_stroke),
    valvesPerCylinder: cleanText(raw.valves_per_cylinder),
    fuelSystem: cleanText(raw.fuel_system),
    fuelControl: cleanText(raw.fuel_control),
    ignition: cleanText(raw.ignition),
    lubrication: cleanText(raw.lubrication),
    cooling: cleanText(raw.cooling),
    gearbox: cleanText(raw.gearbox),
    transmission: cleanText(raw.transmission),
    clutch: cleanText(raw.clutch),
    frame: cleanText(raw.frame),
    frontSuspension: cleanText(raw.front_suspension),
    rearSuspension: cleanText(raw.rear_suspension),
    frontWheelTravel: cleanText(raw.front_wheel_travel),
    rearWheelTravel: cleanText(raw.rear_wheel_travel),
    frontTire: cleanText(raw.front_tire),
    rearTire: cleanText(raw.rear_tire),
    frontBrakes: cleanText(raw.front_brakes),
    rearBrakes: cleanText(raw.rear_brakes),
    totalWeight: cleanText(raw.total_weight),
    dryWeight: cleanText(raw.dry_weight),
    seatHeight: cleanText(raw.seat_height),
    totalHeight: cleanText(raw.total_height),
    totalLength: cleanText(raw.total_length),
    totalWidth: cleanText(raw.total_width),
    groundClearance: cleanText(raw.ground_clearance),
    wheelbase: cleanText(raw.wheelbase),
    fuelCapacity: cleanText(raw.fuel_capacity),
    starter: cleanText(raw.starter),
    topSpeed: cleanText(raw.top_speed),
    fuelConsumption: cleanText(raw.fuel_consumption),
    emission: cleanText(raw.emission),
    color: MAKE_COLORS[make] || '#c87a3a',
    hp: parseNumber(power, /([\d.]+)\s*HP/i),
    nm: parseNumber(torque, /([\d.]+)\s*Nm/i),
    cc: parseNumber(displacement, /([\d.]+)\s*ccm/i),
    kg: parseNumber(raw.total_weight || raw.dry_weight, /([\d.]+)\s*kg/i),
    seatMm: parseNumber(raw.seat_height, /([\d.]+)\s*mm/i),
  }
}
