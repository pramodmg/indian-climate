export type ClimateRisk = 'Low' | 'Moderate' | 'High' | 'Severe'
export type OverlayMetric = 'heat' | 'flood' | 'air'
export type OverlayLevel = 'state' | 'district'
export type AlertType = 'heatwave' | 'flood' | 'air-quality'
export type AlertSeverity = 'watch' | 'warning' | 'emergency'

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

export interface AuthUser {
  id: string
  name: string
  email: string
  createdAt: string
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
  pm25: number
  aqiLabel: string
  riskLevel: ClimateRisk
  dataSource: 'live' | 'fallback' | 'backend-cache'
  cacheStatus?: 'hit' | 'miss'
  lastUpdated: string
  nextThreeDays: ForecastDay[]
}
