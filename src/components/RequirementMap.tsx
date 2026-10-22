import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Navigation, Compass, AlertCircle, Building2, LifeBuoy,
  Droplets, Package, ShieldCheck, ChevronRight, CheckCircle2,
  Filter, Search, ZoomIn, ZoomOut, RotateCcw, AlertTriangle,
  Clock, PhoneCall, ArrowRight, Sparkles, User, Crosshair
} from 'lucide-react'
import {
  getAllRequests,
  subscribeToRequests,
  type EmergencyRequest,
  approveEmergencyRequest,
  denyEmergencyRequest
} from '../services/requestService'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'

// Bengaluru Zone Coordinates for Geolocation Matching and Map Positioning
interface ZoneGeo {
  id: string
  name: string
  ward: string
  lat: number
  lng: number
  mapX: number
  mapY: number
  path: string
  labelX: number
  labelY: number
  baselineBeds: number
  baselineBoats: number
  baselineWaterL: number
  baselineRations: number
}

const BENGALURU_ZONES_GEO: ZoneGeo[] = [
  {
    id: 'yelahanka',
    name: 'Yelahanka',
    ward: 'Yelahanka & Vidyaranyapura',
    lat: 13.1007,
    lng: 77.5963,
    mapX: 450,
    mapY: 100,
    path: 'M 320 40 L 580 40 L 640 140 L 550 200 L 380 190 L 290 120 Z',
    labelX: 450,
    labelY: 90,
    baselineBeds: 8,
    baselineBoats: 4,
    baselineWaterL: 12000,
    baselineRations: 650,
  },
  {
    id: 'whitefield',
    name: 'Whitefield / Mahadevapura',
    ward: 'Mahadevapura & KR Puram',
    lat: 12.9698,
    lng: 77.7500,
    mapX: 720,
    mapY: 280,
    path: 'M 550 200 L 640 140 L 840 220 L 860 380 L 680 420 L 580 320 L 560 230 Z',
    labelX: 710,
    labelY: 270,
    baselineBeds: 12,
    baselineBoats: 6,
    baselineWaterL: 18000,
    baselineRations: 920,
  },
  {
    id: 'indiranagar',
    name: 'East Zone (Indiranagar / Ulsoor)',
    ward: 'Shivajinagar & Indiranagar',
    lat: 12.9784,
    lng: 77.6408,
    mapX: 470,
    mapY: 270,
    path: 'M 380 190 L 550 200 L 580 320 L 460 340 L 390 270 Z',
    labelX: 470,
    labelY: 265,
    baselineBeds: 4,
    baselineBoats: 1,
    baselineWaterL: 5000,
    baselineRations: 250,
  },
  {
    id: 'rajajinagar',
    name: 'West Zone (Rajajinagar / Malleshwaram)',
    ward: 'Rajajinagar & Malleshwaram',
    lat: 12.9982,
    lng: 77.5530,
    mapX: 280,
    mapY: 220,
    path: 'M 180 140 L 290 120 L 380 190 L 390 270 L 300 340 L 190 280 Z',
    labelX: 280,
    labelY: 215,
    baselineBeds: 3,
    baselineBoats: 0,
    baselineWaterL: 3500,
    baselineRations: 180,
  },
  {
    id: 'koramangala',
    name: 'Koramangala / BTM',
    ward: 'BTM Layout & Koramangala',
    lat: 12.9352,
    lng: 77.6245,
    mapX: 470,
    mapY: 370,
    path: 'M 390 270 L 460 340 L 580 320 L 590 410 L 450 430 L 380 360 Z',
    labelX: 470,
    labelY: 360,
    baselineBeds: 7,
    baselineBoats: 3,
    baselineWaterL: 8000,
    baselineRations: 420,
  },
  {
    id: 'hsr-layout',
    name: 'HSR Layout & Bommanahalli',
    ward: 'Bommanahalli & HSR',
    lat: 12.9116,
    lng: 77.6474,
    mapX: 560,
    mapY: 480,
    path: 'M 450 430 L 590 410 L 680 420 L 670 540 L 520 560 L 440 490 Z',
    labelX: 560,
    labelY: 490,
    baselineBeds: 9,
    baselineBoats: 4,
    baselineWaterL: 14000,
    baselineRations: 710,
  },
  {
    id: 'banashankari',
    name: 'South Zone (Banashankari / Jayanagar)',
    ward: 'Jayanagar & Padmanabhanagar',
    lat: 12.9255,
    lng: 77.5468,
    mapX: 230,
    mapY: 420,
    path: 'M 190 280 L 300 340 L 330 380 L 310 440 L 350 520 L 260 590 L 140 460 L 150 350 Z',
    labelX: 230,
    labelY: 410,
    baselineBeds: 5,
    baselineBoats: 1,
    baselineWaterL: 6000,
    baselineRations: 300,
  },
]

// Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

interface UserLocation {
  lat: number
  lng: number
  nearestZoneId: string
  distanceKm: number
  accuracy: number
  source: 'gps' | 'manual'
}

export default function RequirementMap() {
  const { user, currentRole } = useAuth()
  const toast = useToast()

  const [requests, setRequests] = useState<EmergencyRequest[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<string>('yelahanka')
  const [resourceFilter, setResourceFilter] = useState<'ALL' | 'BEDS' | 'BOATS' | 'WATER' | 'RATIONS'>('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'CRITICAL' | 'PENDING'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [zoomLevel, setZoomLevel] = useState(1)

  // Geolocation state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Load and subscribe to requests
  useEffect(() => {
    setRequests(getAllRequests())
    const unsubscribe = subscribeToRequests(() => {
      setRequests(getAllRequests())
    })
    return () => unsubscribe()
  }, [])

  // Geolocation detection handler
  const handleDetectLocation = () => {
    playClickSound()
    setIsLocating(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      setIsLocating(false)
      toast.alert('Geolocation Unsupported', 'Please select your Bengaluru zone manually.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords

        // Find nearest zone
        let nearestZone = BENGALURU_ZONES_GEO[0]
        let minDistance = calculateDistance(latitude, longitude, nearestZone.lat, nearestZone.lng)

        for (const zone of BENGALURU_ZONES_GEO) {
          const dist = calculateDistance(latitude, longitude, zone.lat, zone.lng)
          if (dist < minDistance) {
            minDistance = dist
            nearestZone = zone
          }
        }

        const loc: UserLocation = {
          lat: latitude,
          lng: longitude,
          nearestZoneId: nearestZone.id,
          distanceKm: Number(minDistance.toFixed(1)),
          accuracy: Math.round(accuracy),
          source: 'gps',
        }

        setUserLocation(loc)
        setSelectedZoneId(nearestZone.id)
        setIsLocating(false)
        playSuccessSound()
        toast.success(
          'Location Identified',
          `Nearest Zone: ${nearestZone.name} (${loc.distanceKm} km away)`
        )
      },
      (err) => {
        setIsLocating(false)
        console.warn('Geolocation error:', err.message)
        // Fallback to Bengaluru City Center (Cubbon Park / Vidhana Soudha)
        const fallbackLat = 12.9716
        const fallbackLng = 77.5946
        const defaultZone = BENGALURU_ZONES_GEO[2] // Indiranagar/East
        const dist = calculateDistance(fallbackLat, fallbackLng, defaultZone.lat, defaultZone.lng)

        setUserLocation({
          lat: fallbackLat,
          lng: fallbackLng,
          nearestZoneId: defaultZone.id,
          distanceKm: Number(dist.toFixed(1)),
          accuracy: 500,
          source: 'manual',
        })
        setSelectedZoneId(defaultZone.id)
        toast.info('Defaulted to Bengaluru Center', 'Showing Central BBMP Command Sector.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Calculate requirements per zone
  const zoneStats = BENGALURU_ZONES_GEO.map((zone) => {
    // Filter matching requests
    const zoneReqs = requests.filter((r) => {
      const zName = r.zone.toLowerCase()
      const targetId = zone.id.toLowerCase()
      const targetName = zone.name.toLowerCase()
      return zName.includes(targetId) || targetName.includes(zName) || zName.includes(targetName)
    })

    const pendingReqs = zoneReqs.filter((r) => r.status === 'PENDING')
    const criticalReqs = zoneReqs.filter((r) => r.urgency === 'CRITICAL' && r.status === 'PENDING')

    // Sum demands from live requests + baseline estimated municipal requirement
    let requestedBeds = zone.baselineBeds
    let requestedBoats = zone.baselineBoats
    let requestedWaterL = zone.baselineWaterL
    let requestedRations = zone.baselineRations

    zoneReqs.forEach((r) => {
      const res = r.resourceType.toLowerCase()
      if (res.includes('bed')) requestedBeds += r.quantity
      else if (res.includes('boat')) requestedBoats += r.quantity
      else if (res.includes('water')) requestedWaterL += r.quantity * 500
      else if (res.includes('ration') || res.includes('food')) requestedRations += r.quantity * 10
    })

    const totalPriorityScore = criticalReqs.length * 3 + pendingReqs.length * 1.5 + (requestedBeds > 10 ? 4 : 1)
    const demandLevel = totalPriorityScore >= 8 ? 'CRITICAL' : totalPriorityScore >= 4 ? 'HIGH' : 'MODERATE'

    return {
      ...zone,
      requests: zoneReqs,
      pendingCount: pendingReqs.length,
      criticalCount: criticalReqs.length,
      requestedBeds,
      requestedBoats,
      requestedWaterL,
      requestedRations,
      demandLevel,
      priorityScore: totalPriorityScore,
    }
  })

  // Selected Zone Data
  const selectedZoneData = zoneStats.find((z) => z.id === selectedZoneId) || zoneStats[0]

  // Filter requests for selected zone list
  const visibleRequests = selectedZoneData.requests.filter((r) => {
    if (urgencyFilter === 'CRITICAL' && r.urgency !== 'CRITICAL') return false
    if (urgencyFilter === 'PENDING' && r.status !== 'PENDING') return false
    if (resourceFilter === 'BEDS' && !r.resourceType.toLowerCase().includes('bed')) return false
    if (resourceFilter === 'BOATS' && !r.resourceType.toLowerCase().includes('boat')) return false
    if (resourceFilter === 'WATER' && !r.resourceType.toLowerCase().includes('water')) return false
    if (resourceFilter === 'RATIONS' && !r.resourceType.toLowerCase().includes('ration')) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        r.requesterName.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.resourceType.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Authority Rapid Actions for this zone
  const handleApproveRequest = (id: string, hospital = 'Yelahanka General Hospital') => {
    playSuccessSound()
    approveEmergencyRequest(
      id,
      user?.user_metadata?.full_name || 'BBMP Authority Lead',
      hospital,
      'Rapid approved via Geospatial Requirement Radar.'
    )
    toast.success('Request Approved', `Allocated to ${hospital}`)
  }

  const handleDenyRequest = (id: string) => {
    playAlertSound()
    denyEmergencyRequest(
      id,
      user?.user_metadata?.full_name || 'BBMP Authority Lead',
      'Redirected to local ward relief depot'
    )
    toast.alert('Request Denied', 'Citizen notified with alternative relief station.')
  }

  // Convert GPS to SVG coordinates roughly for Bengaluru
  // Bengaluru bounding box approx: Lat 12.83 to 13.15 (delta 0.32), Lng 77.45 to 77.80 (delta 0.35)
  const getUserPinCoords = () => {
    if (!userLocation) return null
    const minLat = 12.83
    const maxLat = 13.15
    const minLng = 77.45
    const maxLng = 77.80

    // Y is inverted in SVG (North = top = small Y)
    const normX = (userLocation.lng - minLng) / (maxLng - minLng)
    const normY = 1 - (userLocation.lat - minLat) / (maxLat - minLat)

    const svgX = Math.max(100, Math.min(800, normX * 800 + 50))
    const svgY = Math.max(80, Math.min(560, normY * 540 + 50))

    return { x: svgX, y: svgY }
  }

  const userPin = getUserPinCoords()

  // Totals citywide
  const totalBedsNeeded = zoneStats.reduce((sum, z) => sum + z.requestedBeds, 0)
  const totalBoatsNeeded = zoneStats.reduce((sum, z) => sum + z.requestedBoats, 0)
  const totalWaterNeeded = zoneStats.reduce((sum, z) => sum + z.requestedWaterL, 0)
  const totalPendingReqs = zoneStats.reduce((sum, z) => sum + z.pendingCount, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ─── Top Control Header & Location Detector ───────────────────────── */}
      <div className="bento-card" style={{
        background: 'linear-gradient(135deg, rgba(12, 24, 18, 0.95) 0%, rgba(6, 14, 10, 0.98) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span className="status-pill" style={{ background: 'rgba(16,185,129,0.15)', borderColor: '#10B981', color: '#34D399' }}>
                <Crosshair size={13} />
                <span>GEOSPATIAL REQUIREMENT RADAR</span>
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'rgba(239,68,68,0.15)',
                color: '#F87171',
                border: '1px solid rgba(239,68,68,0.35)',
              }}>
                🚨 {totalPendingReqs} Live Citizen Requests Pending Triage
              </span>
            </div>

            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
              Bengaluru Ward-by-Ward Resource Demand Map
            </h2>
            <p style={{ color: 'var(--tx-muted)', fontSize: 13.5, margin: 0, maxWidth: 740 }}>
              Authorities can pinpoint exact resource deficits (ICU beds, rescue boats, potable water tankers) by BBMP administrative sector. Live telemetry links citizen distress calls to nearest municipal depots.
            </p>
          </div>

          {/* 📍 GEOLOCATION DETECT BUTTON */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="btn-shiny"
              style={{
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Navigation size={15} className={isLocating ? 'animate-spin' : ''} />
              {isLocating ? 'Detecting GPS Coordinates...' : 'Detect My Ward Location'}
            </motion.button>

            {userLocation && (
              <div style={{
                fontSize: 11.5,
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(16,185,129,0.1)',
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
                <MapPin size={12} />
                <span>
                  {userLocation.source === 'gps' ? 'Live GPS Active' : 'Bengaluru Centre'}: {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E ({userLocation.distanceKm} km to {selectedZoneData.name})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Citywide Demand Ticker Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', padding: '10px 14px', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#F87171', fontWeight: 700, textTransform: 'uppercase' }}>ICU & Hospital Beds Needed</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>{totalBedsNeeded} Beds</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}>Across 7 BBMP Hubs</div>
          </div>

          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', padding: '10px 14px', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#60A5FA', fontWeight: 700, textTransform: 'uppercase' }}>Rescue Boats Required</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>{totalBoatsNeeded} Crafts</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}>Yelahanka & Bellandur focus</div>
          </div>

          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', padding: '10px 14px', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#34D399', fontWeight: 700, textTransform: 'uppercase' }}>Clean Drinking Water</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>{(totalWaterNeeded / 1000).toFixed(0)}k Litres</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}>BWSSB Emergency Tankers</div>
          </div>

          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', padding: '10px 14px', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase' }}>Dry Ration Kits</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>3,430 Kits</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}>Ready for immediate airdrop</div>
          </div>
        </div>
      </div>

      {/* ─── Interactive Requirement Map & Zone Inspector Grid ────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.35fr) minmax(340px, 1fr)',
        gap: 20,
      }}>
        {/* LEFT: SVG Geospatial Requirement Map */}
        <div className="bento-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>BBMP SECTOR DEMAND HEATMAP</span>
              <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Click any sector to inspect citizen requirements</span>
            </div>

            {/* Map Zoom Controls */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => { playClickSound(); setZoomLevel(Math.min(1.3, zoomLevel + 0.1)); }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={() => { playClickSound(); setZoomLevel(Math.max(0.85, zoomLevel - 0.1)); }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
              >
                <ZoomOut size={13} />
              </button>
              <button
                onClick={() => { playClickSound(); setZoomLevel(1); }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#FFFFFF', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* SVG Map Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            background: 'radial-gradient(circle at 450px 320px, #08150F 0%, #030705 100%)',
            borderRadius: 14,
            border: '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.85)',
            overflow: 'hidden',
          }}>
            <svg
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
                <pattern id="reqMapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.035)" strokeWidth="0.8" />
                </pattern>

                <filter id="reqGlowCritical" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="reqGlowSelected" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="900" height="640" fill="url(#reqMapGrid)" />

              {/* Concentric City Distance Rings */}
              <circle cx="450" cy="320" r="110" fill="none" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="1" strokeDasharray="4,4" />
              <circle cx="450" cy="320" r="210" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="6,4" />
              <circle cx="450" cy="320" r="300" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="1" strokeDasharray="8,6" />

              {/* BBMP Zone Geometries Color-Coded by Requirement Urgency */}
              {zoneStats.map((z) => {
                const isSelected = z.id === selectedZoneId
                const isCritical = z.demandLevel === 'CRITICAL'
                const isHigh = z.demandLevel === 'HIGH'

                const fillColor = isCritical ? '#EF4444' : isHigh ? '#F59E0B' : '#10B981'

                return (
                  <g
                    key={z.id}
                    onClick={() => {
                      playClickSound()
                      setSelectedZoneId(z.id)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Zone Boundary */}
                    <path
                      d={z.path}
                      fill={fillColor}
                      fillOpacity={isSelected ? 0.35 : isCritical ? 0.22 : 0.12}
                      stroke={isSelected ? '#34D399' : isCritical ? '#EF4444' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={isSelected ? 3.5 : isCritical ? 2 : 1.2}
                      filter={isSelected ? 'url(#reqGlowSelected)' : isCritical ? 'url(#reqGlowCritical)' : 'none'}
                      style={{ transition: 'all 0.25s ease' }}
                    />

                    {/* Zone Info Capsule & Requirement Badges */}
                    <g pointerEvents="none">
                      <rect
                        x={z.labelX - 60}
                        y={z.labelY - 18}
                        width="120"
                        height="40"
                        rx="8"
                        fill="rgba(4, 9, 6, 0.92)"
                        stroke={isSelected ? '#34D399' : isCritical ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.15)'}
                        strokeWidth={isSelected ? 1.5 : 1}
                      />
                      <text
                        x={z.labelX}
                        y={z.labelY - 2}
                        fill="#FFFFFF"
                        fontSize="11"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        {z.name.toUpperCase()}
                      </text>
                      <text
                        x={z.labelX}
                        y={z.labelY + 14}
                        fill={isCritical ? '#F87171' : isHigh ? '#FBBF24' : '#34D399'}
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        🛏️ {z.requestedBeds} Beds • 🚤 {z.requestedBoats} Boats
                      </text>
                    </g>
                  </g>
                )
              })}

              {/* User Detected Pin (if Geolocation enabled) */}
              {userPin && (
                <g pointerEvents="none">
                  {/* Expanding Radar Ping Wave */}
                  <circle cx={userPin.x} cy={userPin.y} r="24" fill="none" stroke="#06B6D4" strokeWidth="2" opacity="0.6">
                    <animate attributeName="r" values="8;36" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={userPin.x} cy={userPin.y} r="7" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="2" />
                  {/* Pin Flag */}
                  <rect x={userPin.x - 45} y={userPin.y - 34} width="90" height="22" rx="6" fill="#06B6D4" />
                  <text x={userPin.x} y={userPin.y - 19} fill="#030604" fontSize="10" fontWeight="900" textAnchor="middle">
                    📍 YOU ARE HERE
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Map Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: 11.5, color: 'var(--tx-muted)' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                Critical Requirement (&gt;10 Beds/Boats)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                High Demand (5-10 Beds/Boats)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                Low / Stable Demand
              </span>
            </div>
            {userLocation && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#06B6D4', fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06B6D4', display: 'inline-block' }} />
                GPS User Position Pin Active
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: Detailed Sector Requirements Inspector & Dispatch Triage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sector Card */}
          <div className="bento-card" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 14, 10, 0.95) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 12,
                  background: selectedZoneData.demandLevel === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                  color: selectedZoneData.demandLevel === 'CRITICAL' ? '#F87171' : '#FBBF24',
                  border: `1px solid ${selectedZoneData.demandLevel === 'CRITICAL' ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
                  textTransform: 'uppercase',
                }}>
                  {selectedZoneData.demandLevel} SECTOR REQUIREMENT
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', margin: '6px 0 2px' }}>
                  {selectedZoneData.name}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
                  {selectedZoneData.ward}
                  {userLocation && userLocation.nearestZoneId === selectedZoneData.id && (
                    <b style={{ color: '#06B6D4', marginLeft: 6 }}>• Nearest to your location ({userLocation.distanceKm} km)</b>
                  )}
                </div>
              </div>

              {/* Selector dropdown for other zones */}
              <select
                value={selectedZoneId}
                onChange={(e) => {
                  playClickSound()
                  setSelectedZoneId(e.target.value)
                }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border-glass)',
                  color: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {BENGALURU_ZONES_GEO.map((z) => (
                  <option key={z.id} value={z.id} style={{ background: '#0B1711', color: '#FFFFFF' }}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Breakdown Grid for Selected Zone */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              margin: '14px 0',
            }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#F87171', fontWeight: 700 }}>
                  <Building2 size={13} /> ICU & General Beds
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                  {selectedZoneData.requestedBeds} <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>needed</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#60A5FA', fontWeight: 700 }}>
                  <LifeBuoy size={13} /> Rescue Boats
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                  {selectedZoneData.requestedBoats} <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>crafts</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#34D399', fontWeight: 700 }}>
                  <Droplets size={13} /> Potable Water
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                  {(selectedZoneData.requestedWaterL / 1000).toFixed(0)}k <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>Litres</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#FBBF24', fontWeight: 700 }}>
                  <Package size={13} /> Food Rations
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                  {selectedZoneData.requestedRations} <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>kits</span>
                </div>
              </div>
            </div>

            {/* Quick Authority Action Bar */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playSuccessSound()
                  toast.success('Municipal Allocation Alert Sent', `Directed 500 GPM pump & 2 NDRF boats to ${selectedZoneData.name}`)
                }}
                className="btn-shiny"
                style={{ flex: 1, padding: '9px 12px', fontSize: 12, justifyContent: 'center' }}
              >
                Dispatch Relief to {selectedZoneData.name}
              </motion.button>
            </div>
          </div>

          {/* Citizen Emergency Demands in this specific area */}
          <div className="bento-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
                  Citizen Distress Calls in {selectedZoneData.name} ({visibleRequests.length})
                </h4>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>
                  Filtered requests from local residents
                </div>
              </div>

              {/* Resource Filter */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setResourceFilter('ALL')}
                  style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    background: resourceFilter === 'ALL' ? 'var(--pri)' : 'rgba(255,255,255,0.05)',
                    color: resourceFilter === 'ALL' ? '#030604' : '#FFFFFF', fontWeight: 700, border: 'none'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setResourceFilter('BEDS')}
                  style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    background: resourceFilter === 'BEDS' ? '#EF4444' : 'rgba(255,255,255,0.05)',
                    color: '#FFFFFF', fontWeight: 700, border: 'none'
                  }}
                >
                  🛏️ Beds
                </button>
                <button
                  onClick={() => setResourceFilter('BOATS')}
                  style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    background: resourceFilter === 'BOATS' ? '#3B82F6' : 'rgba(255,255,255,0.05)',
                    color: '#FFFFFF', fontWeight: 700, border: 'none'
                  }}
                >
                  🚤 Boats
                </button>
              </div>
            </div>

            {/* Requests List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
              {visibleRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--tx-muted)', fontSize: 13 }}>
                  No pending distress requests in {selectedZoneData.name} matching this filter.
                </div>
              ) : (
                visibleRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${req.urgency === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>{req.requesterName}</div>
                        <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{req.address}</div>
                      </div>

                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 6,
                        background: req.status === 'APPROVED' ? 'rgba(16,185,129,0.2)' : req.status === 'DENIED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: req.status === 'APPROVED' ? '#34D399' : req.status === 'DENIED' ? '#F87171' : '#FBBF24',
                      }}>
                        {req.status}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 700, color: req.resourceType.includes('Bed') ? '#F87171' : '#60A5FA' }}>
                      Requested: {req.quantity}x {req.resourceType}
                    </div>

                    {req.patientNotes && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: 6 }}>
                        "{req.patientNotes}"
                      </div>
                    )}

                    {/* Authority Action Buttons */}
                    {req.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: '#10B981',
                            color: '#030604',
                            fontWeight: 800,
                            fontSize: 11,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Approve Allocation
                        </button>
                        <button
                          onClick={() => handleDenyRequest(req.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: 'rgba(239,68,68,0.2)',
                            color: '#F87171',
                            fontWeight: 700,
                            fontSize: 11,
                            border: '1px solid rgba(239,68,68,0.3)',
                            cursor: 'pointer',
                          }}
                        >
                          Deny
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
