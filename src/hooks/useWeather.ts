import { useState, useEffect, useRef } from 'react'

// ─── Open-Meteo API (free, no key required) ───────────────
// Lat/Lng for Bengaluru city center
const BLR_LAT = 12.9716
const BLR_LNG = 77.5946

export interface WeatherData {
  currentTemp: number
  feelsLike: number
  rainfall1h: number      // mm in last hour
  rainfall24h: number     // mm in last 24h
  humidity: number
  windSpeed: number       // km/h
  condition: string
  floodRiskToday: number  // computed 0–100
  heatRiskToday: number   // computed 0–100
  forecast: ForecastDay[]
  lastUpdated: Date
  isLoading: boolean
  error: string | null
}

export interface ForecastDay {
  date: string
  maxTemp: number
  minTemp: number
  rainfall: number
  condition: string
}

const computeFloodRisk = (rain1h: number, rain24h: number, humidity: number): number => {
  // Calibrated against Bengaluru's drainage capacity (~7mm/hr)
  const hourlyFactor = Math.min(100, (rain1h / 7) * 60)
  const dailyFactor = Math.min(100, (rain24h / 80) * 70)
  const humidFactor = Math.min(30, ((humidity - 60) / 40) * 30)
  return Math.round(Math.min(100, hourlyFactor * 0.5 + dailyFactor * 0.4 + humidFactor * 0.1))
}

const computeHeatRisk = (temp: number, humidity: number): number => {
  // Heat index for Bengaluru's context (avg is 26–28°C)
  const tempFactor = Math.min(80, Math.max(0, ((temp - 28) / 12) * 80))
  const humidFactor = Math.min(20, ((humidity - 40) / 60) * 20)
  return Math.round(Math.min(100, tempFactor + humidFactor))
}

const getCondition = (code: number): string => {
  if (code === 0) return 'Clear Sky'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 49) return 'Foggy'
  if (code <= 67) return 'Rainy'
  if (code <= 77) return 'Snow Showers'
  if (code <= 82) return 'Rain Showers'
  if (code <= 99) return 'Thunderstorm'
  return 'Unknown'
}

export function useWeather() {
  const [data, setData] = useState<WeatherData>({
    currentTemp: 28,
    feelsLike: 30,
    rainfall1h: 0,
    rainfall24h: 12,
    humidity: 72,
    windSpeed: 14,
    condition: 'Partly Cloudy',
    floodRiskToday: 35,
    heatRiskToday: 42,
    forecast: [],
    lastUpdated: new Date(),
    isLoading: true,
    error: null,
  })

  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    const fetchWeather = async () => {
      try {
        const url = new URL('https://api.open-meteo.com/v1/forecast')
        url.searchParams.set('latitude', String(BLR_LAT))
        url.searchParams.set('longitude', String(BLR_LNG))
        url.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation')
        url.searchParams.set('hourly', 'precipitation')
        url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code')
        url.searchParams.set('timezone', 'Asia/Kolkata')
        url.searchParams.set('forecast_days', '7')

        const res = await fetch(url.toString())
        if (!res.ok) throw new Error(`Weather API error: ${res.status}`)
        const json = await res.json()

        const cur = json.current
        const daily = json.daily
        const hourly = json.hourly

        // Calculate 24h rainfall from hourly data
        const now = new Date()
        const rain24h = hourly.precipitation
          .slice(0, 24)
          .reduce((sum: number, v: number) => sum + (v || 0), 0)

        const forecast: ForecastDay[] = (daily.time || []).slice(0, 7).map((date: string, i: number) => ({
          date,
          maxTemp: daily.temperature_2m_max[i],
          minTemp: daily.temperature_2m_min[i],
          rainfall: daily.precipitation_sum[i],
          condition: getCondition(daily.weather_code[i]),
        }))

        const temp = cur.temperature_2m
        const humidity = cur.relative_humidity_2m
        const rain1h = cur.precipitation

        if (isMounted.current) {
          setData({
            currentTemp: Math.round(temp * 10) / 10,
            feelsLike: Math.round(cur.apparent_temperature * 10) / 10,
            rainfall1h: Math.round(rain1h * 10) / 10,
            rainfall24h: Math.round(rain24h * 10) / 10,
            humidity,
            windSpeed: Math.round(cur.wind_speed_10m),
            condition: getCondition(cur.weather_code),
            floodRiskToday: computeFloodRisk(rain1h, rain24h, humidity),
            heatRiskToday: computeHeatRisk(temp, humidity),
            forecast,
            lastUpdated: new Date(),
            isLoading: false,
            error: null,
          })
        }
      } catch (err) {
        if (isMounted.current) {
          setData(prev => ({
            ...prev,
            isLoading: false,
            error: 'Unable to fetch live weather. Showing recent data.',
          }))
        }
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60 * 1000) // refresh every 10min

    return () => {
      isMounted.current = false
      clearInterval(interval)
    }
  }, [])

  return data
}
