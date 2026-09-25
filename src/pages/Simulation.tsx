import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, AlertTriangle, Droplets, Activity, RefreshCw, CheckCircle2 } from 'lucide-react'
import { BENGALURU_ZONES, FLOOD_PRONE_SPOTS, HISTORICAL_DISASTERS } from '../data/bengaluru'

interface SimState {
  type: string
  sev: string
  rain: number
  dur: number
  zoneId: string
}

interface SimResult {
  risk: number
  popExposed: number
  infraImpact: number
  roadDisruption: number
  healthcareDemand: number
  waterReq: number
  kitsReq: number
  econLoss: number
  actions: string[]
}

const STAGES = [
  'Analyzing Bengaluru terrain and drainage gradients...',
  'Estimating zone-wise population exposure...',
  'Calculating BBMP storm drain overload and infrastructure stress...',
  'Estimating emergency resource and NDRF team deployment...',
  'Generating localized evacuation and response actions...',
]

export default function Simulation() {
  const [st, setSt] = useState<SimState>({
    type: 'Flood',
    sev: 'High',
    rain: 140, // similar to 2022 megaflood
    dur: 24,
    zoneId: 'whitefield',
  })

  const [busy, setBusy] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [result, setResult] = useState<SimResult | null>(null)

  const selectedZone = BENGALURU_ZONES.find(z => z.id === st.zoneId) || BENGALURU_ZONES[0]

  const calculateSimulation = (state: SimState): SimResult => {
    const sevFactor = state.sev === 'Extreme' ? 1.3 : state.sev === 'High' ? 1.0 : state.sev === 'Moderate' ? 0.7 : 0.4
    const rainFactor = Math.min(2.0, state.rain / 130)
    const durFactor = Math.min(1.5, state.dur / 24)
    const zoneVulnerability = (selectedZone.floodRisk * 0.6 + selectedZone.lakeEncroachment * 0.4) / 100

    const rawRisk = Math.round(Math.min(98, (rainFactor * 40 + durFactor * 25 + zoneVulnerability * 35) * sevFactor))
    const risk = Math.max(15, rawRisk)

    const popExposed = Math.round(selectedZone.population * (risk / 100) * 0.75)
    const infraImpact = Math.min(95, Math.round(risk * 0.92))
    const roadDisruption = Math.min(95, Math.round(risk * 0.88))
    const healthcareDemand = Math.min(85, Math.round(risk * 0.55))
    const waterReq = Math.round(popExposed * 3 * Math.max(1, state.dur / 24))
    const kitsReq = Math.round(popExposed / 4)
    const econLoss = Math.round((popExposed / 1000) * (state.rain / 50) * 1.8)

    const actions: string[] = []
    if (state.type === 'Flood' || state.rain > 80) {
      actions.push(`Deploy heavy-duty dewatering pumps to ${selectedZone.name} underpasses and IT corridors`)
      actions.push(`Open emergency spillways along ${selectedZone.nearbyLakes.join(', ')} buffer canals`)
      actions.push(`Issue traffic diversion alerts across Outer Ring Road and ${selectedZone.ward} roads`)
    }
    if (infraImpact > 60) {
      actions.push(`Pre-position BESCOM electrical response squads to avert transformer submersion electrocution`)
      actions.push(`Establish dry-ground relief stations at ${selectedZone.ward} Community Centres`)
    }
    if (healthcareDemand > 40) {
      actions.push(`Set up mobile medical camps for waterborne contamination and leptospirosis prevention`)
    }
    actions.push(`Notify BBMP Disaster Response Cell (1533) and deploy regional SDRF battalions`)

    return {
      risk,
      popExposed,
      infraImpact,
      roadDisruption,
      healthcareDemand,
      waterReq,
      kitsReq,
      econLoss,
      actions,
    }
  }

  const runSimulation = () => {
    setBusy(true)
    setResult(null)
    setCurrentStage(0)

    let stage = 0
    const interval = setInterval(() => {
      stage++
      if (stage < STAGES.length) {
        setCurrentStage(stage)
      } else {
        clearInterval(interval)
        setBusy(false)
        setResult(calculateSimulation(st))
      }
    }, 450)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px' }}>What If Bengaluru?</h1>
        <p className="sub" style={{ margin: 0 }}>
          Scenario stress-testing engine calibrated against Bengaluru's topography, lake cascade networks, and BBMP drainage capacity (7mm/h).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 28 }}>
        {/* Left: Controls */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Scenario Parameters</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Disaster Type</label>
              <select
                className="input"
                value={st.type}
                onChange={e => setSt({ ...st, type: e.target.value })}
              >
                <option value="Flood">Urban Flood (Lake Overflow)</option>
                <option value="Cloudbursts">Monsoon Cloudburst</option>
                <option value="Heatwave">Severe Heatwave</option>
                <option value="Landslide">Erosion / Silt Slip</option>
                <option value="Earthquake">Seismic Shaking (Zone II)</option>
              </select>
            </div>

            <div>
              <label>Severity</label>
              <select
                className="input"
                value={st.sev}
                onChange={e => setSt({ ...st, sev: e.target.value })}
              >
                <option value="Low">Low (Annual anomaly)</option>
                <option value="Moderate">Moderate (5-year flood)</option>
                <option value="High">High (2022 Megaflood Level)</option>
                <option value="Extreme">Extreme (Unprecedented / 200mm+)</option>
              </select>
            </div>
          </div>

          <div>
            <label>Target Bengaluru Zone</label>
            <select
              className="input"
              value={st.zoneId}
              onChange={e => setSt({ ...st, zoneId: e.target.value })}
            >
              {BENGALURU_ZONES.map(z => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.ward} - Pop: {(z.population / 1000).toFixed(0)}k)
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ margin: 0 }}>24h Rainfall: {st.rain} mm</label>
              <span style={{ fontSize: 11, color: st.rain >= 130 ? 'var(--dan)' : 'var(--tx-muted)' }}>
                {st.rain >= 131 ? '⚠️ Exceeds Sep 2022 Megaflood (131mm)' : 'BBMP drain cap: 7mm/h'}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="250"
              step="5"
              value={st.rain}
              onChange={e => setSt({ ...st, rain: +e.target.value })}
              style={{ width: '100%', accentColor: 'var(--pri)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ margin: 0 }}>Duration: {st.dur} Hours</label>
            </div>
            <input
              type="range"
              min="2"
              max="72"
              step="2"
              value={st.dur}
              onChange={e => setSt({ ...st, dur: +e.target.value })}
              style={{ width: '100%', accentColor: 'var(--pri)' }}
            />
          </div>

          <div style={{ background: 'var(--surf2)', padding: 12, borderRadius: 6, fontSize: 13, border: '1px solid var(--ln)' }}>
            <strong>Zone Profile: {selectedZone.name}</strong>
            <div style={{ display: 'flex', gap: 14, marginTop: 4, color: 'var(--tx-muted)', flexWrap: 'wrap' }}>
              <span>Lakes: {selectedZone.nearbyLakes.join(', ')}</span>
              <span>Encroachment: {selectedZone.lakeEncroachment}%</span>
              <span>Baseline Flood Risk: {selectedZone.floodRisk}/100</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={runSimulation}
            disabled={busy}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}
          >
            {busy ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Simulating Impact...
              </>
            ) : (
              <>
                <Zap size={16} /> Run What-If Simulation
              </>
            )}
          </motion.button>
        </div>

        {/* Right: Results / Progress */}
        <div className="card">
          {busy ? (
            <div style={{ padding: '24px 8px' }}>
              <h3 style={{ marginBottom: 20 }}>Simulating Bengaluru Crisis Scenario...</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {STAGES.map((s, i) => {
                  const isDone = i < currentStage
                  const isCurrent = i === currentStage
                  return (
                    <motion.div
                      key={s}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: isCurrent ? 1 : isDone ? 0.8 : 0.25, x: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: isCurrent ? 'var(--pri)' : isDone ? 'var(--low)' : 'var(--tx-muted)',
                        fontWeight: isCurrent ? 600 : 400,
                        fontSize: 14,
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={18} color="var(--low)" />
                      ) : isCurrent ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--ln)' }} />
                      )}
                      <span>{s}</span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : result ? (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      background: result.risk >= 70 ? 'var(--dan-bg)' : result.risk >= 45 ? 'var(--warn-bg)' : 'var(--low-bg)',
                      color: result.risk >= 70 ? 'var(--dan)' : result.risk >= 45 ? 'var(--warn)' : 'var(--low)',
                    }}>
                      {result.risk >= 70 ? 'CRITICAL DISASTER RISK' : result.risk >= 45 ? 'HIGH WATCH LEVEL' : 'MODERATE IMPACT'}
                    </span>
                    <h2 style={{ margin: '8px 0 0', fontSize: 22 }}>
                      Predicted Risk Score: {result.risk}/100
                    </h2>
                  </div>
                </div>

                {/* Metrics grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 6, border: '1px solid var(--ln)' }}>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 600 }}>POPULATION EXPOSED</div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{result.popExposed.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>residents at immediate risk</div>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 6, border: '1px solid var(--ln)' }}>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 600 }}>ESTIMATED LOSS</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--dan)' }}>₹{result.econLoss} Cr</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>infrastructure & business damage</div>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 6, border: '1px solid var(--ln)' }}>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 600 }}>POTABLE WATER REQUIRED</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{(result.waterReq / 1000).toFixed(1)}k Litres</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>BWSSB emergency quota</div>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 6, border: '1px solid var(--ln)' }}>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 600 }}>EMERGENCY KITS</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{result.kitsReq.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>first aid + rations needed</div>
                  </div>
                </div>

                {/* Impact progress bars */}
                <div style={{ marginBottom: 20 }}>
                  {[
                    { label: 'Infrastructure Breakdown', val: result.infraImpact },
                    { label: 'Road Network Submersion', val: result.roadDisruption },
                    { label: 'Healthcare & Bed Strain', val: result.healthcareDemand },
                  ].map(b => (
                    <div key={b.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span>{b.label}</span>
                        <b>{b.val}%</b>
                      </div>
                      <div className="bar">
                        <motion.div
                          className="bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${b.val}%` }}
                          transition={{ duration: 0.6 }}
                          style={{ background: b.val > 65 ? 'var(--dan)' : 'var(--warn)' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Priority Actions */}
                <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Priority City Actions</h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--tx)', lineHeight: 1.6 }}>
                  {result.actions.map(act => (
                    <li key={act} style={{ marginBottom: 4 }}>{act}</li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--tx-muted)' }}>
              <Zap size={36} style={{ color: 'var(--pri)', opacity: 0.4, marginBottom: 12 }} />
              <h3>No Simulation Run Yet</h3>
              <p style={{ fontSize: 13, maxWidth: '280px', margin: '0 auto' }}>
                Adjust rainfall, severity, and zone parameters on the left to simulate a real disaster impact on Bengaluru.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Flood prone spots table */}
      <div className="card" style={{ marginTop: 28 }}>
        <h3 style={{ margin: '0 0 12px' }}>High-Risk Vulnerable Choke Points in Bengaluru</h3>
        <p className="sub" style={{ margin: '0 0 16px', fontSize: 13 }}>
          Verified chronic waterlogging points identified by KSNDMC and BBMP storm water division:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {FLOOD_PRONE_SPOTS.map((spot, i) => (
            <div
              key={spot}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'var(--bg)',
                borderRadius: 6,
                border: '1px solid var(--ln)',
                fontSize: 13,
              }}
            >
              <AlertTriangle size={14} color="#C85C45" />
              <span>{spot}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
