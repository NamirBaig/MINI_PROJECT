import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, Route, ShieldCheck, AlertTriangle, Navigation, MapPin,
  Crosshair, ArrowUpDown, ChevronDown, ChevronUp, CheckCircle2,
  Clock, ShieldAlert, Sparkles, Building2, Droplets, RotateCcw,
  SlidersHorizontal, Layers, Share2, Download, Compass
} from 'lucide-react'
import { BENGALURU_ZONES, BENGALURU_LAKES, FLOOD_PRONE_SPOTS } from '../data/bengaluru'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'
import RequirementMap from '../components/RequirementMap'
import RealBengaluruMap, { type BasemapTheme } from '../components/RealBengaluruMap'
import {
  BENGALURU_HUBS,
  EMERGENCY_SHELTERS,
  calculateSafeRoute,
  type SafeRouteResult,
  type LocationHub,
} from '../services/safeRoutingService'
import { getDeviceLiveLocation, type LiveLocationResult } from '../utils/geolocation'

export default function RiskMap() {
  const { currentRole } = useAuth()
  const isAuthority = currentRole !== 'citizen'
  const toast = useToast()

  // Routing State
  const [sourceHubId, setSourceHubId] = useState<string>('my-location')
  const [destHubId, setDestHubId] = useState<string>('airport-kia')
  const [customGpsCoords, setCustomGpsCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null)
  const [customSourceCoords, setCustomSourceCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [customDestCoords, setCustomDestCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedAltId, setSelectedAltId] = useState<string>('route-primary')
  const [clickPickMode, setClickPickMode] = useState<'source' | 'destination' | 'none'>('none')
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false)
  const [showInstructions, setShowInstructions] = useState<boolean>(false)

  // Map Focus State
  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)
  const [authorityMapMode, setAuthorityMapMode] = useState<'risk' | 'requirement'>('risk')

  // Initial Route State
  const [routeResult, setRouteResult] = useState<SafeRouteResult>(() =>
    calculateSafeRoute('kendriya-vihar', 'airport-kia', undefined, undefined, 'route-primary')
  )

  // Auto-acquire User GPS on mount so their location appears immediately on the map
  useEffect(() => {
    let isSubscribed = true
    setIsLocatingUser(true)

    getDeviceLiveLocation()
      .then((loc: LiveLocationResult) => {
        if (!isSubscribed) return
        const coords = { lat: loc.latitude, lng: loc.longitude, accuracy: loc.accuracy }
        setCustomGpsCoords(coords)
        setSourceHubId('my-location')

        const res = calculateSafeRoute('my-location', destHubId, coords, customDestCoords || undefined, selectedAltId)
        setRouteResult(res)
        setIsLocatingUser(false)
        playSuccessSound()
        toast.success('Live Location Acquired', `Beacon pinned in ${loc.nearestZone} (±${Math.round(loc.accuracy)}m precision)`)
      })
      .catch((_err: any) => {
        if (!isSubscribed) return
        setIsLocatingUser(false)
        setSourceHubId('kendriya-vihar')
        const fallback = calculateSafeRoute('kendriya-vihar', destHubId, undefined, customDestCoords || undefined, selectedAltId)
        setRouteResult(fallback)
      })

    return () => {
      isSubscribed = false
    }
  }, [])

  // Recalculate route helper
  const updateRoute = (
    srcId: string,
    dstId: string,
    altId: string = selectedAltId,
    srcCoords?: { lat: number; lng: number },
    dstCoords?: { lat: number; lng: number }
  ) => {
    const effectiveSrcCoords = srcId === 'my-location'
      ? (customGpsCoords ? { lat: customGpsCoords.lat, lng: customGpsCoords.lng } : undefined)
      : (srcCoords || customSourceCoords || undefined)

    const effectiveDstCoords = dstCoords || customDestCoords || undefined

    const res = calculateSafeRoute(srcId, dstId, effectiveSrcCoords, effectiveDstCoords, altId)
    setRouteResult(res)
    setSelectedAltId(altId)

    if (res.hasFloodHazard) {
      playAlertSound()
      toast.alert('Hazard Evaded', `Diverted around ${res.blockedHazardName} (${res.hazardWaterDepth} flood water)`)
    } else {
      playSuccessSound()
    }
  }

  // Handle manual Live GPS trigger
  const handleAcquireGps = async () => {
    setIsLocatingUser(true)
    playClickSound()
    try {
      const loc = await getDeviceLiveLocation()
      const coords = { lat: loc.latitude, lng: loc.longitude, accuracy: loc.accuracy }
      setCustomGpsCoords(coords)
      setSourceHubId('my-location')
      updateRoute('my-location', destHubId, selectedAltId, coords)
      setFocusCoords({ lat: loc.latitude, lng: loc.longitude, zoom: 15 })
      playSuccessSound()
      toast.success('Live GPS Locked', `${loc.nearestZone} Zone · ${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`)
    } catch (err: any) {
      playAlertSound()
      toast.alert('GPS Notice', err?.message || 'Could not acquire device GPS.')
    } finally {
      setIsLocatingUser(false)
    }
  }

  // Handle map click for custom pin placement
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (clickPickMode === 'source') {
      playSuccessSound()
      setCustomSourceCoords(coords)
      setSourceHubId('custom-pin-src')
      setClickPickMode('none')
      updateRoute('custom-pin-src', destHubId, selectedAltId, coords)
      toast.success('Start Point Pinned', `Set source at ${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`)
    } else if (clickPickMode === 'destination') {
      playSuccessSound()
      setCustomDestCoords(coords)
      setDestHubId('custom-pin-dest')
      setClickPickMode('none')
      updateRoute(sourceHubId, 'custom-pin-dest', selectedAltId, undefined, coords)
      toast.success('Destination Pinned', `Set destination at ${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`)
    }
  }

  // Swap Source and Destination
  const handleSwapRoute = () => {
    playClickSound()
    const newSrc = destHubId
    const newDst = sourceHubId
    const newSrcCoords = customDestCoords
    const newDstCoords = sourceHubId === 'my-location' ? (customGpsCoords ? { lat: customGpsCoords.lat, lng: customGpsCoords.lng } : null) : customSourceCoords

    setSourceHubId(newSrc)
    setDestHubId(newDst)
    setCustomSourceCoords(newSrcCoords)
    setCustomDestCoords(newDstCoords)

    updateRoute(newSrc, newDst, selectedAltId, newSrcCoords || undefined, newDstCoords || undefined)
    toast.info('Route Reversed', 'Swapped source and destination')
  }

  // Route directly to nearest high-ground shelter
  const handleRouteToShelter = (shelter: SafeRouteResult['nearestShelter']) => {
    playSuccessSound()
    setDestHubId(shelter.id)
    setCustomDestCoords(null)
    updateRoute(sourceHubId, shelter.id, selectedAltId)
    setFocusCoords({ lat: shelter.lat, lng: shelter.lng, zoom: 14 })
    toast.info('Evacuation Corridor Plotted', `Navigating to ${shelter.name} (+${shelter.elevationAdvantageM}m MSL)`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1440, margin: '0 auto', width: '100%' }}>
      {/* ─── Top Header & Authority Mode Bar ──────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 11, 8, 0.90) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: 16,
        padding: '16px 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#34D399',
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: 0.5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
              BENGALURU GIS DEFENSE GRID
            </span>
            <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>
              {customGpsCoords ? `Live GPS: ${customGpsCoords.lat.toFixed(4)}°N, ${customGpsCoords.lng.toFixed(4)}°E (±${Math.round(customGpsCoords.accuracy || 20)}m)` : 'GPS Ready'}
            </span>
          </div>

          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#FFFFFF', letterSpacing: -0.4 }}>
            Flood-Aware Navigation & Defense Grid
          </h1>
        </div>

        {/* Action Header Pills */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleAcquireGps}
            disabled={isLocatingUser}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              background: customGpsCoords ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: customGpsCoords ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.15)',
              color: customGpsCoords ? '#60A5FA' : '#FFFFFF',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Crosshair size={13} />
            {isLocatingUser ? 'Acquiring GPS...' : customGpsCoords ? '✓ Live GPS Pinned' : '📍 Detect My GPS'}
          </button>

          <button
            type="button"
            onClick={() => handleRouteToShelter(routeResult.nearestShelter)}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              color: '#030604',
              fontSize: 11.5,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.4)',
            }}
          >
            <ShieldCheck size={13} />
            🛡️ Nearest Safe Shelter ({routeResult.nearestShelter.distanceKm} km)
          </button>

          {isAuthority && (
            <div style={{ display: 'flex', gap: 6, borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 8 }}>
              <button
                onClick={() => { playClickSound(); setAuthorityMapMode('risk'); }}
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: authorityMapMode === 'risk' ? '#10B981' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: authorityMapMode === 'risk' ? '#030604' : '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Map & Routing
              </button>
              <button
                onClick={() => { playClickSound(); setAuthorityMapMode('requirement'); }}
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: authorityMapMode === 'requirement' ? '#EF4444' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Hospitals & Radar
              </button>
            </div>
          )}
        </div>
      </div>

      {authorityMapMode === 'requirement' ? (
        <RequirementMap />
      ) : (
        /* ─── Main Map & Route Console Layout (Responsive Split-Screen) ─── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 420px) 1fr',
          gap: 16,
          alignItems: 'stretch',
        }} className="riskmap-split-container">

          {/* ─── LEFT COLUMN: Route Planner & Telemetry Console ─── */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            maxHeight: 'calc(100vh - 170px)',
            overflowY: 'auto',
            paddingRight: 4,
          }} className="riskmap-sidebar">

            {/* Source & Destination Card */}
            <div className="bento-card" style={{
              padding: '18px 20px',
              background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(9, 14, 11, 0.98) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Route size={16} color="#10B981" />
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Route Planner
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleSwapRoute}
                    title="Swap Source and Destination"
                    style={{
                      padding: '5px 8px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ArrowUpDown size={12} /> Swap
                  </button>
                </div>
              </div>

              {/* Connected Source and Destination Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                {/* 1. SOURCE INPUT */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#34D399', display: 'flex', alignItems: 'center', gap: 5 }}>
                      🟢 START POINT (SOURCE):
                    </label>
                    <button
                      type="button"
                      onClick={() => setClickPickMode(clickPickMode === 'source' ? 'none' : 'source')}
                      style={{
                        padding: '2px 7px',
                        borderRadius: 5,
                        background: clickPickMode === 'source' ? '#10B981' : 'rgba(255,255,255,0.06)',
                        border: 'none',
                        color: clickPickMode === 'source' ? '#030604' : '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {clickPickMode === 'source' ? 'Clicking Map...' : '📌 Pick on Map'}
                    </button>
                  </div>

                  <select
                    value={sourceHubId}
                    onChange={e => {
                      setSourceHubId(e.target.value)
                      updateRoute(e.target.value, destHubId)
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {customGpsCoords && (
                      <option value="my-location" style={{ background: '#0a1d13', color: '#34D399' }}>
                        📍 My Live GPS Location ({customGpsCoords.lat.toFixed(3)}, {customGpsCoords.lng.toFixed(3)})
                      </option>
                    )}
                    {customSourceCoords && (
                      <option value="custom-pin-src" style={{ background: '#0a1d13', color: '#34D399' }}>
                        📌 Custom Map Pin ({customSourceCoords.lat.toFixed(3)}, {customSourceCoords.lng.toFixed(3)})
                      </option>
                    )}
                    {BENGALURU_HUBS.map(h => (
                      <option key={h.id} value={h.id} style={{ background: '#111814', color: '#FFFFFF' }}>
                        {h.name} ({h.zone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. DESTINATION INPUT */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#F87171', display: 'flex', alignItems: 'center', gap: 5 }}>
                      🔴 DESTINATION (WHERE TO GO):
                    </label>
                    <button
                      type="button"
                      onClick={() => setClickPickMode(clickPickMode === 'destination' ? 'none' : 'destination')}
                      style={{
                        padding: '2px 7px',
                        borderRadius: 5,
                        background: clickPickMode === 'destination' ? '#EF4444' : 'rgba(255,255,255,0.06)',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {clickPickMode === 'destination' ? 'Clicking Map...' : '📌 Pick on Map'}
                    </button>
                  </div>

                  <select
                    value={destHubId}
                    onChange={e => {
                      setDestHubId(e.target.value)
                      updateRoute(sourceHubId, e.target.value)
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {customDestCoords && (
                      <option value="custom-pin-dest" style={{ background: '#1d0c0c', color: '#F87171' }}>
                        📌 Custom Map Pin ({customDestCoords.lat.toFixed(3)}, {customDestCoords.lng.toFixed(3)})
                      </option>
                    )}
                    {EMERGENCY_SHELTERS.map(s => (
                      <option key={s.id} value={s.id} style={{ background: '#0a1d13', color: '#34D399' }}>
                        🛡️ Safe Shelter: {s.name} ({s.elevationMsl}m MSL)
                      </option>
                    ))}
                    {BENGALURU_HUBS.map(h => (
                      <option key={h.id} value={h.id} style={{ background: '#111814', color: '#FFFFFF' }}>
                        {h.name} ({h.zone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Destination Chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx-muted)', alignSelf: 'center' }}>Quick:</span>
                <button
                  type="button"
                  onClick={() => {
                    setDestHubId(routeResult.nearestShelter.id)
                    updateRoute(sourceHubId, routeResult.nearestShelter.id)
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10B981',
                    color: '#34D399',
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  🛡️ Nearest Shelter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDestHubId('airport-kia')
                    updateRoute(sourceHubId, 'airport-kia')
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✈️ Airport
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDestHubId('majestic-central')
                    updateRoute(sourceHubId, 'majestic-central')
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🚆 Majestic
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDestHubId('sh-vic-03')
                    updateRoute(sourceHubId, 'sh-vic-03')
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🏥 Hospital
                </button>
              </div>

              {/* Flood Hazard Alert Callout */}
              {routeResult.hasFloodHazard && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.14)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: 11, color: '#FFFFFF' }}>
                    <b style={{ color: '#EF4444' }}>{routeResult.blockedHazardName} is SUBMERGED</b> ({routeResult.hazardWaterDepth} water).
                    SafeGround has plotted a dry detour evading this choke point.
                  </div>
                </div>
              )}
            </div>

            {/* ─── ALTERNATIVE SAFE ROUTES SELECTOR ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Available Safe Route Options:
              </span>

              {routeResult.alternatives.map((alt, idx) => {
                const isSelected = alt.id === selectedAltId
                return (
                  <motion.div
                    key={alt.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      playClickSound()
                      updateRoute(sourceHubId, destHubId, alt.id)
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: isSelected ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: isSelected ? '#10B981' : 'rgba(255,255,255,0.1)',
                          color: isSelected ? '#030604' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 900,
                        }}>
                          {idx + 1}
                        </span>
                        <b style={{ color: isSelected ? '#34D399' : '#FFFFFF', fontSize: 12.5 }}>
                          {alt.title}
                        </b>
                      </div>
                      <span style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: `${alt.badgeColor}25`,
                        color: alt.badgeColor,
                        border: `1px solid ${alt.badgeColor}50`,
                      }}>
                        {alt.badge}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 11.5 }}>
                      <div style={{ color: '#FFFFFF', fontWeight: 800 }}>
                        {alt.distanceKm} km · <span style={{ color: '#34D399' }}>~{alt.estMinutes} mins</span>
                      </div>
                      <div style={{ color: 'var(--tx-muted)', fontSize: 10.5 }}>
                        Safety Score: <b style={{ color: '#10B981' }}>{alt.floodSafetyScore}%</b>
                      </div>
                    </div>

                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                      {alt.description}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* ─── NEAREST HIGH-GROUND SAFE SHELTER CARD ─── */}
            <div className="bento-card" style={{
              padding: '14px 16px',
              background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.10) 0%, rgba(9, 14, 11, 0.95) 100%)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={13} /> NEAREST SAFE HAVEN
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#38BDF8', padding: '1px 6px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)' }}>
                  +{routeResult.nearestShelter.elevationAdvantageM}m MSL HIGH GROUND
                </span>
              </div>

              <b style={{ color: '#FFFFFF', fontSize: 13, display: 'block' }}>
                {routeResult.nearestShelter.name}
              </b>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
                <span>Distance: <b>{routeResult.nearestShelter.distanceKm} km</b> (~{routeResult.nearestShelter.walkMinutes} min walk)</span>
                <span>Beds: <b style={{ color: '#10B981' }}>{routeResult.nearestShelter.availableBeds} ready</b></span>
              </div>

              <button
                type="button"
                onClick={() => handleRouteToShelter(routeResult.nearestShelter)}
                className="btn-shiny"
                style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: 11.5, marginTop: 10 }}
              >
                <Navigation size={12} /> Navigate to this Safe Haven
              </button>
            </div>

            {/* ─── TURN-BY-TURN INSTRUCTIONS ACCORDION ─── */}
            <div className="bento-card" style={{ padding: '12px 16px' }}>
              <div
                onClick={() => setShowInstructions(!showInstructions)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Compass size={14} color="#10B981" /> Turn-by-Turn Guidance ({routeResult.instructions.length} steps)
                </span>
                {showInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {showInstructions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                  {routeResult.instructions.map(inst => (
                    <div
                      key={inst.step}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: inst.isSafetyWarning ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: inst.isSafetyWarning ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: 11,
                        color: inst.isSafetyWarning ? '#FCA5A5' : 'rgba(255, 255, 255, 0.85)',
                      }}
                    >
                      <b style={{ color: inst.isSafetyWarning ? '#EF4444' : '#34D399', marginRight: 5 }}>Step {inst.step}:</b>
                      {inst.text} <span style={{ color: 'var(--tx-muted)', marginLeft: 4 }}>({inst.distance})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Interactive Real Black-Theme Map ─── */}
          <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 170px)', minHeight: '520px' }}>
            <RealBengaluruMap
              routeResult={routeResult}
              userLiveCoords={customGpsCoords}
              onSelectShelter={id => {
                const s = EMERGENCY_SHELTERS.find(x => x.id === id)
                if (s) handleRouteToShelter({
                  ...s,
                  distanceKm: 2.1,
                  walkMinutes: 25,
                  elevationAdvantageM: 20,
                })
              }}
              onMapClick={handleMapClick}
              focusCoords={focusCoords}
              height="100%"
              clickMode={clickPickMode}
            />
          </div>
        </div>
      )}
    </div>
  )
}
