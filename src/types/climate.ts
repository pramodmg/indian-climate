export type ClimateRisk = 'Low' | 'Moderate' | 'High' | 'Severe'

export interface IndiaCity {
  id: string
  name: string
  state: string
  latitude: number
  longitude: number
  climateZone: string
  monsoonWindow: string
}

export interface ForecastDay {
  date: string
  minC: number
  maxC: number
  rainChance: number
}

export interface ClimateSnapshot {
  currentTempC: number
  feelsLikeC: number
  humidity: number
  windSpeedKmh: number
  precipitationMm: number
  pm25: number
  aqiLabel: string
  riskLevel: ClimateRisk
  dataSource: 'live' | 'fallback'
  lastUpdated: string
  nextThreeDays: ForecastDay[]
}
