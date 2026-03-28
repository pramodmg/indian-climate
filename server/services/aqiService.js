const AIR_QUALITY_ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality'

function firstNumericValue(values) {
  return values?.find(
    (value) => typeof value === 'number' && Number.isFinite(value),
  ) ?? null
}

function categorizeAQI(pm25, pm10, no2, o3) {
  const pm25Score = calculatePollutantScore(pm25, [50, 100, 150, 250])
  const pm10Score = calculatePollutantScore(pm10, [50, 100, 250, 350])
  const no2Score = calculatePollutantScore(no2, [40, 80, 180, 280])
  const o3Score = calculatePollutantScore(o3, [50, 100, 168, 208])

  const maxScore = Math.max(pm25Score, pm10Score, no2Score, o3Score)

  if (maxScore <= 50) {
    return {
      category: 'Good',
      aqi: maxScore,
      healthRisk: 'none',
      recommendation: 'Excellent air quality. Ideal for outdoor activities.',
      affectedGroups: [],
    }
  }

  if (maxScore <= 100) {
    return {
      category: 'Satisfactory',
      aqi: maxScore,
      healthRisk: 'sensitive',
      recommendation: 'Satisfactory air quality. Sensitive groups should limit outdoor activity.',
      affectedGroups: ['children', 'elderly', 'people with respiratory diseases'],
    }
  }

  if (maxScore <= 200) {
    return {
      category: 'Moderately Polluted',
      aqi: maxScore,
      healthRisk: 'sensitive',
      recommendation: 'Moderately polluted. Sensitive groups should avoid prolonged outdoor exposure.',
      affectedGroups: ['children', 'elderly', 'people with respiratory diseases', 'people with heart disease'],
    }
  }

  if (maxScore <= 300) {
    return {
      category: 'Poor',
      aqi: maxScore,
      healthRisk: 'general',
      recommendation: 'Poor air quality. General public should limit outdoor activity.',
      affectedGroups: ['children', 'elderly', 'people with respiratory diseases', 'people with heart disease'],
    }
  }

  if (maxScore <= 400) {
    return {
      category: 'Very Poor',
      aqi: maxScore,
      healthRisk: 'everyone',
      recommendation: 'Very poor air quality. Avoid outdoor activity. Use air purifiers indoors.',
      affectedGroups: ['everyone'],
    }
  }

  return {
    category: 'Severe',
    aqi: maxScore,
    healthRisk: 'severe',
    recommendation: 'Severe air quality hazard. Stay indoors and use air purifiers.',
    affectedGroups: ['everyone'],
  }
}

function calculatePollutantScore(value, thresholds) {
  if (value == null) return 0

  if (value <= thresholds[0]) return (value / thresholds[0]) * 50
  if (value <= thresholds[1]) return 50 + ((value - thresholds[0]) / (thresholds[1] - thresholds[0])) * 50
  if (value <= thresholds[2]) return 100 + ((value - thresholds[1]) / (thresholds[2] - thresholds[1])) * 100
  if (value <= thresholds[3]) return 200 + ((value - thresholds[2]) / (thresholds[3] - thresholds[2])) * 100

  return 300 + Math.min((value - thresholds[3]) * 5, 100)
}

async function fetchAQIData(latitude, longitude) {
  const url = new URL(AIR_QUALITY_ENDPOINT)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('hourly', 'pm2_5,pm10,nitrogen_dioxide,ozone')
  url.searchParams.set('forecast_days', '1')
  url.searchParams.set('timezone', 'auto')

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Unable to reach air quality endpoint')
  }

  const data = await response.json()

  const pm25 = firstNumericValue(data.hourly?.pm2_5)
  const pm10 = firstNumericValue(data.hourly?.pm10)
  const no2 = firstNumericValue(data.hourly?.nitrogen_dioxide)
  const o3 = firstNumericValue(data.hourly?.ozone)

  const aqiInfo = categorizeAQI(pm25, pm10, no2, o3)

  return {
    category: aqiInfo.category,
    aqi: Math.round(aqiInfo.aqi),
    healthRisk: aqiInfo.healthRisk,
    pollutants: {
      pm25: pm25 ? Math.round(pm25 * 10) / 10 : null,
      pm10: pm10 ? Math.round(pm10 * 10) / 10 : null,
      no2: no2 ? Math.round(no2 * 10) / 10 : null,
      o3: o3 ? Math.round(o3 * 10) / 10 : null,
      co: null,
      so2: null,
    },
    recommendation: aqiInfo.recommendation,
    affectedGroups: aqiInfo.affectedGroups,
    updatedAt: new Date().toISOString(),
  }
}

function buildFallbackAQIData(pm25Value = 45) {
  const aqiInfo = categorizeAQI(pm25Value, pm25Value * 0.8, pm25Value * 0.4, pm25Value * 0.6)

  return {
    category: aqiInfo.category,
    aqi: Math.round(aqiInfo.aqi),
    healthRisk: aqiInfo.healthRisk,
    pollutants: {
      pm25: pm25Value,
      pm10: Math.round(pm25Value * 0.8 * 10) / 10,
      no2: Math.round(pm25Value * 0.4 * 10) / 10,
      o3: Math.round(pm25Value * 0.6 * 10) / 10,
      co: null,
      so2: null,
    },
    recommendation: aqiInfo.recommendation,
    affectedGroups: aqiInfo.affectedGroups,
    updatedAt: new Date().toISOString(),
  }
}

export { fetchAQIData, buildFallbackAQIData }
