export type ClimateRisk = 'Low' | 'Moderate' | 'High' | 'Severe'
export type OverlayMetric = 'heat' | 'flood' | 'air'
export type OverlayLevel = 'state' | 'district'
export type AlertType = 'heatwave' | 'flood' | 'air-quality'
export type AlertSeverity = 'watch' | 'warning' | 'emergency'
export type AQICategory = 'Good' | 'Satisfactory' | 'Moderately Polluted' | 'Poor' | 'Very Poor' | 'Severe'
export type AQIHealthRisk = 'none' | 'sensitive' | 'general' | 'everyone' | 'severe'

export interface IndiaCity {
  id: string
  name: string
  state: string
  country: string
  regionGroup: 'india' | 'international'
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

export interface BoundaryMetricScores {
  heat: number
  flood: number
  air: number
}

export interface AdministrativeOverlay {
  id: string
  name: string
  level: OverlayLevel
  stateId: string
  cityId?: string
  coordinates: Array<[number, number]>
  metrics: BoundaryMetricScores
}

export interface RealtimeAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  threshold: number
  value: number
  unit: string
  triggeredAt: string
}

export interface AlertThresholdConfig {
  type: AlertType
  watch: number
  warning: number
  emergency: number
  unit: string
}

export interface AlertPreferences {
  minSeverity: AlertSeverity
  enabledTypes: AlertType[]
}

export interface AQIData {
  category: AQICategory
  aqi: number
  healthRisk: AQIHealthRisk
  pollutants: {
    pm25: number | null
    pm10: number | null
    no2: number | null
    o3: number | null
    co: number | null
    so2: number | null
  }
  recommendation: string
  affectedGroups: string[]
  updatedAt: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  createdAt: string
  alertPreferences: AlertPreferences
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface ClimateSnapshot {
  currentTempC: number
  feelsLikeC: number
  humidity: number
  windSpeedKmh: number
  precipitationMm: number
  aqi: AQIData
  riskLevel: ClimateRisk
  dataSource: 'live' | 'fallback' | 'backend-cache'
  cacheStatus?: 'hit' | 'miss'
  lastUpdated: string
  nextThreeDays: ForecastDay[]
}

export type CityContextScope = 'city' | 'district'

export interface CityContextDetails {
  cityId: string
  cityName: string
  country: string
  scope: CityContextScope
  scopeLabel: string
  populationEstimate: number | null
  dataSource: 'live-osm' | 'catalog-fallback'
  radiusMeters: number
  buildingEstimate: number | null
  commercialPlaceCount: number | null
  commercialBreakdown: Record<string, number>
  taxContext: {
    systemType: string
    note: string
  }
  insightSummary: string[]
  updatedAt: string
}
