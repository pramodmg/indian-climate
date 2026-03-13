const thresholds = {
  heatwave: { watch: 37, warning: 40, emergency: 44, unit: 'C' },
  flood: { watch: 60, warning: 75, emergency: 90, unit: '%' },
  'air-quality': { watch: 35, warning: 60, emergency: 90, unit: 'ug/m3' },
}

function inferSeverity(value, threshold) {
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

function severityRank(severity) {
  if (severity === 'emergency') {
    return 3
  }

  if (severity === 'warning') {
    return 2
  }

  return 1
}

export function getAlertThresholds() {
  return thresholds
}

export function generateRealtimeAlerts(snapshot, city) {
  const nowIso = new Date().toISOString()
  const alerts = []

  const heatValue = Math.max(snapshot.currentTempC, snapshot.feelsLikeC)
  const heatSeverity = inferSeverity(heatValue, thresholds.heatwave)

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
          ? thresholds.heatwave.emergency
          : heatSeverity === 'warning'
            ? thresholds.heatwave.warning
            : thresholds.heatwave.watch,
      value: Number(heatValue.toFixed(1)),
      unit: thresholds.heatwave.unit,
      triggeredAt: nowIso,
    })
  }

  const threeDayPeakRain = Math.max(...snapshot.nextThreeDays.map((day) => day.rainChance))
  const floodSignal = Math.max(snapshot.precipitationMm * 6, threeDayPeakRain, city.floodSensitivity)
  const floodSeverity = inferSeverity(floodSignal, thresholds.flood)

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
          ? thresholds.flood.emergency
          : floodSeverity === 'warning'
            ? thresholds.flood.warning
            : thresholds.flood.watch,
      value: Math.round(floodSignal),
      unit: thresholds.flood.unit,
      triggeredAt: nowIso,
    })
  }

  const airSeverity = inferSeverity(snapshot.pm25, thresholds['air-quality'])

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
          ? thresholds['air-quality'].emergency
          : airSeverity === 'warning'
            ? thresholds['air-quality'].warning
            : thresholds['air-quality'].watch,
      value: Number(snapshot.pm25.toFixed(1)),
      unit: thresholds['air-quality'].unit,
      triggeredAt: nowIso,
    })
  }

  return alerts.sort((left, right) => severityRank(right.severity) - severityRank(left.severity))
}
