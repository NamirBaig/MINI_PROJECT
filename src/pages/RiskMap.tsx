import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, Layers, AlertCircle, Droplets, Info, Search,
  Compass, ShieldCheck, Waves, ArrowRight, CheckCircle2, ChevronRight,
  ZoomIn, ZoomOut, RotateCcw, Radio, Activity, Download, Share2,
  AlertTriangle, Eye, Flame, Navigation, MapPin, SlidersHorizontal, Crosshair
} from 'lucide-react'
import { BENGALURU_ZONES, BENGALURU_LAKES, FLOOD_PRONE_SPOTS, BENGALURU_STATS } from '../data/bengaluru'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'
import RequirementMap from '../components/RequirementMap'

type LayerType = 'floodRisk' | 'heatRisk' | 'lakeEncroachment' | 'drainageCapacity'
type ViewMode = 'satellite' | 'hydro' | 'heat' | 'evacuation'
type MobileTab = 'all' | 'map' | 'telemetry'

// Realistically calibrated SVG polygon paths for Greater Bengaluru BBMP Zones (viewBox: 0 0 900 640)
// Label coordinates are tuned with precision to ensure ZERO overlap with lakes and canals
const ZONE_POLYGONS: Record<string, { path: string; labelX: number; labelY: number; elevation: number; runoffCoef: number }> = {
  yelahanka: {
    path: 'M 320 40 L 580 40 L 640 140 L 550 200 L 380 190 L 290 120 Z',
    labelX: 450, labelY: 82, elevation: 920, runoffCoef: 0.74,
  },
  whitefield: {
    path: 'M 550 200 L 640 140 L 840 220 L 860 380 L 680 420 L 580 320 L 560 230 Z',
    labelX: 730, labelY: 280, elevation: 875, runoffCoef: 0.92,
  },
  indiranagar: {
    path: 'M 380 190 L 550 200 L 580 320 L 460 340 L 390 270 Z',
    labelX: 470, labelY: 280, elevation: 905, runoffCoef: 0.88,
  },
  rajajinagar: {
    path: 'M 180 140 L 290 120 L 380 190 L 390 270 L 300 340 L 190 280 Z',
    labelX: 280, labelY: 215, elevation: 935, runoffCoef: 0.84,
  },
  koramangala: {
    path: 'M 390 270 L 460 340 L 580 320 L 590 410 L 450 430 L 380 360 Z',
    labelX: 470, labelY: 365, elevation: 885, runoffCoef: 0.94,
  },
  'hsr-layout': {
    path: 'M 450 430 L 590 410 L 680 420 L 670 540 L 520 560 L 440 490 Z',
    labelX: 560, labelY: 505, elevation: 890, runoffCoef: 0.89,
  },
  'btm-layout': {
    path: 'M 330 380 L 380 360 L 450 430 L 440 490 L 350 520 L 310 440 Z',
    labelX: 375, labelY: 420, elevation: 895, runoffCoef: 0.86,
  },
  banashankari: {
    path: 'M 190 280 L 300 340 L 330 380 L 310 440 L 350 520 L 260 590 L 140 460 L 150 350 Z',
    labelX: 220, labelY: 395, elevation: 910, runoffCoef: 0.78,
  },
}

// Major Bengaluru Lakes with real cascade coordinates on map
const MAP_LAKES = [
  { name: 'Yelahanka Amanikere', x: 440, y: 140, r: 20, status: 'Critical', area: '320 ha' },
  { name: 'Doddabommasandra', x: 365, y: 160, r: 15, status: 'High', area: '142 ha' },
  { name: 'Hebbal Lake', x: 430, y: 195, r: 16, status: 'Moderate', area: '68 ha' },
  { name: 'Sankey Tank', x: 330, y: 230, r: 12, status: 'Stable', area: '37 ha' },
  { name: 'Ulsoor Lake', x: 490, y: 235, r: 14, status: 'Stable', area: '50 ha' },
  { name: 'Bellandur Lake', x: 650, y: 355, r: 26, status: 'Critical', area: '361 ha' },
  { name: 'Varthur Lake', x: 780, y: 375, r: 22, status: 'Critical', area: '218 ha' },
  { name: 'Agara Lake', x: 535, y: 440, r: 13, status: 'High', area: '36 ha' },
  { name: 'Madiwala Lake', x: 415, y: 470, r: 17, status: 'High', area: '130 ha' },
  { name: 'Sarakki Lake', x: 280, y: 510, r: 13, status: 'Moderate', area: '35 ha' },
]

// Critical Underpass Hotspots with short labels to prevent screen overlap
const UNDERPASS_HOTSPOTS = [
  { id: 'u1', name: 'Kendriya Vihar Inundation Basin', shortLabel: 'Kendriya Vihar', x: 520, y: 105, zone: 'Yelahanka', depth: '180 cm peak', status: 'CRITICAL CHOKE' },
  { id: 'u2', name: 'Silk Board Junction Underpass', shortLabel: 'Silk Board', x: 475, y: 460, zone: 'BTM / HSR', depth: '95 cm water', status: 'CHRONIC SILT' },
  { id: 'u3', name: 'Marathahalli Bridge Underpass', shortLabel: 'Marathahalli', x: 670, y: 310, zone: 'Outer Ring Road', depth: '110 cm water', status: 'SEVERE OVERFLOW' },
  { id: 'u4', name: 'ITPL Main Road Drain Choke', shortLabel: 'ITPL Choke', x: 740, y: 220, zone: 'Whitefield', depth: '80 cm water', status: 'DRAIN BOTTLENECK' },
  { id: 'u5', name: 'Hebbal Flyover Sump Line', shortLabel: 'Hebbal Ramp', x: 410, y: 200, zone: 'Yelahanka South', depth: '45 cm water', status: 'ACTIVE PUMPS' },
]

export default function RiskMap() {
  const { currentRole } = useAuth()
  const isAuthority = currentRole !== 'citizen'
  const toast = useToast()

  const [activeLayer, setActiveLayer] = useState<LayerType>('floodRisk')
  const [selectedZoneId, setSelectedZoneId] = useState<string>(BENGALURU_ZONES[0].id)
  const [showLakes, setShowLakes] = useState(true)
  const [showChannels, setShowChannels] = useState(true)
  const [showHotspots, setShowHotspots] = useState(true)
  const [showRadarScan, setShowRadarScan] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedHotspot, setSelectedHotspot] = useState<typeof UNDERPASS_HOTSPOTS[0] | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('all')
  const [authorityMapMode, setAuthorityMapMode] = useState<'risk' | 'requirement'>('risk')

  const selectedZone = BENGALURU_ZONES.find(z => z.id === selectedZoneId) || BENGALURU_ZONES[0]
  const zoneMeta = ZONE_POLYGONS[selectedZone.id] || { elevation: 900, runoffCoef: 0.85 }

  const getRiskColor = (val: number, layer: LayerType) => {
    if (layer === 'drainageCapacity') {
      return val <= 7 ? '#EF4444' : val <= 9 ? '#F59E0B' : '#10B981'
    }
    return val >= 70 ? '#EF4444' : val >= 50 ? '#F59E0B' : '#10B981'
  }

  const handleSelectZone = (id: string, name: string) => {
    playClickSound()
    setSelectedZoneId(id)
    setSelectedHotspot(null)
    toast.info(`Sector Focused: ${name}`, `Real-time risk telemetry active`)
  }

  const handleSelectHotspot = (spot: typeof UNDERPASS_HOTSPOTS[0], e: React.MouseEvent) => {
    e.stopPropagation()
    playAlertSound()
    setSelectedHotspot(spot)
    toast.alert(`Hotspot: ${spot.name}`, `${spot.status} • Depth: ${spot.depth}`)
  }

  const handleRoleAction = () => {
    if (isAuthority) {
      playAlertSound()
      toast.success('Disaster Command Sector Dispatch', `Transmitted hydro alert & deployed QRT dewatering unit to ${selectedZone.name} (${selectedZone.ward} Ward)`)
    } else {
      playSuccessSound()
      toast.info('Nearest Ward Shelter Located', `${selectedZone.name}: BBMP Ward Community Hall (0.8km). Safe via main arterial road.`)
    }
  }

  const handleExportGis = () => {
    playClickSound()
    const geoJson = {
      type: 'FeatureCollection',
      zone: selectedZone.name,
      ward: selectedZone.ward,
      hazardScore: selectedZone.floodRisk,
      drainageCapacity: selectedZone.drainageCapacity,
      elevationMsl: zoneMeta.elevation,
      runoffCoefficient: zoneMeta.runoffCoef,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SafeGround_GIS_${selectedZone.id}.geojson`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('GIS GeoJSON Exported', `${selectedZone.name} GIS layer downloaded`)
  }

  const filteredZones = searchQuery.trim()
    ? BENGALURU_ZONES.filter(z =>
        z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.nearbyLakes.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : BENGALURU_ZONES

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ─── Top Command Header ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span className="status-pill">
              <Compass size={14} /> BBMP & KSNDMC Grid v2.4
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60A5FA',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <Radio size={12} className="live-dot" /> 842 km Drain Network Active
            </span>
          </div>

          <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(22px, 3.2vw, 32px)', lineHeight: 1.2 }}>
            Bengaluru Topographic & Flood Risk Map
          </h1>
          <p className="sub" style={{ margin: '4px 0 0', fontSize: 14 }}>
            Multi-layered defense grid showing elevation, storm canals, lake cascades, and underpass choke points.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
          <input
            type="text"
            placeholder="Search ward, lake, or underpass..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: 10,
              background: 'var(--surf2)',
              border: '1px solid var(--border-glass)',
              color: '#FFFFFF',
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ─── DUAL MAP VIEW SELECTOR FOR AUTHORITIES & CITIZENS ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 14, 10, 0.95) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: 14,
        padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} color="var(--pri-neon)" />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            AUTHORITY DUAL MAP CONSOLE:
          </span>
          <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>
            Switch between Environmental Hazard Risk and Live Citizen Resource Demand Severity
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => { playClickSound(); setAuthorityMapMode('risk'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              border: authorityMapMode === 'risk' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
              background: authorityMapMode === 'risk' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255,255,255,0.04)',
              color: authorityMapMode === 'risk' ? '#030604' : '#FFFFFF',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Map size={15} />
            <span>1. Hazard & Topographic Risk Map</span>
          </button>

          <button
            onClick={() => { playAlertSound(); setAuthorityMapMode('requirement'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              border: authorityMapMode === 'requirement' ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
              background: authorityMapMode === 'requirement' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'rgba(255,255,255,0.04)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: authorityMapMode === 'requirement' ? '0 0 15px rgba(239,68,68,0.4)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Crosshair size={15} />
            <span>2. Resource Requirement & Severity Map (Live)</span>
            <span style={{
              fontSize: 9.5,
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.3)',
              color: '#FDE68A',
            }}>
              GPS DETECT
            </span>
          </button>
        </div>
      </div>

      {authorityMapMode === 'requirement' ? (
        <RequirementMap />
      ) : (
        <>

      {/* ─── Mobile View Switcher (Tabs for Mobile/Tablet) ──── */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '4px',
        background: 'rgba(12, 21, 16, 0.85)',
        border: '1px solid var(--border-glass)',
        borderRadius: 12,
      }}>
        {[
          { key: 'all', label: '↕️ All (Stacked)' },
          { key: 'map', label: '🗺️ Map View' },
          { key: 'telemetry', label: `📋 Ward Info (${selectedZone.name})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => {
              playClickSound()
              setMobileTab(t.key as MobileTab)
            }}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 8,
              border: mobileTab === t.key ? '1px solid var(--pri)' : '1px solid transparent',
              background: mobileTab === t.key ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
              color: mobileTab === t.key ? '#34D399' : 'rgba(255,255,255,0.7)',
              fontSize: 12,
              fontWeight: mobileTab === t.key ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Tactical Map Controls & Layer Selector ───────────── */}
      <div className="riskmap-controls-bar">
        {/* Layer Mode Tabs (Horizontal Scrollable on Small Screens) */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', overflowX: 'auto', width: '100%', paddingBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--pri-neon)', marginRight: 4, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <Layers size={14} /> LAYER:
          </span>
          {[
            { key: 'floodRisk', label: '🌊 Flood Risk' },
            { key: 'heatRisk', label: '🌡️ Heat Island' },
            { key: 'lakeEncroachment', label: '🏞️ Lake Encroachment' },
            { key: 'drainageCapacity', label: '🚰 Drainage Limit' },
          ].map(l => (
            <button
              key={l.key}
              onClick={() => {
                playClickSound()
                setActiveLayer(l.key as LayerType)
                toast.info(`Layer Active: ${l.label}`)
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: activeLayer === l.key ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: activeLayer === l.key ? 700 : 500,
                background: activeLayer === l.key ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.03)',
                color: activeLayer === l.key ? '#030604' : '#FFFFFF',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Feature Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'rgba(255,255,255,0.85)', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showLakes}
              onChange={e => { playClickSound(); setShowLakes(e.target.checked); }}
              style={{ accentColor: '#06B6D4' }}
            />
            <span>Lakes</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showChannels}
              onChange={e => { playClickSound(); setShowChannels(e.target.checked); }}
              style={{ accentColor: '#34D399' }}
            />
            <span>Canals</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showHotspots}
              onChange={e => { playClickSound(); setShowHotspots(e.target.checked); }}
              style={{ accentColor: '#EF4444' }}
            />
            <span>Hotspots</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showRadarScan}
              onChange={e => { playClickSound(); setShowRadarScan(e.target.checked); }}
              style={{ accentColor: 'var(--pri)' }}
            />
            <span>Radar</span>
          </label>
        </div>
      </div>

      {/* ─── Main Map Cockpit + Telemetry Inspector Grid ──────── */}
      <div className="riskmap-grid">
        {/* Interactive SVG Map Panel */}
        {(mobileTab === 'all' || mobileTab === 'map') && (
          <div className="bento-card" style={{ padding: 14, position: 'relative', overflow: 'hidden' }}>
            {/* Map Top Bar Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pri-neon)' }}>
                  12.9716° N, 77.5946° E
                </span>
                <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>• Topo: 875m – 935m MSL</span>
              </div>

              {/* Zoom / Reset Buttons */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { playClickSound(); setZoomLevel(Math.min(1.4, zoomLevel + 0.1)); }}
                  title="Zoom In"
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)',
                    color: '#FFFFFF', padding: '4px 8px', borderRadius: 6, cursor: 'pointer'
                  }}
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => { playClickSound(); setZoomLevel(Math.max(0.85, zoomLevel - 0.1)); }}
                  title="Zoom Out"
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)',
                    color: '#FFFFFF', padding: '4px 8px', borderRadius: 6, cursor: 'pointer'
                  }}
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  onClick={() => { playClickSound(); setZoomLevel(1); }}
                  title="Reset View"
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)',
                    color: '#FFFFFF', padding: '4px 8px', borderRadius: 6, cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* SVG Map Container */}
            <div style={{
              position: 'relative',
              width: '100%',
              background: 'radial-gradient(circle at 450px 340px, #0B1711 0%, #030604 100%)',
              borderRadius: 12,
              border: '1px solid rgba(16, 185, 129, 0.25)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8), 0 0 25px rgba(16, 185, 129, 0.1)',
              overflow: 'hidden',
              touchAction: 'pan-x pan-y',
            }}>
              <motion.svg
                viewBox="0 0 900 640"
                width="100%"
                style={{
                  display: 'block',
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: '450px 320px',
                  transition: 'transform 0.3s ease-out',
                }}
              >
                <defs>
                  {/* Tech Grid Pattern */}
                  <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.8" />
                  </pattern>

                  {/* Pulsing Zone Glow Filters */}
                  <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Linear Gradients */}
                  <linearGradient id="lakeWater" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#0E7490" stopOpacity="0.95" />
                  </linearGradient>

                  {/* Rotating Radar Sweep Cone */}
                  <linearGradient id="radarSweepGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* 1. Background Grid & Distance Rings */}
                <rect width="900" height="640" fill="url(#radarGrid)" />

                {/* Concentric Defense Rings */}
                <circle cx="450" cy="340" r="90" fill="none" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="1" strokeDasharray="4,4" />
                <circle cx="450" cy="340" r="180" fill="none" stroke="rgba(16, 185, 129, 0.10)" strokeWidth="1" strokeDasharray="6,4" />
                <circle cx="450" cy="340" r="270" fill="none" stroke="rgba(16, 185, 129, 0.07)" strokeWidth="1" strokeDasharray="8,6" />
                <text x="455" y="245" fill="rgba(16, 185, 129, 0.45)" fontSize="9" fontWeight="600">5 KM RING</text>
                <text x="455" y="155" fill="rgba(16, 185, 129, 0.35)" fontSize="9" fontWeight="600">10 KM RING</text>

                {/* Topographic Elevation Contours */}
                <path
                  d="M 120 180 Q 300 120 540 100 T 820 160 Q 860 380 720 520 T 260 560 Q 80 440 120 180 Z"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="1.2"
                  strokeDasharray="5,5"
                />

                {/* 2. Rotating Radar Scanning Sweep */}
                {showRadarScan && (
                  <g style={{ transformOrigin: '450px 340px', animation: 'spin 12s linear infinite' }}>
                    <path
                      d="M 450 340 L 450 40 A 300 300 0 0 1 662 127 Z"
                      fill="url(#radarSweepGradient)"
                    />
                    <line x1="450" y1="340" x2="450" y2="40" stroke="#34D399" strokeWidth="1.5" opacity="0.6" />
                  </g>
                )}

                {/* 3. Primary Rajakaluve Stormwater Canals */}
                {showChannels && (
                  <g pointerEvents="none">
                    {/* Hebbal Valley Cascade */}
                    <path
                      d="M 440 140 Q 420 170 430 195 T 490 235"
                      fill="none"
                      stroke="#34D399"
                      strokeWidth="3.5"
                      strokeDasharray="6,4"
                      opacity="0.8"
                    />
                    {/* K&C Valley Canal: Sankey -> Ulsoor -> Bellandur -> Varthur */}
                    <path
                      d="M 330 230 Q 410 232 490 235 T 650 355 T 780 375"
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="4"
                      strokeDasharray="8,4"
                      opacity="0.85"
                    />
                    {/* Vrishabhavathi Valley */}
                    <path
                      d="M 280 230 Q 230 330 280 490 T 260 590"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="3"
                      strokeDasharray="6,4"
                      opacity="0.75"
                    />
                  </g>
                )}

                {/* 4. BBMP Zone Polygonal Geometries */}
                {BENGALURU_ZONES.map(z => {
                  const geom = ZONE_POLYGONS[z.id]
                  if (!geom) return null

                  const val = z[activeLayer]
                  const isSelected = z.id === selectedZoneId
                  const fillColor = getRiskColor(val, activeLayer)
                  const isCritical = z.floodRisk >= 70

                  return (
                    <g
                      key={z.id}
                      onClick={() => handleSelectZone(z.id, z.name)}
                      style={{ cursor: 'pointer' }}
                    >
                      <path
                        d={geom.path}
                        fill={fillColor}
                        fillOpacity={isSelected ? 0.45 : isCritical ? 0.22 : 0.12}
                        stroke={isSelected ? '#34D399' : isCritical ? '#EF4444' : 'rgba(255,255,255,0.22)'}
                        strokeWidth={isSelected ? 3.5 : 1.5}
                        filter={isSelected ? 'url(#glowGreen)' : isCritical ? 'url(#glowRed)' : 'none'}
                        style={{
                          transition: 'fill-opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.22s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.22s ease',
                          cursor: 'pointer'
                        }}
                      />

                      {/* Crisp Frosted Capsule Plate Behind Label to PREVENT ANY OVERLAP */}
                      <g pointerEvents="none">
                        <rect
                          x={geom.labelX - 48}
                          y={geom.labelY - 14}
                          width="96"
                          height="32"
                          rx="6"
                          fill="rgba(4, 9, 6, 0.88)"
                          stroke={isSelected ? '#34D399' : isCritical ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.15)'}
                          strokeWidth={isSelected ? 1.5 : 1}
                        />
                        <text
                          x={geom.labelX}
                          y={geom.labelY}
                          fill="#FFFFFF"
                          fontSize="11"
                          fontWeight="800"
                          letterSpacing="0.4"
                          textAnchor="middle"
                        >
                          {z.name.toUpperCase()}
                        </text>
                        <text
                          x={geom.labelX}
                          y={geom.labelY + 13}
                          fill={isSelected ? '#34D399' : fillColor}
                          fontSize="11"
                          fontWeight="800"
                          textAnchor="middle"
                        >
                          {val}{activeLayer === 'drainageCapacity' ? ' mm/h' : '%'}
                        </text>
                      </g>
                    </g>
                  )
                })}

                {/* 5. Natural Lake Water Bodies */}
                {showLakes && (
                  <g pointerEvents="none">
                    {MAP_LAKES.map(lake => {
                      return (
                        <g key={lake.name}>
                          {/* Lake Outer Ring */}
                          <circle
                            cx={lake.x}
                            cy={lake.y}
                            r={lake.r + 2}
                            fill="none"
                            stroke="#06B6D4"
                            strokeWidth="1.2"
                            strokeDasharray="4,3"
                            opacity="0.8"
                          />
                          {/* Lake Water Surface */}
                          <circle
                            cx={lake.x}
                            cy={lake.y}
                            r={lake.r}
                            fill="url(#lakeWater)"
                            stroke="#FFFFFF"
                            strokeWidth="1"
                          />
                          <text
                            x={lake.x}
                            y={lake.y + 3}
                            fill="#FFFFFF"
                            fontSize="8.5"
                            fontWeight="800"
                            textAnchor="middle"
                            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                          >
                            {lake.name.split(' ')[0]}
                          </text>
                        </g>
                      )
                    })}
                  </g>
                )}

                {/* 6. Critical Underpass Choke Point Pins */}
                {showHotspots && UNDERPASS_HOTSPOTS.map(spot => {
                  const isSelected = selectedHotspot?.id === spot.id
                  return (
                    <g
                      key={spot.id}
                      onClick={(e) => handleSelectHotspot(spot, e)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Pulsing ring */}
                      <circle
                        cx={spot.x}
                        cy={spot.y}
                        r="10"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="1.8"
                        opacity="0.8"
                      >
                        <animate attributeName="r" values="6;16;6" dur="2.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.9;0.1;0.9" dur="2.2s" repeatCount="indefinite" />
                      </circle>

                      {/* Core Pin */}
                      <circle
                        cx={spot.x}
                        cy={spot.y}
                        r={isSelected ? 6 : 5}
                        fill="#EF4444"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />

                      {/* Compact Label Tag (Zero overlap) */}
                      <rect
                        x={spot.x + 8}
                        y={spot.y - 8}
                        width={spot.shortLabel.length * 5.8 + 14}
                        height="16"
                        rx="4"
                        fill="rgba(10, 18, 14, 0.94)"
                        stroke={isSelected ? '#EF4444' : 'rgba(239, 68, 68, 0.6)'}
                        strokeWidth={isSelected ? 1.5 : 1}
                      />
                      <text
                        x={spot.x + 12}
                        y={spot.y + 4}
                        fill="#FCA5A5"
                        fontSize="8.5"
                        fontWeight="700"
                      >
                        ⚠️ {spot.shortLabel}
                      </text>
                    </g>
                  )
                })}
              </motion.svg>
            </div>

            {/* Quick Zone Switcher: Smooth Horizontal Chip Rail */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 6 }}>
                TAP ZONE TO FOCUS TELEMETRY:
              </div>
              <div className="riskmap-chip-scroll">
                {filteredZones.map(z => {
                  const isSelected = z.id === selectedZoneId
                  return (
                    <button
                      key={z.id}
                      onClick={() => handleSelectZone(z.id, z.name)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: isSelected ? '1px solid var(--pri)' : '1px solid rgba(255,255,255,0.08)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.02)',
                        color: isSelected ? '#34D399' : 'rgba(255,255,255,0.7)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {z.name} ({z.floodRisk}%)
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Telemetry HUD Cockpit Inspector ──────────────────── */}
        {(mobileTab === 'all' || mobileTab === 'telemetry') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Main Sector Card */}
            <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--pri-neon)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Active Sector Telemetry
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>
                    {selectedZone.name}
                  </h3>
                  <div style={{ fontSize: 13, color: 'var(--tx-muted)', marginTop: 2 }}>
                    Ward: {selectedZone.ward} · {selectedZone.taluk}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: selectedZone.floodRisk >= 70 ? '#EF4444' : selectedZone.floodRisk >= 50 ? '#F59E0B' : '#10B981',
                    lineHeight: 1,
                  }}>
                    {selectedZone.floodRisk}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 4 }}>Inundation Risk</div>
                </div>
              </div>

              {/* Plain English Key Data */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 600 }}>Zone Status</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: selectedZone.floodRisk >= 70 ? '#EF4444' : selectedZone.floodRisk >= 50 ? '#F59E0B' : '#10B981', marginTop: 3 }}>
                    {selectedZone.floodRisk >= 70 ? 'High Risk' : selectedZone.floodRisk >= 50 ? 'Watch Zone' : 'Safe Area'}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 600 }}>Rain Sensitivity</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 3 }}>
                    Floods if rain &gt; 35mm
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 600 }}>Nearby Lakes</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#34D399', marginTop: 3 }}>
                    {selectedZone.nearbyLakes.length} Lake Basins
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 600 }}>Relief Center</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#38BDF8', marginTop: 3 }}>
                    BBMP Hall Ready
                  </div>
                </div>
              </div>

              {/* Connected Lake Cascades */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pri-neon)', marginBottom: 6 }}>
                  Connected Hydro Buffers & Lake Chains:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedZone.nearbyLakes.map(lake => (
                    <span
                      key={lake}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.35)',
                        color: '#67E8F9',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {lake}
                    </span>
                  ))}
                </div>
              </div>

              {/* Historical Water Mark */}
              {selectedZone.hwm && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: 12,
                  color: '#FBBF24',
                  lineHeight: 1.5,
                }}>
                  <strong>Historical Water Mark:</strong> {selectedZone.hwm}
                </div>
              )}

              {/* Actions: Transmit Alert & Export GIS */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRoleAction}
                  className="btn-shiny"
                  style={{ flex: 1, minWidth: 150, padding: '10px 14px', fontSize: 12, justifyContent: 'center' }}
                >
                  {isAuthority ? (
                    <><Radio size={14} /> Authority: Deploy QRT Pumps & Advisory</>
                  ) : (
                    <><ShieldCheck size={14} /> Find Safe Route & Shelter</>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportGis}
                  className="btn-glass"
                  style={{ padding: '10px 14px', fontSize: 12 }}
                >
                  <Download size={14} /> GeoJSON
                </motion.button>
              </div>
            </div>

            {/* Underpass Hotspot Details (if clicked) */}
            {selectedHotspot && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bento-card"
                style={{
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  background: 'linear-gradient(145deg, rgba(239,68,68,0.12) 0%, rgba(12,21,16,0.95) 100%)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#EF4444', textTransform: 'uppercase' }}>
                    Live Underpass Telemetry
                  </span>
                  <span style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 700 }}>
                    {selectedHotspot.status}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                  {selectedHotspot.name}
                </h4>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
                  Current Water Inundation: <b style={{ color: '#EF4444' }}>{selectedHotspot.depth}</b>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toast.copy(`ALERT: ${selectedHotspot.name} is under ${selectedHotspot.depth}. Seek diversion.`)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8,
                      background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                      color: '#EF4444', fontWeight: 700, fontSize: 11, cursor: 'pointer'
                    }}
                  >
                    Copy Advisory
                  </button>
                  <button
                    onClick={() => setSelectedHotspot(null)}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFFFFF', fontSize: 11, cursor: 'pointer'
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}
