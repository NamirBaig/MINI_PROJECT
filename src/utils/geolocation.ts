// ============================================================
// SafeGround Live Geolocation & Municipal Zone Resolver
// Uses Browser Geolocation API + Nearest Bengaluru Zone Matching
// + Lightweight reverse geocoding with instant fallback
// ============================================================

export interface LiveLocationResult {
  latitude: number
  longitude: number
  accuracy: number
  nearestZone: string
  formattedAddress: string
  source: 'GPS_LIVE' | 'FALLBACK'
}

const BENGALURU_ZONE_CENTROIDS = [
  { name: 'Yelahanka', lat: 13.1007, lng: 77.5963 },
  { name: 'Mahadevapura', lat: 12.9698, lng: 77.7500 },
  { name: 'Bommanahalli', lat: 12.9116, lng: 77.6474 },
  { name: 'East', lat: 12.9784, lng: 77.6408 },
  { name: 'West', lat: 12.9901, lng: 77.5525 },
  { name: 'South', lat: 12.9352, lng: 77.6245 },
  { name: 'RR Nagar', lat: 12.9279, lng: 77.5154 },
  { name: 'Dasarahalli', lat: 13.0426, lng: 77.5140 },
]

/**
 * Computes closest Bengaluru municipal zone based on coordinates
 */
export function findNearestZone(lat: number, lng: number): string {
  let closestZone = BENGALURU_ZONE_CENTROIDS[0].name
  let minDistance = Infinity

  for (const z of BENGALURU_ZONE_CENTROIDS) {
    const dLat = lat - z.lat
    const dLng = lng - z.lng
    const distSq = dLat * dLat + dLng * dLng
    if (distSq < minDistance) {
      minDistance = distSq
      closestZone = z.name
    }
  }

  return closestZone
}

/**
 * Attempts reverse geocoding with a 3.5s timeout; falls back to formatted GPS string
 */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3500)

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en',
      },
    })
    clearTimeout(timer)

    if (res.ok) {
      const data = await res.json()
      const addr = data.address || {}
      const parts = [
        addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood,
        addr.city_district || addr.quarter || addr.suburb,
        addr.city || addr.town || addr.village || 'Bengaluru',
      ].filter(Boolean)

      if (parts.length > 0) {
        return parts.join(', ')
      }
    }
  } catch {
    // Ignore timeout or network errors
  }

  return `GPS: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
}

/**
 * Request high-accuracy live GPS location from user's device
 */
export async function getDeviceLiveLocation(): Promise<LiveLocationResult> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const acc = Math.round(pos.coords.accuracy || 15)
        const zone = findNearestZone(lat, lng)
        const geocoded = await reverseGeocode(lat, lng)

        resolve({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          nearestZone: zone,
          formattedAddress: `${geocoded} (±${acc}m GPS Lock)`,
          source: 'GPS_LIVE',
        })
      },
      (err) => {
        let msg = 'Unable to retrieve location.'
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location access in your browser settings.'
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.'
        } else if (err.code === err.TIMEOUT) {
          msg = 'GPS acquisition timed out. Retrying with fallback.'
        }
        reject(new Error(msg))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )
  })
}
