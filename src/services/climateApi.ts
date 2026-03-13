import type {
  ClimateRisk,
  ClimateSnapshot,
  ForecastDay,
  IndiaCity,
} from '../types/climate'

interface WeatherApiResponse {
  current?: {
    temperature_2m?: number
    relative_humidity_2m?: number
    apparent_temperature?: number
    wind_speed_10m?: number
    precipitation?: number
    time?: string
  }
  daily?: {
    time?: string[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_probability_max?: number[]
  }
}

interface AirQualityApiResponse {
  hourly?: {
    pm2_5?: Array<number | null>
  }
}

const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const AIR_ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality'

const cityBaselines: Record<
  string,
  {
    temperature: number
    humidity: number
    wind: number
    rain: number
    pm25: number
  }
> = {
  'new-delhi': { temperature: 32.8, humidity: 34, wind: 11.4, rain: 0.2, pm25: 68 },
  mumbai: { temperature: 30.1, humidity: 70, wind: 17.8, rain: 2.1, pm25: 32 },
  bengaluru: { temperature: 26.4, humidity: 56, wind: 9.7, rain: 1.3, pm25: 21 },
  kolkata: { temperature: 31.2, humidity: 68, wind: 13.2, rain: 2.8, pm25: 44 },
  chennai: { temperature: 32.1, humidity: 67, wind: 18.6, rain: 0.8, pm25: 29 },
  guwahati: { temperature: 28.2, humidity: 74, wind: 8.3, rain: 7.6, pm25: 25 },
  jaipur: { temperature: 34.5, humidity: 26, wind: 15.1, rain: 0.1, pm25: 51 },
}

const numberFormatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function toDisplayDate(isoDate: string): string {
  const parsedDate = new Date(isoDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return isoDate
  }

  return numberFormatter.format(parsedDate)
}

function getBaseline(cityId: string) {
  return cityBaselines[cityId] ?? {
    temperature: 29,
    humidity: 52,
    wind: 12,
    rain: 1,
    pm25: 30,
  }
}

function classifyPm25(pm25: number): { aqiLabel: string; riskLevel: ClimateRisk } {
  if (pm25 <= 15) {
    return { aqiLabel: 'Good', riskLevel: 'Low' }
  }

  if (pm25 <= 30) {
    return { aqiLabel: 'Fair', riskLevel: 'Moderate' }
  }

  if (pm25 <= 55) {
    return { aqiLabel: 'Poor', riskLevel: 'High' }
  }

  return { aqiLabel: 'Very poor', riskLevel: 'Severe' }
}

function buildFallbackForecast(baseTemperature: number): ForecastDay[] {
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

function buildFallbackSnapshot(city: IndiaCity): ClimateSnapshot {
  const baseline = getBaseline(city.id)
  const quality = classifyPm25(baseline.pm25)

  return {
    currentTempC: baseline.temperature,
    feelsLikeC: roundToOneDecimal(baseline.temperature + 1.8),
    humidity: baseline.humidity,
    windSpeedKmh: baseline.wind,
    precipitationMm: baseline.rain,
    pm25: baseline.pm25,
    aqiLabel: quality.aqiLabel,
    riskLevel: quality.riskLevel,
    dataSource: 'fallback',
    lastUpdated: new Date().toISOString(),
    nextThreeDays: buildFallbackForecast(baseline.temperature),
  }
}

function firstNumericValue(values?: Array<number | null>): number | null {
  const candidate = values?.find(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  )

  return candidate ?? null
}

export async function fetchClimateSnapshot(city: IndiaCity): Promise<ClimateSnapshot> {
  const baseline = getBaseline(city.id)

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

  const airUrl = new URL(AIR_ENDPOINT)
  airUrl.searchParams.set('latitude', String(city.latitude))
  airUrl.searchParams.set('longitude', String(city.longitude))
  airUrl.searchParams.set('hourly', 'pm2_5')
  airUrl.searchParams.set('forecast_days', '1')
  airUrl.searchParams.set('timezone', 'auto')

  try {
    const [weatherResponse, airResponse] = await Promise.all([
      fetch(weatherUrl),
      fetch(airUrl),
    ])

    if (!weatherResponse.ok || !airResponse.ok) {
      throw new Error('Unable to reach climate endpoints')
    }

    const weatherData = (await weatherResponse.json()) as WeatherApiResponse
    const airData = (await airResponse.json()) as AirQualityApiResponse

    const pm25 = firstNumericValue(airData.hourly?.pm2_5) ?? baseline.pm25
    const quality = classifyPm25(pm25)

    const dailyDates = weatherData.daily?.time?.slice(1, 4) ?? []
    const dailyMaxTemps = weatherData.daily?.temperature_2m_max?.slice(1, 4) ?? []
    const dailyMinTemps = weatherData.daily?.temperature_2m_min?.slice(1, 4) ?? []
    const dailyRainChance =
      weatherData.daily?.precipitation_probability_max?.slice(1, 4) ?? []

    const nextThreeDays: ForecastDay[] = dailyDates.map((date, index) => ({
      date: toDisplayDate(date),
      minC: roundToOneDecimal(dailyMinTemps[index] ?? baseline.temperature - 4),
      maxC: roundToOneDecimal(dailyMaxTemps[index] ?? baseline.temperature + 2),
      rainChance: Math.round(dailyRainChance[index] ?? baseline.rain * 10),
    }))

    if (nextThreeDays.length < 3) {
      const fallbackDays = buildFallbackForecast(baseline.temperature)
      nextThreeDays.push(...fallbackDays.slice(nextThreeDays.length))
    }

    return {
      currentTempC: roundToOneDecimal(
        weatherData.current?.temperature_2m ?? baseline.temperature,
      ),
      feelsLikeC: roundToOneDecimal(
        weatherData.current?.apparent_temperature ?? baseline.temperature + 2,
      ),
      humidity: Math.round(
        weatherData.current?.relative_humidity_2m ?? baseline.humidity,
      ),
      windSpeedKmh: roundToOneDecimal(weatherData.current?.wind_speed_10m ?? baseline.wind),
      precipitationMm: roundToOneDecimal(
        weatherData.current?.precipitation ?? baseline.rain,
      ),
      pm25: roundToOneDecimal(pm25),
      aqiLabel: quality.aqiLabel,
      riskLevel: quality.riskLevel,
      dataSource: 'live',
      lastUpdated: weatherData.current?.time ?? new Date().toISOString(),
      nextThreeDays,
    }
  } catch {
    return buildFallbackSnapshot(city)
  }
}
