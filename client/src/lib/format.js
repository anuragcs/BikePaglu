export function metric(value, fallback = '—') {
  return value == null || value === '' ? fallback : value
}

export function compactPower(hp) {
  if (hp == null) return '—'
  return `${Math.round(hp)} hp`
}

export function formatInr(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function compactWeight(kg) {
  if (kg == null) return '—'
  return `${Math.round(kg)} kg`
}

export function specGroups(bike) {
  return [
    {
      title: 'Powertrain',
      rows: [
        ['Engine', bike.engine],
        ['Displacement', bike.displacement],
        ['Power', bike.power],
        ['Torque', bike.torque],
        ['Compression', bike.compression],
        ['Bore × stroke', bike.boreStroke],
        ['Valves / cylinder', bike.valvesPerCylinder],
        ['Fuel system', bike.fuelSystem],
        ['Fuel control', bike.fuelControl],
        ['Cooling', bike.cooling],
        ['Ignition', bike.ignition],
        ['Starter', bike.starter],
      ],
    },
    {
      title: 'Chassis',
      rows: [
        ['Frame', bike.frame],
        ['Gearbox', bike.gearbox],
        ['Transmission', bike.transmission],
        ['Clutch', bike.clutch],
        ['Front suspension', bike.frontSuspension],
        ['Rear suspension', bike.rearSuspension],
        ['Front travel', bike.frontWheelTravel],
        ['Rear travel', bike.rearWheelTravel],
      ],
    },
    {
      title: 'Contact patch',
      rows: [
        ['Front tyre', bike.frontTire],
        ['Rear tyre', bike.rearTire],
        ['Front brakes', bike.frontBrakes],
        ['Rear brakes', bike.rearBrakes],
      ],
    },
    {
      title: 'Dimensions',
      rows: [
        ['Wet weight', bike.totalWeight],
        ['Dry weight', bike.dryWeight],
        ['Seat height', bike.seatHeight],
        ['Wheelbase', bike.wheelbase],
        ['Ground clearance', bike.groundClearance],
        ['Length', bike.totalLength],
        ['Width', bike.totalWidth],
        ['Height', bike.totalHeight],
        ['Fuel', bike.fuelCapacity],
        ['Top speed', bike.topSpeed],
        ['Emissions', bike.emission],
      ],
    },
  ].map((group) => ({
    ...group,
    rows: group.rows.filter(([, value]) => value),
  })).filter((group) => group.rows.length)
}
