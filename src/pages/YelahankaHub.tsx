import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Waves, Droplets, ShieldCheck, AlertTriangle,
  PhoneCall, MapPin, CheckCircle2, ChevronRight,
  Info, ExternalLink, LifeBuoy
} from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { playClickSound, playSuccessSound, playAlertSound, playSirenSound } from '../utils/audioFeedback'

const YELAHANKA_SPOTS = [
  {
    name: 'Yelahanka Amanikere Lake',
    type: 'Primary Lake Basin',
    status: 'Safe Capacity (68%)',
    color: '#10B981',
    note: 'Sluice gates operating normally. Water discharging through designated stormwater canal.',
  },
  {
    name: 'Doddabommasandra Lake',
    type: 'Upstream Lake Chain',
    status: 'Monitored (74%)',
    color: '#10B981',
    note: 'Lake buffer intact. Overflow channels are clear of debris.',
  },
  {
    name: 'Kendriya Vihar Residential Area',
    type: 'Low-Lying Basin',
    status: 'Water Receded (Normal)',
    color: '#10B981',
    note: 'Internal roads and basements are clear. BBMP mobile dewatering pumps stationed on standby.',
  },
  {
    name: 'Chowdeshwari Nagar Underpass',
    type: 'Traffic Underpass',
    status: 'Slow Flow (15cm Water)',
    color: '#F59E0B',
    note: 'Light water on curb. Passable for all vehicles at reduced speed.',
  },
]

export default function YelahankaHub() {
  const { currentRole } = useAuth()
  const isAuthority = currentRole !== 'citizen'
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'simulator' | 'lakes'>('simulator')
  const [floodDepthCm, setFloodDepthCm] = useState<number>(120)

  // Clear, human-understandable impact details for Kendriya Vihar
  const getImpact = (depth: number) => {
    if (depth <= 20) {
      return {
        level: 'Normal / Ankle Deep (0–20 cm)',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.3)',
        homes: 'All homes and basements safe.',
        vehicles: 'Cars and two-wheelers can drive normally.',
        power: 'Full power & water supply active.',
        action: 'No evacuation needed. Drive carefully through puddles.',
      }
    } else if (depth <= 60) {
      return {
        level: 'Knee Deep Water (21–60 cm)',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.3)',
        homes: 'Basement ramps starting to take water. Ground floor safe.',
        vehicles: 'Move parked cars from basement to higher ground.',
        power: 'Power active; basement lift power shut off for safety.',
        action: 'Avoid basement parking. Keep battery torches charged.',
      }
    } else if (depth <= 110) {
      return {
        level: 'Waist Deep Flooding (61–110 cm)',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.3)',
        homes: 'Basements fully flooded; ground floor entry submerged.',
        vehicles: 'Cars in basement fully submerged. Service lanes blocked.',
        power: 'BESCOM shuts power to prevent electrocution.',
        action: 'Move to 1st floor or above. BBMP deployed 6 rescue boats.',
      }
    } else {
      return {
        level: 'Severe Megaflood (111–180 cm — Oct 2024 Level)',
        color: '#DC2626',
        bg: 'rgba(220, 38, 38, 0.15)',
        border: 'rgba(220, 38, 38, 0.45)',
        homes: 'Ground floor flats submerged up to 5 feet. 600+ flats stranded.',
        vehicles: 'All parked vehicles submerged up to roof levels.',
        power: 'Complete blackout; drinking water tankers needed.',
        action: '24 NDRF & SDRF motorized boats deployed for evacuation.',
      }
    }
  }

  const impact = getImpact(floodDepthCm)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1100, margin: '0 auto' }}>
      {/* ─── Header Banner ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 11, 8, 0.8) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: 18,
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34D399',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
            }}>
              <MapPin size={13} /> NORTH BENGALURU
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Yelahanka Zone · Ward 01 to 04
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
            Yelahanka Flood Hub
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255, 255, 255, 0.75)', maxWidth: 640 }}>
            Live water levels, flood depth simulator for Kendriya Vihar, and emergency relief contacts.
          </p>
        </div>

        {/* 1-Click Helpline */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            playClickSound()
            toast.copy('080-22221188')
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#FBBF24',
            padding: '10px 16px',
            borderRadius: 10,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <PhoneCall size={16} />
          <span>Yelahanka Helpdesk: 080-22221188</span>
        </motion.button>
      </div>

      {/* ─── Role Authority Action Banner ─────────────────────── */}
      <div style={{
        background: isAuthority ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
        border: isAuthority ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: 14,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={20} color={isAuthority ? '#EF4444' : '#34D399'} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>
              {isAuthority ? 'Disaster Authority Command Mode: Amanikere Sluice & NDRF Deployment' : 'Resident Protection Mode: Kendriya Vihar Safety & Evacuation'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--tx-muted)' }}>
              {isAuthority ? 'Execute coordinated sluice discharge and dispatch NDRF inflatable boats & submersible pumps' : 'Live household water simulator to check basement parking and flat safety'}
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (isAuthority) {
              playSirenSound()
              toast.success('Disaster Command Authorized', 'Dispatched 2 NDRF rescue boats & opened Amanikere sluice 15%')
            } else {
              playAlertSound()
              toast.alert('Resident Evacuation Requested', 'Relayed flat coordinates to BBMP Control Cell (1533)')
            }
          }}
          className="btn-shiny"
          style={{ padding: '8px 16px', fontSize: 12, fontWeight: 800 }}
        >
          {isAuthority ? 'Deploy NDRF Boats & Canal Sluice' : 'Request Resident Pickup'}
        </motion.button>
      </div>

      {/* ─── 4 Simple Summary Cards ───────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}>
        <div className="bento-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)', fontWeight: 600 }}>TODAY'S RAINFALL</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', marginTop: 4 }}>32 mm</div>
          <div style={{ fontSize: 12, color: '#34D399', marginTop: 4 }}>Light to moderate rain</div>
        </div>

        <div className="bento-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)', fontWeight: 600 }}>AMANIKERE LAKE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981', marginTop: 4 }}>68% Full</div>
          <div style={{ fontSize: 12, color: 'var(--tx-dim)', marginTop: 4 }}>Safe buffer remaining</div>
        </div>

        <div className="bento-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)', fontWeight: 600 }}>KENDRIYA VIHAR</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#34D399', marginTop: 4 }}>All Clear</div>
          <div style={{ fontSize: 12, color: 'var(--tx-dim)', marginTop: 4 }}>Basements dry, roads open</div>
        </div>

        <div className="bento-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)', fontWeight: 600 }}>RESCUE BOATS READY</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#FBBF24', marginTop: 4 }}>6 Boats</div>
          <div style={{ fontSize: 12, color: 'var(--tx-dim)', marginTop: 4 }}>Stationed at Fire Station</div>
        </div>
      </div>

      {/* ─── Simple Tab Switcher ────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: 10,
      }}>
        <button
          onClick={() => {
            playClickSound()
            setActiveTab('simulator')
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'simulator' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: activeTab === 'simulator' ? '#34D399' : 'rgba(255, 255, 255, 0.65)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <Waves size={16} /> Kendriya Vihar Flood Simulator
        </button>

        <button
          onClick={() => {
            playClickSound()
            setActiveTab('lakes')
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'lakes' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: activeTab === 'lakes' ? '#34D399' : 'rgba(255, 255, 255, 0.65)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <Droplets size={16} /> Key Lakes & Hotspots
        </button>
      </div>

      {/* ─── TAB 1: Kendriya Vihar Flood Simulator ─────────── */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="bento-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>
                  Simulate Water Depth at Kendriya Vihar
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--tx-muted)' }}>
                  Drag the slider to see how water levels impact apartment basements, vehicles, and power.
                </p>
              </div>

              <div style={{
                fontSize: 24,
                fontWeight: 900,
                color: impact.color,
                background: impact.bg,
                border: `1px solid ${impact.border}`,
                padding: '6px 16px',
                borderRadius: 10,
              }}>
                {floodDepthCm} cm <span style={{ fontSize: 14, opacity: 0.8 }}>({(floodDepthCm / 30.48).toFixed(1)} ft)</span>
              </div>
            </div>

            {/* Interactive Slider */}
            <div style={{ marginTop: 24 }}>
              <input
                type="range"
                min="0"
                max="180"
                value={floodDepthCm}
                onChange={e => setFloodDepthCm(Number(e.target.value))}
                style={{ width: '100%', accentColor: impact.color, cursor: 'pointer', height: 8 }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                <span>0 cm (Safe)</span>
                <span>40 cm (Knee Deep)</span>
                <span>80 cm (Waist Deep)</span>
                <span>140 cm (Basement Flooded)</span>
                <span>180 cm (Oct 2024 Peak)</span>
              </div>
            </div>

            {/* Impact Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: 14,
              marginTop: 24,
            }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  🏠 Impact on Homes
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginTop: 6, lineHeight: 1.4 }}>
                  {impact.homes}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  🚗 Parked Vehicles
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginTop: 6, lineHeight: 1.4 }}>
                  {impact.vehicles}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  ⚡ Electricity & Water
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginTop: 6, lineHeight: 1.4 }}>
                  {impact.power}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  🚨 Recommended Action
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#34D399', marginTop: 6, lineHeight: 1.4 }}>
                  {impact.action}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Key Lakes & Hotspots ──────────────────── */}
      {activeTab === 'lakes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {YELAHANKA_SPOTS.map((spot, i) => (
            <div
              key={i}
              className="bento-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                padding: '16px 20px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>{spot.name}</h4>
                  <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>({spot.type})</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  {spot.note}
                </p>
              </div>

              <span style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                color: spot.color,
                background: 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${spot.color}50`,
              }}>
                {spot.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
