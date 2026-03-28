/**
 * Alert history store — persists all seen alerts in localStorage so the
 * AlertHistoryPanel can show a cross-session timeline.
 */

import type { AlertSeverity, AlertType } from '../types/climate'

export interface HistoricalAlert {
    id: string
    cityId: string
    cityName: string
    type: AlertType
    severity: AlertSeverity
    title: string
    value: number
    unit: string
    seenAt: number // epoch ms
}

const STORAGE_KEY = 'india-climate-alert-history'
const MAX_HISTORY = 120

function read(): HistoricalAlert[] {
    if (typeof window === 'undefined') {
        return []
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
        return []
    }

    try {
        return JSON.parse(raw) as HistoricalAlert[]
    } catch {
        return []
    }
}

function write(alerts: HistoricalAlert[]): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
}

export function recordHistoricalAlerts(
    cityId: string,
    cityName: string,
    alerts: Array<{
        id: string
        type: AlertType
        severity: AlertSeverity
        title: string
        value: number
        unit: string
    }>,
): void {
    if (alerts.length === 0) {
        return
    }

    const existing = read()
    const existingIds = new Set(existing.map((a) => `${a.cityId}:${a.id}`))
    const now = Date.now()

    const newEntries: HistoricalAlert[] = alerts
        .filter((alert) => !existingIds.has(`${cityId}:${alert.id}`))
        .map((alert) => ({
            id: alert.id,
            cityId,
            cityName,
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            value: alert.value,
            unit: alert.unit,
            seenAt: now,
        }))

    const merged = [...newEntries, ...existing].slice(0, MAX_HISTORY)
    write(merged)
}

export function readAlertHistory(): HistoricalAlert[] {
    return read()
}

export function clearAlertHistory(): void {
    write([])
}
