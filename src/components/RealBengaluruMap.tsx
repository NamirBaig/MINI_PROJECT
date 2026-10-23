import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import {
  BENGALURU_HUBS,
  EMERGENCY_SHELTERS,
  FLOOD_CHOKE_POINTS,
  type SafeRouteResult,
} from '../services/safeRoutingService'
import { BENGALURU_LAKES } from '../data/bengaluru'

interface RealBengaluruMapProps {
  routeResult?: SafeRouteResult | null
  userLiveCoords?: { lat: number; lng: number } | null
  onSelectShelter?: (shelterId: string) => void
  focusCoords?: { lat: number; lng: number; zoom?: number } | null
  height?: string
}

export default function RealBengaluruMap({
  routeResult,
  userLiveCoords,
  onSelectShelter,
  focusCoords,
  height = '580px',
}: RealBengaluruMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // 1. Initialize Leaflet Map centered on Bengaluru
    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [
        [12.75, 77.35],
        [13.35, 77.85],
      ],
      minZoom: 10,
    })

    // 2. Add Luxury Black-Theme CartoDB Dark Matter Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    // Add minimal zoom controls in top-right
    L.control.zoom({ position: 'topright' }).addTo(map)

    // Layer groups for dynamic elements
    const markersGroup = L.layerGroup().addTo(map)
    const routeGroup = L.layerGroup().addTo(map)
    markersLayerGroupRef.current = markersGroup
    routeLayerGroupRef.current = routeGroup
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Render static infrastructure (Lakes, Choke points, Shelters)
  useEffect(() => {
    const map = mapInstanceRef.current
    const group = markersLayerGroupRef.current
    if (!map || !group) return

    group.clearLayers()

    // 1. Major Bengaluru Lakes (Cyan circles)
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
      const lakeCircle = L.circle(coords, {
        radius: 800,
        color: isCritical ? '#EF4444' : '#06B6D4',
        fillColor: isCritical ? '#EF4444' : '#06B6D4',
        fillOpacity: 0.28,
        weight: 1.5,
      })

      lakeCircle.bindPopup(`
        <div style="background:#0c1510; color:#fff; padding:10px; border-radius:10px; font-family:sans-serif; border:1px solid rgba(6,182,212,0.4);">
          <b style="color:#38BDF8; font-size:13px;">${lake.name}</b>
          <div style="font-size:11px; margin-top:4px; color:#ccc;">Area: ${lake.area} ha · Status: <b style="color:${isCritical ? '#EF4444' : '#10B981'}">${lake.status}</b></div>
          <div style="font-size:10px; color:#888; margin-top:2px;">Encroachment: ${lake.encroachment}%</div>
        </div>
      `)
      group.addLayer(lakeCircle)
    })

    // 2. High-Ground Emergency Flood Shelters (Neon Green Markers)
    EMERGENCY_SHELTERS.forEach(shelter => {
      const shelterIcon = L.divIcon({
        className: 'shelter-marker-icon',
        html: `
          <div style="
            width: 32px; height: 32px; border-radius: 50%;
            background: linear-gradient(135deg, #10B981 0%, #065F46 100%);
            border: 2px solid #34D399;
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.8);
            display: flex; align-items: center; justify-content: center;
            color: #030604; font-weight: 900; font-size: 15px; cursor: pointer;
          ">
            🛡️
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([shelter.lat, shelter.lng], { icon: shelterIcon })
      marker.bindPopup(`
        <div style="background:#0c1510; color:#fff; padding:12px; border-radius:12px; font-family:sans-serif; border:1px solid #10B981; min-width:180px;">
          <div style="font-size:10px; font-weight:800; color:#10B981; text-transform:uppercase;">Verified Municipal Safe Area</div>
          <b style="color:#ffffff; font-size:13px; display:block; margin:2px 0 6px;">${shelter.name}</b>
          <div style="font-size:11px; color:#34D399; margin-bottom:4px;">Elevation: <b>${shelter.elevationMsl}m MSL (High Ground)</b></div>
          <div style="font-size:11px; color:#aaa;">Capacity: <b>${shelter.shelterCapacity} Citizens</b></div>
          <div style="font-size:11px; color:#aaa;">Emergency Beds: <b style="color:#38BDF8;">${shelter.availableBeds} Ready</b></div>
        </div>
      `)
      group.addLayer(marker)
    })

    // 3. Known Flooded Choke Points (Red Pulsing Hazard Markers)
    FLOOD_CHOKE_POINTS.forEach(choke => {
      const chokeIcon = L.divIcon({
        className: 'choke-marker-icon',
        html: `
          <div style="
            width: 30px; height: 30px; border-radius: 50%;
            background: rgba(239, 68, 68, 0.3);
            border: 2px solid #EF4444;
            box-shadow: 0 0 16px #EF4444;
            display: flex; align-items: center; justify-content: center;
            color: #FFFFFF; font-weight: 800; font-size: 14px;
            animation: pulse 1.8s infinite;
          ">
            ⚠️
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const marker = L.marker([choke.lat, choke.lng], { icon: chokeIcon })
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

    // 4. Live User Location Marker (if provided)
    if (userLiveCoords) {
      const userIcon = L.divIcon({
        className: 'user-live-pin',
        html: `
          <div style="
            width: 24px; height: 24px; border-radius: 50%;
            background: #38BDF8;
            border: 3px solid #FFFFFF;
            box-shadow: 0 0 20px #38BDF8, 0 0 35px #0284C7;
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="width:6px; height:6px; background:#fff; border-radius:50%;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const userMarker = L.marker([userLiveCoords.lat, userLiveCoords.lng], { icon: userIcon })
      userMarker.bindPopup(`
        <div style="background:#0c1510; color:#fff; padding:8px 12px; border-radius:8px; font-family:sans-serif; border:1px solid #38BDF8;">
          <b style="color:#38BDF8;">📍 Your Live GPS Location</b>
          <div style="font-size:10px; color:#888;">Lat: ${userLiveCoords.lat.toFixed(4)}, Lng: ${userLiveCoords.lng.toFixed(4)}</div>
        </div>
      `)
      group.addLayer(userMarker)
    }
  }, [userLiveCoords])

  // Handle route rendering (Hazardous red line + Safe green line)
  useEffect(() => {
    const map = mapInstanceRef.current
    const routeGroup = routeLayerGroupRef.current
    if (!map || !routeGroup) return

    routeGroup.clearLayers()

    if (!routeResult) return

    // 1. Plot Hazardous Path (Dashed Red Line) if flood detected
    if (routeResult.hasFloodHazard && routeResult.hazardousPath) {
      const redPolyline = L.polyline(routeResult.hazardousPath, {
        color: '#EF4444',
        weight: 4.5,
        dashArray: '8, 8',
        opacity: 0.85,
      })
      redPolyline.bindPopup(`
        <div style="background:#140808; color:#fff; padding:10px; border-radius:8px; border:1px solid #EF4444;">
          <b style="color:#EF4444;">⚠️ Hazardous / Blocked Route</b>
          <div style="font-size:11px; color:#ddd; margin-top:2px;">Crosses ${routeResult.blockedHazardName} (${routeResult.hazardWaterDepth} water). Submergence danger.</div>
        </div>
      `)
      routeGroup.addLayer(redPolyline)
    }

    // 2. Plot Safe Alternative Route (Solid Glowing Neon Emerald Line)
    const greenPolyline = L.polyline(routeResult.safePath, {
      color: '#10B981',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    })
    greenPolyline.bindPopup(`
      <div style="background:#0c1510; color:#fff; padding:10px; border-radius:8px; border:1px solid #10B981;">
        <b style="color:#34D399;">🛡️ Verified Safe Alternative Route</b>
        <div style="font-size:11px; color:#ddd; margin-top:2px;">Distance: ${routeResult.safeDistanceKm} km · Est. Time: ${routeResult.safeEstMinutes} mins</div>
        <div style="font-size:10px; color:#10B981; font-weight:700; margin-top:3px;">Zero active flood hazards detected.</div>
      </div>
    `)
    routeGroup.addLayer(greenPolyline)

    // 3. Add Source & Destination Pins
    const sourceIcon = L.divIcon({
      className: 'route-source-pin',
      html: `
        <div style="
          padding: 4px 8px; border-radius: 6px;
          background: #3B82F6; color: #fff; font-weight: 800; font-size: 11px;
          border: 1px solid #60A5FA; box-shadow: 0 0 12px rgba(59,130,246,0.6);
          white-space: nowrap; transform: translate(-50%, -100%);
        ">
          A: ${routeResult.source.name}
        </div>
      `,
      iconSize: [0, 0],
    })
    const destIcon = L.divIcon({
      className: 'route-dest-pin',
      html: `
        <div style="
          padding: 4px 8px; border-radius: 6px;
          background: #10B981; color: #030604; font-weight: 900; font-size: 11px;
          border: 1px solid #34D399; box-shadow: 0 0 15px rgba(16,185,129,0.7);
          white-space: nowrap; transform: translate(-50%, -100%);
        ">
          B: ${routeResult.destination.name}
        </div>
      `,
      iconSize: [0, 0],
    })

    routeGroup.addLayer(L.marker([routeResult.source.lat, routeResult.source.lng], { icon: sourceIcon }))
    routeGroup.addLayer(L.marker([routeResult.destination.lat, routeResult.destination.lng], { icon: destIcon }))

    // Fit map bounds to show complete safe route comfortably
    map.fitBounds(greenPolyline.getBounds(), { padding: [50, 50] })
  }, [routeResult])

  // Pan to focus coordinates when requested
  useEffect(() => {
    if (!focusCoords || !mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([focusCoords.lat, focusCoords.lng], focusCoords.zoom || 14, {
      duration: 1.2,
    })
  }, [focusCoords])

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Real Leaflet Black-Theme Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#090e0b' }} />

      {/* Floating Map Legend Overlay */}
      <div style={{
        position: 'absolute',
        top: 14,
        left: 14,
        zIndex: 500,
        background: 'rgba(9, 14, 11, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 10,
        padding: '8px 12px',
        fontSize: 11,
        color: '#FFFFFF',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
          <span>Safe Route</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 3, background: '#EF4444' }} />
          <span>Flooded Choke</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>🛡️</span>
          <span>High-Ground Shelter</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(6,182,212,0.5)', border: '1px solid #06B6D4' }} />
          <span>Lake Retention</span>
        </div>
      </div>
    </div>
  )
}
