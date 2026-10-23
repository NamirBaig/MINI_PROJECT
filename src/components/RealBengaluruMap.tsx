import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import {
  BENGALURU_HUBS,
  EMERGENCY_SHELTERS,
  FLOOD_CHOKE_POINTS,
  type SafeRouteResult,
} from '../services/safeRoutingService'
import { BENGALURU_LAKES } from '../data/bengaluru'
import { Navigation, Crosshair, Layers, Compass, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

export type BasemapTheme = 'stealth' | 'satellite' | 'cyber'

interface RealBengaluruMapProps {
  routeResult?: SafeRouteResult | null
  userLiveCoords?: { lat: number; lng: number; accuracy?: number } | null
  onSelectShelter?: (shelterId: string) => void
  onMapClick?: (coords: { lat: number; lng: number }) => void
  focusCoords?: { lat: number; lng: number; zoom?: number } | null
  height?: string
  clickMode?: 'source' | 'destination' | 'none'
}

export default function RealBengaluruMap({
  routeResult,
  userLiveCoords,
  onSelectShelter,
  onMapClick,
  focusCoords,
  height = '100%',
  clickMode = 'none',
}: RealBengaluruMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const tileLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const infrastructureLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const userLiveLayerGroupRef = useRef<L.LayerGroup | null>(null)

  const [activeTheme, setActiveTheme] = useState<BasemapTheme>('stealth')
  const [showShelters, setShowShelters] = useState(true)
  const [showChokePoints, setShowChokePoints] = useState(true)
  const [showLakes, setShowLakes] = useState(true)

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [
        [12.65, 77.20],
        [13.45, 77.95],
      ],
      minZoom: 10,
    })

    // Setup Layer Groups
    const tileGroup = L.layerGroup().addTo(map)
    const infraGroup = L.layerGroup().addTo(map)
    const routeGroup = L.layerGroup().addTo(map)
    const userGroup = L.layerGroup().addTo(map)

    tileLayerGroupRef.current = tileGroup
    infrastructureLayerGroupRef.current = infraGroup
    routeLayerGroupRef.current = routeGroup
    userLiveLayerGroupRef.current = userGroup
    mapInstanceRef.current = map

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
    })

    // Force map size refresh for responsive containers
    const timeout = setTimeout(() => {
      map.invalidateSize()
    }, 250)

    const handleResize = () => {
      map.invalidateSize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', handleResize)
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // 2. Basemap Tile Rendering (Switchable & Free - Zero API Keys, Zero Watermarks)
  useEffect(() => {
    const group = tileLayerGroupRef.current
    if (!group) return
    group.clearLayers()

    if (activeTheme === 'stealth') {
      // Esri World Dark Gray Base + Reference (High-contrast, genuine black GIS canvas)
      const baseLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, className: 'esri-dark-base' }
      )
      const refLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, className: 'esri-dark-ref' }
      )
      group.addLayer(baseLayer)
      group.addLayer(refLayer)
    } else if (activeTheme === 'satellite') {
      // Esri World Imagery (Night Satellite with road labels)
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, className: 'esri-satellite' }
      )
      const refLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, className: 'esri-dark-ref' }
      )
      group.addLayer(satLayer)
      group.addLayer(refLayer)
    } else {
      // Cyberpunk OpenStreetMap Dark
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
        className: 'dark-tiles',
      })
      group.addLayer(osmLayer)
    }
  }, [activeTheme])

  // 3. User Live Location Pin & Concentric Radar Waves
  useEffect(() => {
    const group = userLiveLayerGroupRef.current
    if (!group) return
    group.clearLayers()

    if (!userLiveCoords) return

    const { lat, lng, accuracy = 40 } = userLiveCoords

    // Accuracy Circle
    const accCircle = L.circle([lat, lng], {
      radius: Math.max(accuracy, 30),
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 0.12,
      weight: 1.5,
      dashArray: '4, 4',
    })
    group.addLayer(accCircle)

    // Pulsing Blue Radar Pin
    const radarIcon = L.divIcon({
      className: 'live-gps-radar-marker',
      html: `
        <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
          <!-- Animated Concentric Ping Ring -->
          <div class="radar-ping-ring" style="
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.45);
            border: 1.5px solid #60A5FA;
          "></div>
          <!-- Center Solid Beacon -->
          <div style="
            position: relative;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #3B82F6;
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 0 16px #3B82F6, 0 0 28px #2563EB;
          "></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })

    const marker = L.marker([lat, lng], { icon: radarIcon, zIndexOffset: 1000 })
    marker.bindPopup(`
      <div style="background:#091218; color:#fff; padding:10px 14px; border-radius:12px; font-family:sans-serif; border:1px solid #3B82F6; min-width:180px;">
        <div style="font-size:10px; font-weight:800; color:#60A5FA; text-transform:uppercase; letter-spacing:0.5px;">📍 Verified Live GPS Beacon</div>
        <b style="color:#ffffff; font-size:13px; display:block; margin:2px 0 4px;">You Are Here</b>
        <div style="font-size:11px; color:#aaa;">Coordinates: <b>${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</b></div>
        <div style="font-size:10px; color:#34D399; margin-top:3px;">GPS Precision: ±${Math.round(accuracy)}m</div>
      </div>
    `)
    group.addLayer(marker)
  }, [userLiveCoords])

  // 4. Infrastructure (Lakes, Shelters, Flood Choke Points)
  useEffect(() => {
    const group = infrastructureLayerGroupRef.current
    if (!group) return
    group.clearLayers()

    // Lakes
    if (showLakes) {
      const lakeCoordinates: Record<string, [number, number]> = {
        'Bellandur Lake': [12.9352, 77.6744],
        'Varthur Lake': [12.9550, 77.7250],
        'Hebbal Lake': [13.0450, 77.5900],
        'Ulsoor Lake': [12.9825, 77.6200],
        'Madiwala Lake': [12.9150, 77.6200],
        'Sankey Tank': [13.0080, 77.5720],
        'Agara Lake': [12.9230, 77.6430],
        'Yelahanka Amanikere': [13.1018, 77.5985],
      }

      BENGALURU_LAKES.forEach(lake => {
        const coords = lakeCoordinates[lake.name]
        if (!coords) return
        const isCritical = lake.status === 'Critical'
        const circle = L.circle(coords, {
          radius: 800,
          color: isCritical ? '#EF4444' : '#06B6D4',
          fillColor: isCritical ? '#EF4444' : '#06B6D4',
          fillOpacity: 0.25,
          weight: 1.5,
        })
        circle.bindPopup(`
          <div style="background:#0c1510; color:#fff; padding:10px; border-radius:10px; font-family:sans-serif; border:1px solid rgba(6,182,212,0.4);">
            <b style="color:#38BDF8; font-size:13px;">${lake.name}</b>
            <div style="font-size:11px; margin-top:4px; color:#ccc;">Area: ${lake.area} ha · Status: <b style="color:${isCritical ? '#EF4444' : '#10B981'}">${lake.status}</b></div>
            <div style="font-size:10px; color:#888; margin-top:2px;">Encroachment: ${lake.encroachment}%</div>
          </div>
        `)
        group.addLayer(circle)
      })
    }

    // Shelters
    if (showShelters) {
      EMERGENCY_SHELTERS.forEach(shelter => {
        const icon = L.divIcon({
          className: 'shelter-pin',
          html: `
            <div style="
              width: 32px; height: 32px; border-radius: 50%;
              background: linear-gradient(135deg, #10B981 0%, #065F46 100%);
              border: 2px solid #34D399;
              box-shadow: 0 0 15px rgba(16, 185, 129, 0.85);
              display: flex; align-items: center; justify-content: center;
              color: #030604; font-size: 15px; cursor: pointer;
            ">
              🛡️
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker([shelter.lat, shelter.lng], { icon })
        marker.bindPopup(`
          <div style="background:#0c1510; color:#fff; padding:12px; border-radius:12px; font-family:sans-serif; border:1px solid #10B981; min-width:180px;">
            <div style="font-size:10px; font-weight:800; color:#10B981; text-transform:uppercase;">Verified High-Ground Safe Haven</div>
            <b style="color:#ffffff; font-size:13px; display:block; margin:2px 0 6px;">${shelter.name}</b>
            <div style="font-size:11px; color:#34D399; margin-bottom:4px;">Elevation: <b>${shelter.elevationMsl}m MSL</b></div>
            <div style="font-size:11px; color:#aaa;">Capacity: <b>${shelter.shelterCapacity} citizens</b></div>
            <div style="font-size:11px; color:#aaa;">Emergency Beds: <b style="color:#38BDF8;">${shelter.availableBeds} Ready</b></div>
          </div>
        `)
        marker.on('click', () => {
          if (onSelectShelter) onSelectShelter(shelter.id)
        })
        group.addLayer(marker)
      })
    }

    // Choke Points
    if (showChokePoints) {
      FLOOD_CHOKE_POINTS.forEach(choke => {
        const icon = L.divIcon({
          className: 'choke-pin',
          html: `
            <div style="
              width: 30px; height: 30px; border-radius: 50%;
              background: rgba(239, 68, 68, 0.35);
              border: 2px solid #EF4444;
              box-shadow: 0 0 16px #EF4444;
              display: flex; align-items: center; justify-content: center;
              color: #FFFFFF; font-weight: 800; font-size: 13px;
              animation: liveRadarPing 2s infinite;
            ">
              ⚠️
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        })

        const marker = L.marker([choke.lat, choke.lng], { icon })
        marker.bindPopup(`
          <div style="background:#140808; color:#fff; padding:12px; border-radius:12px; font-family:sans-serif; border:1px solid #EF4444; min-width:190px;">
            <div style="font-size:10px; font-weight:800; color:#EF4444; text-transform:uppercase;">Submerged Road Hazard</div>
            <b style="color:#ffffff; font-size:13px; display:block; margin:2px 0 4px;">${choke.name}</b>
            <div style="font-size:12px; color:#FCA5A5; font-weight:700; margin-bottom:4px;">Water Depth: ${choke.waterDepth}</div>
            <div style="font-size:11px; color:#ccc;">${choke.description}</div>
          </div>
        `)
        group.addLayer(marker)
      })
    }
  }, [showLakes, showShelters, showChokePoints, onSelectShelter])

  // 5. Routes Rendering (Hazardous Red + Safe Green Detour + Alternate Blue Ridge)
  useEffect(() => {
    const map = mapInstanceRef.current
    const group = routeLayerGroupRef.current
    if (!map || !group) return
    group.clearLayers()

    if (!routeResult) return

    // A. Hazardous Blocked Path (Dashed Red Line)
    if (routeResult.hasFloodHazard && routeResult.hazardousPath) {
      const redLine = L.polyline(routeResult.hazardousPath, {
        color: '#EF4444',
        weight: 4.5,
        dashArray: '8, 8',
        opacity: 0.9,
      })
      redLine.bindPopup(`
        <div style="background:#140808; color:#fff; padding:10px; border-radius:8px; border:1px solid #EF4444;">
          <b style="color:#EF4444;">⚠️ Blocked / Inundated Corridor</b>
          <div style="font-size:11px; color:#ddd; margin-top:2px;">
            Crosses ${routeResult.blockedHazardName} (${routeResult.hazardWaterDepth} water). Divert via safe detour.
          </div>
        </div>
      `)
      group.addLayer(redLine)
    }

    // B. Safe Detour Polyline (Glowing Neon Emerald Line)
    const greenLine = L.polyline(routeResult.safePath, {
      color: '#10B981',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    })
    greenLine.bindPopup(`
      <div style="background:#0c1510; color:#fff; padding:10px; border-radius:8px; border:1px solid #10B981;">
        <b style="color:#34D399;">🛡️ Verified Safe High-Ground Route</b>
        <div style="font-size:11px; color:#ddd; margin-top:2px;">
          Distance: ${routeResult.safeDistanceKm} km · Est. Time: ${routeResult.safeEstMinutes} mins
        </div>
        <div style="font-size:10px; color:#10B981; font-weight:700; margin-top:3px;">
          Zero active flood hazards detected.
        </div>
      </div>
    `)
    group.addLayer(greenLine)

    // C. Source (A) & Destination (B) Markers
    const sourceIcon = L.divIcon({
      className: 'route-source-pin',
      html: `
        <div style="
          padding: 5px 10px; border-radius: 8px;
          background: #10B981; color: #030604; font-weight: 900; font-size: 11px;
          border: 1.5px solid #34D399; box-shadow: 0 0 16px rgba(16, 185, 129, 0.9);
          white-space: nowrap; transform: translate(-50%, -100%);
        ">
          🟢 A: ${routeResult.source.name}
        </div>
      `,
      iconSize: [0, 0],
    })

    const destIcon = L.divIcon({
      className: 'route-dest-pin',
      html: `
        <div style="
          padding: 5px 10px; border-radius: 8px;
          background: #EF4444; color: #FFFFFF; font-weight: 900; font-size: 11px;
          border: 1.5px solid #F87171; box-shadow: 0 0 16px rgba(239, 68, 68, 0.9);
          white-space: nowrap; transform: translate(-50%, -100%);
        ">
          🔴 B: ${routeResult.destination.name}
        </div>
      `,
      iconSize: [0, 0],
    })

    group.addLayer(L.marker([routeResult.source.lat, routeResult.source.lng], { icon: sourceIcon }))
    group.addLayer(L.marker([routeResult.destination.lat, routeResult.destination.lng], { icon: destIcon }))

    // Smoothly fit bounds
    try {
      const bounds = greenLine.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
      }
    } catch {
      // Fallback
    }
  }, [routeResult])

  // 6. Camera Pan/Fly to Focus
  useEffect(() => {
    if (!focusCoords || !mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([focusCoords.lat, focusCoords.lng], focusCoords.zoom || 14, {
      duration: 1.2,
    })
  }, [focusCoords])

  // Control handlers
  const handleLocateMe = () => {
    if (!mapInstanceRef.current) return
    if (userLiveCoords) {
      mapInstanceRef.current.flyTo([userLiveCoords.lat, userLiveCoords.lng], 15, { duration: 1.2 })
    } else {
      // Default to central Bengaluru
      mapInstanceRef.current.flyTo([12.9716, 77.5946], 12, { duration: 1.2 })
    }
  }

  const handleResetCamera = () => {
    if (!mapInstanceRef.current) return
    if (routeResult) {
      const line = L.polyline(routeResult.safePath)
      const b = line.getBounds()
      if (b.isValid()) {
        mapInstanceRef.current.fitBounds(b, { padding: [60, 60] })
        return
      }
    }
    mapInstanceRef.current.flyTo([12.9716, 77.5946], 11, { duration: 1.0 })
  }

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn()
  }

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut()
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height,
      minHeight: '480px',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      boxShadow: '0 16px 40px rgba(0,0,0,0.85)',
      background: '#060908',
    }}>
      {/* Real Leaflet Map Mount Point */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: clickMode !== 'none' ? 'crosshair' : 'grab',
        }}
      />

      {/* Click Pin Drop Indicator */}
      {clickMode !== 'none' && (
        <div style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 800,
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#030604',
          padding: '8px 16px',
          borderRadius: 30,
          fontSize: 12,
          fontWeight: 800,
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          animation: 'pulse 1.5s infinite',
        }}>
          <Crosshair size={14} /> Click anywhere on map to set {clickMode.toUpperCase()}
        </div>
      )}

      {/* Floating On-Map Action Dock (Top Right) */}
      <div style={{
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 600,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          title="Fly to My Live GPS Location"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: userLiveCoords ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' : 'rgba(9, 14, 11, 0.88)',
            border: userLiveCoords ? '1px solid #60A5FA' : '1px solid rgba(255,255,255,0.15)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: userLiveCoords ? '0 0 14px rgba(59,130,246,0.6)' : '0 4px 14px rgba(0,0,0,0.5)',
            transition: 'all 0.2s',
          }}
        >
          <Crosshair size={18} />
        </button>

        {/* Fit Bounds / Recenter Route */}
        <button
          type="button"
          onClick={handleResetCamera}
          title="Fit Route to View"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(9, 14, 11, 0.88)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
        >
          <RotateCcw size={16} />
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(9, 14, 11, 0.88)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
        >
          <ZoomIn size={16} />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(9, 14, 11, 0.88)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
        >
          <ZoomOut size={16} />
        </button>

        {/* Theme Switcher Toggle */}
        <div style={{
          background: 'rgba(9, 14, 11, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 10,
          padding: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          <button
            type="button"
            onClick={() => setActiveTheme('stealth')}
            title="Stealth Black GIS Canvas"
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: activeTheme === 'stealth' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
              border: activeTheme === 'stealth' ? '1px solid #10B981' : 'none',
              color: activeTheme === 'stealth' ? '#34D399' : '#AAAAAA',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🕶️ Stealth
          </button>
          <button
            type="button"
            onClick={() => setActiveTheme('satellite')}
            title="Night Satellite Imagery"
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: activeTheme === 'satellite' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              border: activeTheme === 'satellite' ? '1px solid #3B82F6' : 'none',
              color: activeTheme === 'satellite' ? '#60A5FA' : '#AAAAAA',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🛰️ Satellite
          </button>
          <button
            type="button"
            onClick={() => setActiveTheme('cyber')}
            title="OpenStreetMap Dark"
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: activeTheme === 'cyber' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
              border: activeTheme === 'cyber' ? '1px solid #EF4444' : 'none',
              color: activeTheme === 'cyber' ? '#F87171' : '#AAAAAA',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🗺️ Cyber
          </button>
        </div>
      </div>

      {/* Floating Map Legend (Top Left) */}
      <div style={{
        position: 'absolute',
        top: 14,
        left: 14,
        zIndex: 500,
        background: 'rgba(6, 11, 8, 0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 12,
        padding: '10px 14px',
        fontSize: 11,
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
        maxWidth: 240,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 }}>
          <b style={{ color: '#34D399', fontSize: 11, letterSpacing: 0.5 }}>BENGALURU GIS GRID</b>
          <span style={{ fontSize: 10, color: 'var(--tx-muted)' }}>{activeTheme.toUpperCase()}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 4, borderRadius: 2, background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            <span style={{ fontSize: 11, color: '#FFFFFF' }}>Safe Corridor</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 3, background: '#EF4444', borderTop: '1px dashed #EF4444' }} />
            <span style={{ fontSize: 11, color: '#FCA5A5' }}>Flooded Choke</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13 }}>🛡️</span>
            <span style={{ fontSize: 11, color: '#34D399' }}>High Shelter</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
            <span style={{ fontSize: 11, color: '#60A5FA' }}>Your GPS</span>
          </div>
        </div>

        {/* Layer Toggles */}
        <div style={{ display: 'flex', gap: 6, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={() => setShowChokePoints(!showChokePoints)}
            style={{
              padding: '3px 6px',
              borderRadius: 6,
              fontSize: 10,
              background: showChokePoints ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
              border: showChokePoints ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
              color: showChokePoints ? '#F87171' : '#777',
              cursor: 'pointer',
            }}
          >
            ⚠️ Chokes
          </button>
          <button
            type="button"
            onClick={() => setShowShelters(!showShelters)}
            style={{
              padding: '3px 6px',
              borderRadius: 6,
              fontSize: 10,
              background: showShelters ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
              border: showShelters ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
              color: showShelters ? '#34D399' : '#777',
              cursor: 'pointer',
            }}
          >
            🛡️ Shelters
          </button>
          <button
            type="button"
            onClick={() => setShowLakes(!showLakes)}
            style={{
              padding: '3px 6px',
              borderRadius: 6,
              fontSize: 10,
              background: showLakes ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)',
              border: showLakes ? '1px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
              color: showLakes ? '#38BDF8' : '#777',
              cursor: 'pointer',
            }}
          >
            💧 Lakes
          </button>
        </div>
      </div>
    </div>
  )
}

