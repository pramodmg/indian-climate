/**
 * Derives a composite risk score (0–100) from a ClimateSnapshot.
 * Used by the leaderboard — higher is worse.
 *
 * Weights:
 *   Heat pressure  40 %  (currentTempC vs 44 C ceiling)
 *   Air quality    35 %  (pm25 vs 90 µg/m³ ceiling)
 *   Flood pressure 25 %  (precipitationMm vs 30 mm ceiling)
 */
import type { ClimateSnapshot } from '../types/climate'

const HEAT_CEILING = 44
const PM25_CEILING = 90
const RAIN_CEILING = 30

export function computeRiskScore(snapshot: ClimateSnapshot): number {
    const heatScore = Math.min(1, Math.max(0, snapshot.currentTempC / HEAT_CEILING)) * 40
    const airScore = Math.min(1, Math.max(0, snapshot.pm25 / PM25_CEILING)) * 35
    const floodScore = Math.min(1, Math.max(0, snapshot.precipitationMm / RAIN_CEILING)) * 25
    return Math.round(heatScore + airScore + floodScore)
}

export function riskScoreGrade(score: number): 'low' | 'moderate' | 'high' | 'severe' {
    if (score >= 65) return 'severe'
    if (score >= 40) return 'high'
    if (score >= 20) return 'moderate'
    return 'low'
}
