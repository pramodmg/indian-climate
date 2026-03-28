/**
 * Sparkline store — keeps the last N readings per (cityId, metric) in
 * localStorage so MetricCard can draw an SVG trendline.
 */

export type SparkMetric = 'temp' | 'pm25' | 'humidity' | 'wind' | 'rain'

export interface SparkReading {
    value: number
    ts: number // epoch ms
}

export type SparkHistory = Record<string, Record<SparkMetric, SparkReading[]>>

const STORAGE_KEY = 'india-climate-sparklines'
const MAX_READINGS = 8

function readHistory(): SparkHistory {
    if (typeof window === 'undefined') {
        return {}
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
        return {}
    }

    try {
        return JSON.parse(raw) as SparkHistory
    } catch {
        return {}
    }
}

function writeHistory(history: SparkHistory): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function recordSparkReadings(
    cityId: string,
    readings: Record<SparkMetric, number>,
): void {
    const history = readHistory()
    const cityHistory = history[cityId] ?? ({} as Record<SparkMetric, SparkReading[]>)
    const now = Date.now()

    for (const metric of Object.keys(readings) as SparkMetric[]) {
        const existing = cityHistory[metric] ?? []
        cityHistory[metric] = [
            ...existing.slice(-(MAX_READINGS - 1)),
            { value: readings[metric], ts: now },
        ]
    }

    history[cityId] = cityHistory
    writeHistory(history)
}

export function getSparkHistory(
    cityId: string,
    metric: SparkMetric,
): SparkReading[] {
    return readHistory()[cityId]?.[metric] ?? []
}
