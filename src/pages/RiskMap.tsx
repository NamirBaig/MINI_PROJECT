import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Layers, AlertCircle, Droplets, Info } from 'lucide-react'
import { BENGALURU_ZONES, BENGALURU_LAKES, FLOOD_PRONE_SPOTS } from '../data/bengaluru'

type LayerType = 'floodRisk' | 'heatRisk' | 'lakeEncroachment' | 'drainageCapacity'

export default function RiskMap() {
  const [activeLayer, setActiveLayer] = useState<LayerType>('floodRisk')
  const [selectedZoneId, setSelectedZoneId] = useState<string>(BENGALURU_ZONES[0].id)
  const [showLakes, setShowLakes] = useState(true)

  const selectedZone = BENGALURU_ZONES.find(z => z.id === selectedZoneId) || BENGALURU_ZONES[0]

  const getRiskColor = (val: number, layer: LayerType) => {
    if (layer === 'drainageCapacity') {
      // Lower drainage is worse
      return val <= 7 ? '#C85C45' : val <= 9 ? '#D59A2A' : '#4c8c5e'
    }
    return val >= 70 ? '#C85C45' : val >= 50 ? '#D59A2A' : '#4c8c5e'
  }

  // Pre-calculated relative layout coordinates for SVG rendering of Bengaluru zones
  const zoneCoords: Record<string, { x: number; y: number; w: number; h: number }> = {
    whitefield: { x: 260, y: 110, w: 120, h: 90 },
    koramangala: { x: 170, y: 150, w: 80, h: 60 },
    'hsr-layout': { x: 190, y: 215, w: 75, h: 60 },
    indiranagar: { x: 180, y: 90, w: 75, h: 55 },
    banashankari: { x: 70, y: 170, w: 90, h: 80 },
    yelahanka: { x: 130, y: 15, w: 120, h: 70 },
    rajajinagar: { x: 90, y: 95, w: 80, h: 65 },
    'btm-layout': { x: 130, y: 220, w: 55, h: 60 },
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px' }}>Bengaluru Geospatial Risk Map</h1>
        <p className="sub" style={{ margin: 0 }}>
          Interactive BBMP Ward vulnerability analysis & lake basin network.
        </p>
      </div>

      {/* Layer selector bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: 'var(--tx-muted)' }}>
          <Layers size={16} /> LAYER:
        </div>
        {[
          { key: 'floodRisk', label: 'Flood Risk' },
          { key: 'heatRisk', label: 'Urban Heat Island' },
          { key: 'lakeEncroachment', label: 'Lake Encroachment %' },
          { key: 'drainageCapacity', label: 'Drainage mm/h' },
        ].map(l => (
          <button
            key={l.key}
            onClick={() => setActiveLayer(l.key as LayerType)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid var(--ln)',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: activeLayer === l.key ? 600 : 400,
              background: activeLayer === l.key ? 'var(--pri)' : 'var(--bg)',
              color: activeLayer === l.key ? 'var(--pri-tx)' : 'var(--tx)',
              transition: 'all 0.15s',
            }}
          >
            {l.label}
          </button>
        ))}

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showLakes}
            onChange={e => setShowLakes(e.target.checked)}
            style={{ accentColor: 'var(--pri)' }}
          />
          Show Major Lakes Overlay
        </label>
      </div>

      {/* Map + Detail sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        {/* SVG Interactive Map */}
        <div className="card" style={{ padding: 16 }}>
          <svg viewBox="0 0 420 320" width="100%" style={{ background: 'var(--surf2)', borderRadius: 8, border: '1px solid var(--ln)' }}>
            {/* Background contours */}
            <path d="M 40 40 Q 200 10 380 40 T 360 280 Q 200 310 40 270 Z" fill="#E2E7DE" opacity="0.6" />

            {/* Zones */}
            {BENGALURU_ZONES.map(z => {
              const c = zoneCoords[z.id] || { x: 50, y: 50, w: 60, h: 50 }
              const val = z[activeLayer]
              const isSelected = z.id === selectedZoneId
              const fillColor = getRiskColor(val, activeLayer)

              return (
                <g key={z.id} onClick={() => setSelectedZoneId(z.id)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={c.x}
                    y={c.y}
                    width={c.w}
                    height={c.h}
                    rx={8}
                    fill={fillColor}
                    fillOpacity={isSelected ? 0.85 : 0.6}
                    stroke={isSelected ? '#17372D' : '#ffffff'}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  <text
                    x={c.x + 8}
                    y={c.y + 20}
                    fontSize={11}
                    fontWeight="700"
                    fill="#1B211D"
                    style={{ pointerEvents: 'none' }}
                  >
                    {z.name}
                  </text>
                  <text
                    x={c.x + 8}
                    y={c.y + 36}
                    fontSize={14}
                    fontWeight="800"
                    fill="#1B211D"
                    style={{ pointerEvents: 'none' }}
                  >
                    {val}
                    {activeLayer === 'drainageCapacity' ? 'mm/h' : '%'}
                  </text>
                </g>
              )
            })}

            {/* Lakes Overlay */}
            {showLakes && (
              <g pointerEvents="none">
                {/* Bellandur */}
                <ellipse cx={275} cy={165} rx={22} ry={12} fill="#3B82F6" fillOpacity={0.8} />
                <text x={260} y={160} fontSize={8} fill="white" fontWeight="600">Bellandur</text>

                {/* Varthur */}
                <ellipse cx={340} cy={175} rx={16} ry={9} fill="#3B82F6" fillOpacity={0.8} />
                <text x={330} y={172} fontSize={8} fill="white" fontWeight="600">Varthur</text>

                {/* Agara */}
                <circle cx={205} cy={195} r={8} fill="#3B82F6" fillOpacity={0.8} />

                {/* Ulsoor */}
                <circle cx={200} cy={110} r={8} fill="#3B82F6" fillOpacity={0.8} />

                {/* Sankey */}
                <circle cx={125} cy={100} r={7} fill="#3B82F6" fillOpacity={0.8} />
              </g>
            )}
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--tx-muted)', justifyContent: 'center' }}>
            <span><b style={{ color: '#C85C45' }}>■</b> Critical (&gt;70)</span>
            <span><b style={{ color: '#D59A2A' }}>■</b> Moderate (50–69)</span>
            <span><b style={{ color: '#4c8c5e' }}>■</b> Low / Safe (&lt;50)</span>
            {showLakes && <span><b style={{ color: '#3B82F6' }}>●</b> Major Waterbody / Lake</span>}
          </div>
        </div>

        {/* Selected zone details */}
        <div className="card">
          <div style={{ borderBottom: '1px solid var(--ln)', paddingBottom: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>
              {selectedZone.ward} Ward · {selectedZone.taluk}
            </span>
            <h2 style={{ margin: '4px 0 0', fontSize: 24 }}>{selectedZone.name}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--ln)' }}>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>FLOOD RISK</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: getRiskColor(selectedZone.floodRisk, 'floodRisk') }}>
                {selectedZone.floodRisk}/100
              </div>
            </div>
            <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--ln)' }}>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>HEAT RISK</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {selectedZone.heatRisk}/100
              </div>
            </div>
            <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--ln)' }}>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>LAKE ENCROACHMENT</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: selectedZone.lakeEncroachment > 70 ? 'var(--dan)' : 'var(--tx)' }}>
                {selectedZone.lakeEncroachment}%
              </div>
            </div>
            <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--ln)' }}>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>DRAIN CAPACITY</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {selectedZone.drainageCapacity} mm/h
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14, fontSize: 13 }}>
            <strong>Nearby Waterbodies:</strong>
            <p style={{ margin: '4px 0 0', color: 'var(--tx-muted)' }}>{selectedZone.nearbyLakes.join(', ')}</p>
          </div>

          {selectedZone.hwm && (
            <div style={{ background: 'var(--dan-bg)', border: '1px solid rgba(200,92,69,0.2)', padding: 10, borderRadius: 6, fontSize: 12, color: 'var(--dan)', marginBottom: 14 }}>
              <strong>Historical Incident:</strong>
              <div>{selectedZone.hwm}</div>
            </div>
          )}

          <div style={{ fontSize: 13 }}>
            <strong>Ward Demographics:</strong>
            <div style={{ color: 'var(--tx-muted)', marginTop: 4 }}>
              Population: {selectedZone.population.toLocaleString()} | Area: {selectedZone.area} km²
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
