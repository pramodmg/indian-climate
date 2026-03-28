import { CACHE_TTL_SECONDS } from '../config.js'
import { getCityById } from '../data/cities.js'
import { fetchAQIData, buildFallbackAQIData } from './aqiService.js'

const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const formatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

const climateCache = new Map()

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10
}

function toDisplayDate(isoDate) {
  const parsedDate = new Date(isoDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return isoDate
  }

  return formatter.format(parsedDate)
}

function buildFallbackForecast(baseTemperature) {
  return Array.from({ length: 3 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() + index + 1)

    return {
      date: toDisplayDate(date.toISOString()),
      minC: roundToOneDecimal(baseTemperature - 4 - index * 0.4),
      maxC: roundToOneDecimal(baseTemperature + 2 + index * 0.6),
      rainChance: Math.max(8, Math.min(92, 18 + index * 14)),
    }
  })
}

function buildFallbackSnapshot(city) {
  const aqi = buildFallbackAQIData(city.baseline.pm25)

  return {
    currentTempC: city.baseline.temperature,
    feelsLikeC: roundToOneDecimal(city.baseline.temperature + 1.8),
    humidity: city.baseline.humidity,
    windSpeedKmh: city.baseline.wind,
    precipitationMm: city.baseline.rain,
    aqi,
    riskLevel: aqi.healthRisk === 'severe' ? 'Severe' : aqi.healthRisk === 'everyone' ? 'High' : aqi.healthRisk === 'general' ? 'Moderate' : 'Low',
    dataSource: 'fallback',
    cacheStatus: 'miss',
    lastUpdated: new Date().toISOString(),
    nextThreeDays: buildFallbackForecast(city.baseline.temperature),
  }
}

function firstNumericValue(values) {
  return values?.find(
    (value) => typeof value === 'number' && Number.isFinite(value),
  ) ?? null
}

async function fetchLiveSnapshot(city) {
  const weatherUrl = new URL(WEATHER_ENDPOINT)
  weatherUrl.searchParams.set('latitude', String(city.latitude))
  weatherUrl.searchParams.set('longitude', String(city.longitude))
  weatherUrl.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation',
  )
  weatherUrl.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  )
  weatherUrl.searchParams.set('timezone', 'auto')
  weatherUrl.searchParams.set('forecast_days', '4')

  const [weatherResponse, aqiData] = await Promise.all([
    fetch(weatherUrl),
    fetchAQIData(city.latitude, city.longitude).catch(() => buildFallbackAQIData(city.baseline.pm25)),
  ])

  if (!weatherResponse.ok) {
    throw new Error('Unable to reach weather endpoint')
  }

  const weatherData = await weatherResponse.json()

  const dailyDates = weatherData.daily?.time?.slice(1, 4) ?? []
  const dailyMaxTemps = weatherData.daily?.temperature_2m_max?.slice(1, 4) ?? []
  const dailyMinTemps = weatherData.daily?.temperature_2m_min?.slice(1, 4) ?? []
  const dailyRainChance = weatherData.daily?.precipitation_probability_max?.slice(1, 4) ?? []

  const nextThreeDays = dailyDates.map((date, index) => ({
    date: toDisplayDate(date),
    minC: roundToOneDecimal(dailyMinTemps[index] ?? city.baseline.temperature - 4),
    maxC: roundToOneDecimal(dailyMaxTemps[index] ?? city.baseline.temperature + 2),
    rainChance: Math.round(dailyRainChance[index] ?? city.baseline.rain * 10),
  }))

  if (nextThreeDays.length < 3) {
    const fallbackDays = buildFallbackForecast(city.baseline.temperature)
    nextThreeDays.push(...fallbackDays.slice(nextThreeDays.length))
  }

  const riskLevelMap = {
    'none': 'Low',
    'sensitive': 'Moderate',
    'general': 'High',
    'everyone': 'High',
    'severe': 'Severe'
  }

  return {
    currentTempC: roundToOneDecimal(
      weatherData.current?.temperature_2m ?? city.baseline.temperature,
    ),
    feelsLikeC: roundToOneDecimal(
      weatherData.current?.apparent_temperature ?? city.baseline.temperature + 2,
    ),
    humidity: Math.round(
      weatherData.current?.relative_humidity_2m ?? city.baseline.humidity,
    ),
    windSpeedKmh: roundToOneDecimal(weatherData.current?.wind_speed_10m ?? city.baseline.wind),
    precipitationMm: roundToOneDecimal(weatherData.current?.precipitation ?? city.baseline.rain),
    aqi: aqiData,
    riskLevel: riskLevelMap[aqiData.healthRisk] || 'Moderate',
    dataSource: 'live',
    cacheStatus: 'miss',
    lastUpdated: weatherData.current?.time ?? new Date().toISOString(),
    nextThreeDays,
  }
}

export async function getClimateSnapshot(cityId) {
  const city = getCityById(cityId)

  if (!city) {
    throw new Error('Unknown city')
  }

  const cached = climateCache.get(cityId)

  if (cached && cached.expiresAt > Date.now()) {
    return {
      ...cached.payload,
      dataSource: 'backend-cache',
      cacheStatus: 'hit',
    }
  }

  try {
    const snapshot = await fetchLiveSnapshot(city)

    climateCache.set(cityId, {
      expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
      payload: snapshot,
    })

    return snapshot
  } catch {
    const fallbackSnapshot = buildFallbackSnapshot(city)

    climateCache.set(cityId, {
      expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
      payload: fallbackSnapshot,
    })

    return fallbackSnapshot
  }
}
