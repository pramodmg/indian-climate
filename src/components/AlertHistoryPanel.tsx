import { useMemo, useState } from 'react'
import type { HistoricalAlert } from '../services/alertHistoryStore'
import { clearAlertHistory } from '../services/alertHistoryStore'

interface AlertHistoryPanelProps {
    history: HistoricalAlert[]
    onHistoryCleared: () => void
}

const TYPE_LABEL: Record<HistoricalAlert['type'], string> = {
    heatwave: 'Heat',
    flood: 'Flood',
    'air-quality': 'Air',
}

const SEV_ORDER: Record<HistoricalAlert['severity'], number> = {
    emergency: 3,
    warning: 2,
    watch: 1,
}

function relativeTime(ts: number): string {
    const diffMs = Date.now() - ts
    const diffMin = Math.floor(diffMs / 60_000)

    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`

    const diffHr = Math.floor(diffMin / 60)

    if (diffHr < 24) return `${diffHr}h ago`

    const diffDays = Math.floor(diffHr / 24)
    return `${diffDays}d ago`
}

type FilterSeverity = 'all' | HistoricalAlert['severity']

export function AlertHistoryPanel({ history, onHistoryCleared }: AlertHistoryPanelProps) {
    const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all')
    const [filterCity, setFilterCity] = useState<string>('all')

    const uniqueCities = useMemo(() => {
        const seen = new Map<string, string>()

        for (const a of history) {
            if (!seen.has(a.cityId)) {
                seen.set(a.cityId, a.cityName)
            }
        }

        return [...seen.entries()].map(([id, name]) => ({ id, name }))
    }, [history])

    const filtered = useMemo(() => {
        return history
            .filter((a) => filterSeverity === 'all' || a.severity === filterSeverity)
            .filter((a) => filterCity === 'all' || a.cityId === filterCity)
            .sort((a, b) => b.seenAt - a.seenAt)
    }, [history, filterSeverity, filterCity])

    function handleClear() {
        clearAlertHistory()
        onHistoryCleared()
    }

    return (
        <article className="panel alert-history-panel">
            <div className="alert-history__head">
                <h2>Alert history</h2>

                {history.length > 0 ? (
                    <button type="button" className="alert-history__clear-btn" onClick={handleClear}>
                        Clear
                    </button>
                ) : null}
            </div>

            <p className="alert-history__sub">
                Every alert surfaced in this session and previous visits.
            </p>

            {history.length > 0 ? (
                <div className="alert-history__filters">
                    <select
                        className="alert-history__select"
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
                        aria-label="Filter by severity"
                    >
                        <option value="all">All severities</option>
                        <option value="emergency">Emergency</option>
                        <option value="warning">Warning</option>
                        <option value="watch">Watch</option>
                    </select>

                    {uniqueCities.length > 1 ? (
                        <select
                            className="alert-history__select"
                            value={filterCity}
                            onChange={(e) => setFilterCity(e.target.value)}
                            aria-label="Filter by city"
                        >
                            <option value="all">All cities</option>
                            {uniqueCities.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    ) : null}
                </div>
            ) : null}

            {filtered.length === 0 ? (
                <p className="panel-note">
                    {history.length === 0
                        ? 'No alerts recorded yet. Data populates as cities load.'
                        : 'No alerts match the current filter.'}
                </p>
            ) : (
                <ul className="alert-history__list" aria-label="Alert history">
                    {filtered.map((alert) => (
                        <li
                            key={`${alert.cityId}:${alert.id}:${alert.seenAt}`}
                            className={`ah-row ah-row--${alert.severity}`}
                        >
                            <span className={`ah-row__sev ah-row__sev--${alert.severity}`}>
                                {alert.severity.toUpperCase().slice(0, 1)}
                            </span>

                            <span className="ah-row__body">
                                <strong>{alert.title}</strong>
                                <span className="ah-row__meta">
                                    {TYPE_LABEL[alert.type]} · {alert.cityName} ·{' '}
                                    {alert.value.toFixed(1)}
                                    {alert.unit}
                                </span>
                            </span>

                            <span
                                className="ah-row__time"
                                title={new Date(alert.seenAt).toLocaleString('en-IN')}
                            >
                                {relativeTime(alert.seenAt)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {filtered.length > 0 ? (
                <p className="alert-history__count">
                    {filtered.length} of {history.length} total
                </p>
            ) : null}
        </article>
    )
}

export { SEV_ORDER }
