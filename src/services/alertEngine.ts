import type {
  AdministrativeOverlay,
  AlertSeverity,
  AlertThresholdConfig,
  ClimateSnapshot,
  IndiaCity,
  RealtimeAlert,
} from '../types/climate'

export const realtimeAlertThresholds: AlertThresholdConfig[] = [
  { type: 'heatwave', watch: 37, warning: 40, emergency: 44, unit: 'C' },
  { type: 'flood', watch: 60, warning: 75, emergency: 90, unit: '%' },
  { type: 'air-quality', watch: 35, warning: 60, emergency: 90, unit: 'ug/m3' },
]

function inferSeverity(value: number, threshold: AlertThresholdConfig): AlertSeverity | null {
  if (value >= threshold.emergency) {
    return 'emergency'
  }

  if (value >= threshold.warning) {
    return 'warning'
  }

  if (value >= threshold.watch) {
    return 'watch'
  }

  return null
}

function severityRank(severity: AlertSeverity): number {
  if (severity === 'emergency') {
    return 3
  }

  if (severity === 'warning') {
    return 2
  }

  return 1
}

function floodSignal(snapshot: ClimateSnapshot, districtOverlay: AdministrativeOverlay | null): number {
  const immediateRain = snapshot.precipitationMm * 6
  const threeDayPeak = Math.max(...snapshot.nextThreeDays.map((day) => day.rainChance))
  const districtFloodPressure = districtOverlay?.metrics.flood ?? 0

  return Math.max(immediateRain, threeDayPeak, districtFloodPressure)
}

export function generateRealtimeAlerts(
  snapshot: ClimateSnapshot,
  city: IndiaCity,
  districtOverlay: AdministrativeOverlay | null,
): RealtimeAlert[] {
  const nowIso = new Date().toISOString()
  const alerts: RealtimeAlert[] = []

  const heatThreshold = realtimeAlertThresholds[0]
  const heatValue = Math.max(snapshot.currentTempC, snapshot.feelsLikeC)
  const heatSeverity = inferSeverity(heatValue, heatThreshold)

  if (heatSeverity) {
    alerts.push({
      id: `heatwave-${city.id}`,
      type: 'heatwave',
      severity: heatSeverity,
      title: `${city.name} heatwave ${heatSeverity}`,
      message:
        heatSeverity === 'emergency'
          ? 'Activate cooling centers and midday outdoor advisories immediately.'
          : 'Issue ward-level advisories for hydration, shade, and adjusted work hours.',
      threshold:
        heatSeverity === 'emergency'
          ? heatThreshold.emergency
          : heatSeverity === 'warning'
            ? heatThreshold.warning
            : heatThreshold.watch,
      value: Number(heatValue.toFixed(1)),
      unit: heatThreshold.unit,
      triggeredAt: nowIso,
    })
  }

  const floodThreshold = realtimeAlertThresholds[1]
  const floodValue = floodSignal(snapshot, districtOverlay)
  const floodSeverity = inferSeverity(floodValue, floodThreshold)

  if (floodSeverity) {
    alerts.push({
      id: `flood-${city.id}`,
      type: 'flood',
      severity: floodSeverity,
      title: `${city.name} flood ${floodSeverity}`,
      message:
        floodSeverity === 'emergency'
          ? 'Keep drainage and response teams on immediate standby in low-lying zones.'
          : 'Track high-risk catchments and prepare pumps and route diversions.',
      threshold:
        floodSeverity === 'emergency'
          ? floodThreshold.emergency
          : floodSeverity === 'warning'
            ? floodThreshold.warning
            : floodThreshold.watch,
      value: Math.round(floodValue),
      unit: floodThreshold.unit,
      triggeredAt: nowIso,
    })
  }

  const airThreshold = realtimeAlertThresholds[2]
  const airSeverity = inferSeverity(snapshot.pm25, airThreshold)

  if (airSeverity) {
    alerts.push({
      id: `air-${city.id}`,
      type: 'air-quality',
      severity: airSeverity,
      title: `${city.name} air-quality ${airSeverity}`,
      message:
        airSeverity === 'emergency'
          ? 'Restrict sensitive-group exposure and trigger emergency air advisories.'
          : 'Recommend masks for sensitive groups and reduce prolonged outdoor exertion.',
      threshold:
        airSeverity === 'emergency'
          ? airThreshold.emergency
          : airSeverity === 'warning'
            ? airThreshold.warning
            : airThreshold.watch,
      value: Number(snapshot.pm25.toFixed(1)),
      unit: airThreshold.unit,
      triggeredAt: nowIso,
    })
  }

  return alerts.sort((left, right) => severityRank(right.severity) - severityRank(left.severity))
}
