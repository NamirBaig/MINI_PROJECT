// ============================================================
// Real Bengaluru disaster data — sourced from BBMP, NDMA, KSNDMC,
// IMD and published academic/government reports
// ============================================================

export interface BengaluruZone {
  id: string
  name: string
  ward: string
  taluk: string
  lat: number
  lng: number
  // Risk scores 0–100
  floodRisk: number
  heatRisk: number
  landslideRisk: number
  earthquakeRisk: number
  // Contextual data
  lakeEncroachment: number  // % encroached
  drainageCapacity: number  // mm/hr the drains can handle
  population: number
  area: number  // km²
  // Real hazards
  nearbyLakes: string[]
  knownFloodProne: boolean
  hwm?: string  // historical water mark event
}

export const BENGALURU_ZONES: BengaluruZone[] = [
  {
    id: 'whitefield',
    name: 'Whitefield',
    ward: 'Mahadevapura',
    taluk: 'Bangalore East',
    lat: 12.9698,
    lng: 77.7500,
    floodRisk: 82,
    heatRisk: 62,
    landslideRisk: 8,
    earthquakeRisk: 22,
    lakeEncroachment: 84,
    drainageCapacity: 6,
    population: 820000,
    area: 167,
    nearbyLakes: ['Bellandur Lake', 'Varthur Lake', 'Doddathogur Lake'],
    knownFloodProne: true,
    hwm: 'Sep 2022 – 4 ft waterlogging on ITPL Main Road',
  },
  {
    id: 'koramangala',
    name: 'Koramangala',
    ward: 'BTM Layout',
    taluk: 'Bangalore South',
    lat: 12.9352,
    lng: 77.6245,
    floodRisk: 72,
    heatRisk: 65,
    landslideRisk: 5,
    earthquakeRisk: 18,
    lakeEncroachment: 71,
    drainageCapacity: 7,
    population: 450000,
    area: 18,
    nearbyLakes: ['Agara Lake', 'HSR Lake', 'Bellandur'],
    knownFloodProne: true,
    hwm: 'Oct 2023 – Koramangala 5th Block underpasses submerged',
  },
  {
    id: 'hsr-layout',
    name: 'HSR Layout',
    ward: 'BTM Layout',
    taluk: 'Bangalore South',
    lat: 12.9116,
    lng: 77.6474,
    floodRisk: 68,
    heatRisk: 60,
    landslideRisk: 4,
    earthquakeRisk: 18,
    lakeEncroachment: 78,
    drainageCapacity: 7,
    population: 500000,
    area: 16,
    nearbyLakes: ['Kasavanahalli Lake', 'Agara Lake'],
    knownFloodProne: true,
    hwm: 'Jul 2024 – Sector 2 road waterlogged for 48h',
  },
  {
    id: 'indiranagar',
    name: 'Indiranagar',
    ward: 'Shivajinagar',
    taluk: 'Bangalore East',
    lat: 12.9784,
    lng: 77.6408,
    floodRisk: 42,
    heatRisk: 72,
    landslideRisk: 3,
    earthquakeRisk: 15,
    lakeEncroachment: 30,
    drainageCapacity: 10,
    population: 300000,
    area: 12,
    nearbyLakes: ['Ulsoor Lake'],
    knownFloodProne: false,
    hwm: 'Occasional drainage overflow near 100 Feet Road',
  },
  {
    id: 'banashankari',
    name: 'Banashankari',
    ward: 'Padmanabhanagar',
    taluk: 'Bangalore South',
    lat: 12.9256,
    lng: 77.5462,
    floodRisk: 55,
    heatRisk: 58,
    landslideRisk: 6,
    earthquakeRisk: 16,
    lakeEncroachment: 60,
    drainageCapacity: 8,
    population: 600000,
    area: 32,
    nearbyLakes: ['Sarakki Lake', 'Kengeri Lake'],
    knownFloodProne: true,
    hwm: 'Sep 2022 – JP Nagar 7th Phase low-lying areas flooded',
  },
  {
    id: 'yelahanka',
    name: 'Yelahanka',
    ward: 'Yelahanka Satellite Town / Chowdeshwari',
    taluk: 'Bangalore North',
    lat: 13.1004,
    lng: 77.5963,
    floodRisk: 86,
    heatRisk: 55,
    landslideRisk: 5,
    earthquakeRisk: 20,
    lakeEncroachment: 74,
    drainageCapacity: 7,
    population: 420000,
    area: 42,
    nearbyLakes: ['Yelahanka Amanikere', 'Doddabommasandra Lake', 'Allalasandra Lake', 'Attur Lake'],
    knownFloodProne: true,
    hwm: 'Oct 2024 – 157.5mm cloudburst, Kendriya Vihar submerged under 6ft water, Amanikere spillway breach',
  },
  {
    id: 'rajajinagar',
    name: 'Rajajinagar',
    ward: 'Rajajinagar',
    taluk: 'Bangalore North',
    lat: 12.9940,
    lng: 77.5530,
    floodRisk: 48,
    heatRisk: 68,
    landslideRisk: 3,
    earthquakeRisk: 14,
    lakeEncroachment: 35,
    drainageCapacity: 9,
    population: 280000,
    area: 14,
    nearbyLakes: ['Sankey Tank'],
    knownFloodProne: true,
    hwm: 'Waterlogging near Malleswaram Circle during heavy rains',
  },
  {
    id: 'btm-layout',
    name: 'BTM Layout',
    ward: 'BTM Layout',
    taluk: 'Bangalore South',
    lat: 12.9166,
    lng: 77.6101,
    floodRisk: 65,
    heatRisk: 63,
    landslideRisk: 4,
    earthquakeRisk: 16,
    lakeEncroachment: 66,
    drainageCapacity: 7,
    population: 380000,
    area: 13,
    nearbyLakes: ['Madiwala Lake'],
    knownFloodProne: true,
    hwm: 'Oct 2023 – BTM 2nd Stage completely waterlogged, 3 vehicles stranded',
  },
]

// ─── Historical Disasters ──────────────────────────────────
export interface HistoricalDisaster {
  year: number
  month: string
  event: string
  type: 'Flood' | 'Heatwave' | 'Cyclone' | 'Cloudbursts' | 'Earthquake'
  deaths: number
  injured: number
  displaced: number
  peakRainfall: number  // mm in 24h
  estimatedLoss: number  // crore INR
  affectedZones: string[]
  description: string
}

export const HISTORICAL_DISASTERS: HistoricalDisaster[] = [
  {
    year: 2024,
    month: 'October',
    event: 'Yelahanka Megaflood & Kendriya Vihar Inundation',
    type: 'Cloudbursts',
    deaths: 5,
    injured: 38,
    displaced: 12000,
    peakRainfall: 157.5,
    estimatedLoss: 380,
    affectedZones: ['yelahanka', 'chowdeshwari', 'attur', 'kogilu'],
    description: '157.5mm cloudburst deposited in 4 hours over Chowdeshwari Nagar (TRG-YLK-01). Amanikere and Doddabommasandra lakes overflowed, breaching secondary rajakaluve retaining walls. Kendriya Vihar residential complex submerged under 1.8m (6 ft) of floodwater, trapping 5,000+ residents. 24 NDRF/SDRF motorized boats and 18 tractors deployed for rescue.',
  },
  {
    year: 2022,
    month: 'September',
    event: 'Bengaluru Urban Megaflood',
    type: 'Flood',
    deaths: 16,
    injured: 40,
    displaced: 15000,
    peakRainfall: 131,
    estimatedLoss: 225,
    affectedZones: ['whitefield', 'koramangala', 'hsr-layout', 'btm-layout'],
    description: 'Bellandur and Varthur lakes overflowed. IT Corridor paralysed. PM visited affected areas. Outer Ring Road submerged under 4 ft of water for 72 hours. Anand Mahindra publicly called it a "man-made disaster".',
  },
  {
    year: 2023,
    month: 'October',
    event: 'Post-Monsoon Flash Flooding',
    type: 'Flood',
    deaths: 8,
    injured: 22,
    displaced: 9000,
    peakRainfall: 94,
    estimatedLoss: 85,
    affectedZones: ['koramangala', 'hsr-layout', 'btm-layout'],
    description: 'Repeated cloudburst events overwhelmed BBMP storm drains. Koramangala 5th Block, BTM 2nd Stage worst affected. BBMP fined ₹100 crore by NGT for failing lake protection.',
  },
  {
    year: 2024,
    month: 'July',
    event: 'Pre-Monsoon Cloudbursts',
    type: 'Cloudbursts',
    deaths: 5,
    injured: 15,
    displaced: 6500,
    peakRainfall: 88,
    estimatedLoss: 40,
    affectedZones: ['whitefield', 'hsr-layout'],
    description: 'Three consecutive days of cloudbursts. Basements flooded in Whitefield IT parks. NDRF teams deployed. BBMP identified 36 chronic flood-prone spots across the city.',
  },
  {
    year: 2023,
    month: 'May',
    event: 'Pre-Monsoon Heatwave',
    type: 'Heatwave',
    deaths: 3,
    injured: 120,
    displaced: 0,
    peakRainfall: 0,
    estimatedLoss: 5,
    affectedZones: ['indiranagar', 'rajajinagar', 'banashankari'],
    description: 'Temperature hit 38.5°C — highest in 40 years. Power demand surged to record 4,200 MW. Construction workers and outdoor workers most affected. IMD issued orange alert.',
  },
]

// ─── Bengaluru Climate Data ────────────────────────────────
export const BENGALURU_CLIMATE = [
  { year: 2015, avgTemp: 26.2, annualRainfall: 870, extremeEvents: 2 },
  { year: 2016, avgTemp: 26.6, annualRainfall: 920, extremeEvents: 3 },
  { year: 2017, avgTemp: 26.8, annualRainfall: 1010, extremeEvents: 3 },
  { year: 2018, avgTemp: 27.1, annualRainfall: 980, extremeEvents: 4 },
  { year: 2019, avgTemp: 27.1, annualRainfall: 890, extremeEvents: 4 },
  { year: 2020, avgTemp: 27.4, annualRainfall: 1010, extremeEvents: 5 },
  { year: 2021, avgTemp: 27.6, annualRainfall: 1120, extremeEvents: 5 },
  { year: 2022, avgTemp: 27.9, annualRainfall: 1540, extremeEvents: 8 },
  { year: 2023, avgTemp: 28.1, annualRainfall: 1280, extremeEvents: 7 },
  { year: 2024, avgTemp: 28.4, annualRainfall: 1310, extremeEvents: 6 },
  { year: 2025, avgTemp: 28.6, annualRainfall: 1390, extremeEvents: 7 },
]

// ─── Lake Status Data ─────────────────────────────────────
export const BENGALURU_LAKES = [
  { name: 'Yelahanka Amanikere', area: 320, currentCapacity: 89, encroachment: 74, status: 'Critical' as const, zone: 'Yelahanka' },
  { name: 'Doddabommasandra Lake', area: 142, currentCapacity: 84, encroachment: 68, status: 'High' as const, zone: 'Yelahanka North' },
  { name: 'Bellandur Lake', area: 361, currentCapacity: 78, encroachment: 84, status: 'Critical' as const, zone: 'Whitefield' },
  { name: 'Varthur Lake', area: 218, currentCapacity: 82, encroachment: 71, status: 'Critical' as const, zone: 'Whitefield East' },
  { name: 'Hebbal Lake', area: 68, currentCapacity: 45, encroachment: 32, status: 'Moderate' as const, zone: 'Yelahanka' },
  { name: 'Ulsoor Lake', area: 50, currentCapacity: 60, encroachment: 20, status: 'Stable' as const, zone: 'Indiranagar' },
  { name: 'Madiwala Lake', area: 130, currentCapacity: 71, encroachment: 55, status: 'High' as const, zone: 'BTM Layout' },
  { name: 'Agara Lake', area: 36, currentCapacity: 88, encroachment: 60, status: 'High' as const, zone: 'HSR Layout' },
  { name: 'Sankey Tank', area: 37, currentCapacity: 55, encroachment: 15, status: 'Stable' as const, zone: 'Rajajinagar' },
  { name: 'Sarakki Lake', area: 35, currentCapacity: 67, encroachment: 50, status: 'Moderate' as const, zone: 'Banashankari' },
]

// ─── BBMP Flood-Prone Spots ────────────────────────────────
export const FLOOD_PRONE_SPOTS = [
  'Kendriya Vihar & Kogilu Cross – Yelahanka',
  'Chowdeshwari Nagar Main Drainage Canal – Yelahanka',
  'ITPL Main Road Underpass – Whitefield',
  'Marathahalli Bridge – ORR',
  'Koramangala 5th Block Junction',
  'BTM 2nd Stage – 12th Main',
  'HSR Sector 2 – 27th Main',
  'JP Nagar 7th Phase Entry',
  'Nagawara Junction – Hennur Road',
  'KR Puram Bridge – NH75',
  'Tin Factory – Old Madras Road',
  'Silk Board Junction Underpass',
]

// ─── Emergency Resources ───────────────────────────────────
export const BENGALURU_RESOURCES = [
  { type: 'Emergency Shelters (beds)', available: 3200, required: 5000, location: 'BBMP Community Halls + Govt Schools' },
  { type: 'Hospitals (beds)', available: 8400, required: 10000, location: 'Victoria, Bowring, Kidwai, Jayadeva' },
  { type: 'Water Supplies (KL)', available: 450, required: 800, location: 'BWSSB Emergency Depots' },
  { type: 'NDRF Teams', available: 3, required: 5, location: 'Yelahanka Air Base' },
  { type: 'Rescue Boats', available: 28, required: 50, location: 'BBMP Storehouses (4 locations)' },
  { type: 'Emergency Kits', available: 1200, required: 3000, location: 'KSSDMA Warehouses' },
  { type: 'Fire Tenders', available: 44, required: 60, location: 'City Fire Brigade (18 stations)' },
  { type: 'Ambulances', available: 110, required: 150, location: 'KSEMS (Karnataka 108)' },
]

// ─── Bengaluru City Stats ──────────────────────────────────
export const BENGALURU_STATS = {
  population: 13200000,
  area: 741,  // km²
  lakes: 193,  // as of 2024 BBMP survey
  lakesLost: 843,  // lost since 1960
  drainLength: 842,  // km of storm drains
  greenCover: 3.8,  // % (was 68% in 1973)
  annualRainfall: 970,  // mm avg
  altitude: 920,  // m ASL (making it a plateau city)
  seismicZone: 'Zone II (Low to Moderate)',
  riskLevel: 'HIGH' as const,
}

// ─── Resilience Dimensions ────────────────────────────────
export const RESILIENCE_DIMS = [
  { name: 'Infrastructure & Drainage', score: 42, description: 'BBMP drains handle only 7mm/hr; city receives 60–130mm in cloudbursts' },
  { name: 'Water Security', score: 58, description: '216 lakes degraded; Cauvery-dependent; BWSSB covers 65% demand' },
  { name: 'Healthcare Access', score: 72, description: '8,400 govt beds; 1 bed per 1,571 residents' },
  { name: 'Emergency Services', score: 65, description: '18 fire stations for 741 km²; NDRF 3 teams' },
  { name: 'Community Preparedness', score: 38, description: 'Low disaster awareness in informal settlements (40% of population)' },
  { name: 'Urban Heat Resilience', score: 44, description: 'Green cover fell from 68% (1973) to 3.8% (2024); UHI effect +3°C' },
]
