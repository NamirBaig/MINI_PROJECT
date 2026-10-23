import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, Layers, AlertCircle, Droplets, Info, Search,
  Compass, ShieldCheck, Waves, ArrowRight, CheckCircle2, ChevronRight,
  ZoomIn, ZoomOut, RotateCcw, Radio, Activity, Download, Share2,
  AlertTriangle, Eye, Flame, Navigation, MapPin, SlidersHorizontal, Crosshair,
  Route, Clock, ShieldAlert, Sparkles, Bed
} from 'lucide-react'
import { BENGALURU_ZONES, BENGALURU_LAKES, FLOOD_PRONE_SPOTS, BENGALURU_STATS } from '../data/bengaluru'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'
import RequirementMap from '../components/RequirementMap'
import RealBengaluruMap from '../components/RealBengaluruMap'
import {
  BENGALURU_HUBS,
  EMERGENCY_SHELTERS,
  calculateSafeRoute,
  type SafeRouteResult,
} from '../services/safeRoutingService'
import { getDeviceLiveLocation } from '../utils/geolocation'

type MobileTab = 'all' | 'map' | 'navigation' | 'telemetry'

export default function RiskMap() {
  const { currentRole } = useAuth()
  const isAuthority = currentRole !== 'citizen'
  const toast = useToast()

  // Routing State
  const [sourceHubId, setSourceHubId] = useState<string>('kendriya-vihar')
  const [destHubId, setDestHubId] = useState<string>('airport-kia')
  const [customGpsCoords, setCustomGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false)
  const [routeResult, setRouteResult] = useState<SafeRouteResult>(() =>
    calculateSafeRoute('kendriya-vihar', 'airport-kia')
  )

  // Map Focus & Telemetry State
  const [selectedZoneId, setSelectedZoneId] = useState<string>(BENGALURU_ZONES[0].id)
  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('all')
  const [authorityMapMode, setAuthorityMapMode] = useState<'risk' | 'requirement'>('risk')

  const selectedZone = BENGALURU_ZONES.find(z => z.id === selectedZoneId) || BENGALURU_ZONES[0]

  // Re-calculate route
  const handleRecalculateRoute = (srcId: string, dstId: string, customCoords?: { lat: number; lng: number }) => {
    const res = calculateSafeRoute(srcId, dstId, customCoords || customGpsCoords || undefined)
    setRouteResult(res)
    setFocusCoords({
      lat: (res.source.lat + res.destination.lat) / 2,
      lng: (res.source.lng + res.destination.lng) / 2,
      zoom: 12,
    })
    if (res.hasFloodHazard) {
      playAlertSound()
      toast.alert('Hazard Avoidance Active', `Diverted around ${res.blockedHazardName} (${res.hazardWaterDepth} water)`)
    } else {
      playSuccessSound()
      toast.success('Safe Route Confirmed', `${res.safeDistanceKm} km corridor • 0 active flood risks`)
    }
  }

  // Live GPS locator for routing
  const handleUseLiveGpsForRoute = async () => {
    setIsLocatingUser(true)
    playClickSound()
    try {
      const loc = await getDeviceLiveLocation()
      const coords = { lat: loc.latitude, lng: loc.longitude }
      setCustomGpsCoords(coords)
      setSourceHubId('my-location')
      handleRecalculateRoute('my-location', destHubId, coords)
      playSuccessSound()
      toast.success('Live GPS Source Set', `Position locked (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`)
    } catch (err: any) {
      playAlertSound()
      toast.alert('GPS Notice', err?.message || 'Could not lock GPS location.')
    } finally {
      setIsLocatingUser(false)
    }
  }

  // Navigate directly to safe shelter
  const handleRouteToShelter = (shelter: SafeRouteResult['nearestShelter']) => {
    playSuccessSound()
    // Find or craft a destination hub for this shelter
    setDestHubId(shelter.id)
    const res = calculateSafeRoute(sourceHubId, shelter.id, customGpsCoords || undefined)
    setRouteResult(res)
    setFocusCoords({ lat: shelter.lat, lng: shelter.lng, zoom: 14 })
    toast.info('Emergency Evacuation Route Set', `Navigating directly to ${shelter.name}`)
  }

  // Focus a specific zone on the real map
  const handleSelectZone = (zone: typeof BENGALURU_ZONES[0]) => {
    playClickSound()
    setSelectedZoneId(zone.id)
    setFocusCoords({ lat: zone.lat, lng: zone.lng, zoom: 13 })
    toast.info(`Sector Focused: ${zone.name}`, `Real-time risk score: ${zone.floodRisk}%`)
  }

  const handleExportGis = () => {
    playClickSound()
    const geoJson = {
      type: 'FeatureCollection',
      zone: selectedZone.name,
      ward: selectedZone.ward,
      hazardScore: selectedZone.floodRisk,
      drainageCapacity: selectedZone.drainageCapacity,
      safeRoute: routeResult.safePath,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SafeGround_BlackTheme_GIS_${selectedZone.id}.geojson`
    a.click()
    URL.revokeObjectURL(url)
    playSuccessSound()
    toast.success('GIS Telemetry Exported', `Downloaded geoJSON for ${selectedZone.name}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>
      {/* ─── Top Header: Real Black Theme & Navigation ────────── */}
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
              padding: '3px 10px',
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#34D399',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
              REAL BLACK THEME MAP & INCIDENT ROUTING
            </span>
            <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>CartoDB Dark Matter GIS</span>
          </div>

          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#FFFFFF', letterSpacing: -0.5 }}>
            Bengaluru Defense Grid & SafeRoute AI
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', maxWidth: 620 }}>
            Real-world geospatial telemetry tracking Bengaluru flood basins, submerged underpasses,
            and automated high-ground shelter directions avoiding all reported inundation corridors.
          </p>
        </div>

        {/* View Switcher for Municipal Authority */}
        {isAuthority && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { playClickSound(); setAuthorityMapMode('risk'); }}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                background: authorityMapMode === 'risk' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255,255,255,0.06)',
                border: authorityMapMode === 'risk' ? 'none' : '1px solid rgba(255,255,255,0.12)',
                color: authorityMapMode === 'risk' ? '#030604' : '#FFFFFF',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              1. Real Map & Safe Routing
            </button>
            <button
              onClick={() => { playClickSound(); setAuthorityMapMode('requirement'); }}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                background: authorityMapMode === 'requirement' ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)' : 'rgba(255,255,255,0.06)',
                border: authorityMapMode === 'requirement' ? 'none' : '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              2. Hospital & Resource Radar
            </button>
          </div>
        )}
      </div>

      {authorityMapMode === 'requirement' ? (
        <RequirementMap />
      ) : (
        <>
          {/* ─── SafeRoute AI: Incident-Aware Navigation Console ─── */}
          <div className="bento-card" style={{ padding: '20px 24px', background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(9, 14, 11, 0.95) 100%)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Route size={18} color="#10B981" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                  SafeRoute AI: Find Flood-Free Directions
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)' }}>
                  {routeResult.safeDistanceKm} km · Est. {routeResult.safeEstMinutes} mins
                </span>
                <button
                  type="button"
                  onClick={handleUseLiveGpsForRoute}
                  disabled={isLocatingUser}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: sourceHubId === 'my-location' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    border: sourceHubId === 'my-location' ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: sourceHubId === 'my-location' ? '#34D399' : '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Navigation size={12} />
                  {isLocatingUser ? 'Locating...' : sourceHubId === 'my-location' ? '✓ Live GPS Set' : '📍 Use My Live GPS'}
                </button>
              </div>
            </div>

            {/* Inputs: Source & Destination */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 6 }}>
                  STARTING LOCATION (SOURCE):
                </label>
                <select
                  value={sourceHubId}
                  onChange={e => {
                    setSourceHubId(e.target.value)
                    handleRecalculateRoute(e.target.value, destHubId)
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {customGpsCoords && (
                    <option value="my-location" style={{ background: '#111814', color: '#34D399' }}>
                      📍 My Current Live GPS Location
                    </option>
                  )}
                  {BENGALURU_HUBS.map(h => (
                    <option key={h.id} value={h.id} style={{ background: '#111814', color: '#FFFFFF' }}>
                      {h.name} ({h.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 6 }}>
                  DESTINATION (WHERE TO GO):
                </label>
                <select
                  value={destHubId}
                  onChange={e => {
                    setDestHubId(e.target.value)
                    handleRecalculateRoute(sourceHubId, e.target.value)
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {BENGALURU_HUBS.map(h => (
                    <option key={h.id} value={h.id} style={{ background: '#111814', color: '#FFFFFF' }}>
                      {h.name} ({h.zone})
                    </option>
                  ))}
                  {EMERGENCY_SHELTERS.map(s => (
                    <option key={s.id} value={s.id} style={{ background: '#0a1d13', color: '#34D399' }}>
                      🛡️ Safe Shelter: {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Incident Alert / Safe Route Callout */}
            {routeResult.hasFloodHazard ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(239, 68, 68, 0.14)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <AlertTriangle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#EF4444' }}>
                    FLOOD INCIDENT REPORTED ON DIRECT CORRIDOR
                  </div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                    <b>{routeResult.blockedHazardName}</b> is currently under <b>{routeResult.hazardWaterDepth}</b> of water.
                    SafeGround AI has automatically calculated an elevated alternative detour avoiding all submerged roads.
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(16, 185, 129, 0.25)',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  fontSize: 11,
                  fontWeight: 800,
                }}>
                  🛡️ Bypass Active: 0 Flood Risk
                </div>
              </motion.div>
            ) : (
              <div style={{
                marginTop: 14,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#34D399',
                fontWeight: 700,
              }}>
                <CheckCircle2 size={16} />
                <span>All clear: No active waterlogging incidents reported on this direct path.</span>
              </div>
            )}
          </div>

          {/* ─── REAL BLACK-THEME LEAFLET MAP OF BENGALURU ────── */}
          <div className="bento-card" style={{ padding: 16 }}>
            <RealBengaluruMap
              routeResult={routeResult}
              userLiveCoords={customGpsCoords}
              focusCoords={focusCoords}
              height="560px"
            />
          </div>

          {/* ─── Bottom Navigation Guidance & Nearest Safe Area ─ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Nearest High-Ground Emergency Safe Area Card */}
            <div className="bento-card" style={{
              background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12) 0%, rgba(9, 14, 11, 0.98) 100%)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ShieldCheck size={14} /> NEAREST VERIFIED SAFE HAVEN
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', padding: '2px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.25)' }}>
                    HIGH GROUND
                  </span>
                </div>

                <h4 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: '#FFFFFF' }}>
                  {routeResult.nearestShelter.name}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 10, color: 'var(--tx-muted)', fontWeight: 700 }}>DISTANCE TO SAFETY</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#FFFFFF', marginTop: 3 }}>
                      {routeResult.nearestShelter.distanceKm} km
                    </div>
                    <div style={{ fontSize: 10, color: '#34D399', marginTop: 2 }}>~{routeResult.nearestShelter.walkMinutes} mins walk</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 10, color: 'var(--tx-muted)', fontWeight: 700 }}>ELEVATION ADVANTAGE</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#38BDF8', marginTop: 3 }}>
                      {routeResult.nearestShelter.elevationMsl}m MSL
                    </div>
                    <div style={{ fontSize: 10, color: '#38BDF8', marginTop: 2 }}>+{routeResult.nearestShelter.elevationAdvantageM}m above basin</div>
                  </div>
                </div>

                <div style={{ marginTop: 12, fontSize: 11.5, color: 'rgba(255,255,255,0.75)', display: 'flex', gap: 12 }}>
                  <span>Capacity: <b>{routeResult.nearestShelter.shelterCapacity} citizens</b></span>
                  <span>Beds: <b style={{ color: '#10B981' }}>{routeResult.nearestShelter.availableBeds} ready</b></span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRouteToShelter(routeResult.nearestShelter)}
                className="btn-shiny"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 12.5 }}
              >
                <Navigation size={14} /> 📍 Navigate Directly to this Safe Shelter
              </motion.button>
            </div>

            {/* Turn-by-Turn Safe Navigation Instructions */}
            <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--pri-neon)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Turn-By-Turn Corridor Guidance
                </span>
                <span style={{ fontSize: 10, color: 'var(--tx-muted)' }}>
                  BBMP Traffic Police Synchronized
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {routeResult.instructions.map(inst => (
                  <div
                    key={inst.step}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: inst.isSafetyWarning ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: inst.isSafetyWarning ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <span style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: inst.isSafetyWarning ? '#EF4444' : '#10B981',
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {inst.step}
                    </span>
                    <div style={{ flex: 1, fontSize: 12, color: inst.isSafetyWarning ? '#FCA5A5' : '#FFFFFF', lineHeight: 1.4 }}>
                      {inst.text}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--tx-muted)', fontWeight: 700, flexShrink: 0 }}>
                      {inst.distance}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => toast.copy(`SafeRoute: ${routeResult.source.name} to ${routeResult.destination.name} via ${routeResult.safeDistanceKm}km bypass.`)}
                  className="btn-glass"
                  style={{ flex: 1, padding: '8px 12px', fontSize: 11, justifyContent: 'center' }}
                >
                  <Share2 size={13} /> Share Route
                </button>
                <button
                  onClick={handleExportGis}
                  className="btn-glass"
                  style={{ padding: '8px 12px', fontSize: 11 }}
                >
                  <Download size={13} /> GeoJSON
                </button>
              </div>
            </div>
          </div>

          {/* ─── Sector Focus Rail ──────────────────────────────── */}
          <div className="bento-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--tx-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
              Tap Zone to Center Real Map & Telemetry:
            </div>
            <div className="riskmap-chip-scroll">
              {BENGALURU_ZONES.map(z => {
                const isSelected = z.id === selectedZoneId
                return (
                  <button
                    key={z.id}
                    onClick={() => handleSelectZone(z)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: isSelected ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
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
        </>
      )}
    </div>
  )
}
