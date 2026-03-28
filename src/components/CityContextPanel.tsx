import type { CityContextDetails } from '../types/climate'

interface CityContextPanelProps {
    context: CityContextDetails | null
    isLoading: boolean
    error: string | null
    scope: 'city' | 'district'
    radiusMeters: number
    districtAvailable: boolean
    onScopeChange: (scope: 'city' | 'district') => void
    onRadiusChange: (radiusMeters: number) => void
    onExportJson: () => void
    onExportCsv: () => void
}

const radiusOptions = [1000, 1800, 3000, 5000] as const

const heatKeys = ['shop', 'food', 'office', 'healthcare'] as const

function toTitle(value: string): string {
    if (!value) {
        return value
    }

    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function buildHeatCells(count: number, maxCount: number, seed: number): number[] {
    const normalized = maxCount <= 0 ? 0 : count / maxCount
    const activeCells = Math.round(normalized * 16)
    const cells = Array.from({ length: 16 }, (_, index) => (index < activeCells ? 1 : 0))

    // Rotate cells for visual variation per category while preserving intensity.
    const shift = seed % cells.length
    return [...cells.slice(shift), ...cells.slice(0, shift)]
}

function compactNumber(value: number): string {
    return new Intl.NumberFormat('en-IN', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value)
}

export function CityContextPanel({
    context,
    isLoading,
    error,
    scope,
    radiusMeters,
    districtAvailable,
    onScopeChange,
    onRadiusChange,
    onExportJson,
    onExportCsv,
}: CityContextPanelProps) {
    return (
        <article className="panel city-context-panel">
            <h2>City context intelligence</h2>
            <p className="city-context-subhead">
                Population, built environment and commercial activity proxies for planning decisions.
            </p>

            <div className="city-context-controls">
                <label className="city-context-control">
                    <span>Scope</span>
                    <select
                        value={scope}
                        onChange={(event) => onScopeChange(event.target.value as 'city' | 'district')}
                    >
                        <option value="city">City core</option>
                        <option value="district" disabled={!districtAvailable}>
                            District
                        </option>
                    </select>
                </label>

                <label className="city-context-control">
                    <span>Radius</span>
                    <select
                        value={String(radiusMeters)}
                        onChange={(event) => onRadiusChange(Number(event.target.value))}
                    >
                        {radiusOptions.map((option) => (
                            <option key={option} value={option}>
                                {option / 1000} km
                            </option>
                        ))}
                    </select>
                </label>

                <div className="city-context-export">
                    <button type="button" onClick={onExportJson} disabled={!context}>
                        Export JSON
                    </button>
                    <button type="button" onClick={onExportCsv} disabled={!context}>
                        Export CSV
                    </button>
                </div>
            </div>

            {isLoading ? <p className="panel-note">Loading city context...</p> : null}
            {error ? <p className="auth-error">{error}</p> : null}

            {!isLoading && !error && context ? (
                <>
                    <div className="city-context-grid">
                        <div className="city-context-stat">
                            <span>Population estimate</span>
                            <strong>
                                {context.populationEstimate
                                    ? compactNumber(context.populationEstimate)
                                    : 'Unavailable'}
                            </strong>
                        </div>

                        <div className="city-context-stat">
                            <span>{context.scopeLabel} buildings (~{Math.round(context.radiusMeters / 1000)} km)</span>
                            <strong>
                                {context.buildingEstimate !== null
                                    ? new Intl.NumberFormat('en-IN').format(context.buildingEstimate)
                                    : 'Unavailable'}
                            </strong>
                        </div>

                        <div className="city-context-stat">
                            <span>Commercial places</span>
                            <strong>
                                {context.commercialPlaceCount !== null
                                    ? new Intl.NumberFormat('en-IN').format(context.commercialPlaceCount)
                                    : 'Unavailable'}
                            </strong>
                        </div>

                        <div className="city-context-stat">
                            <span>Context source</span>
                            <strong>{context.dataSource === 'live-osm' ? 'Live OSM' : 'Catalog fallback'}</strong>
                        </div>
                    </div>

                    {Object.keys(context.commercialBreakdown).length > 0 ? (
                        <div className="city-context-breakdown">
                            <p className="city-context-label">Commercial mix</p>
                            <ul>
                                {Object.entries(context.commercialBreakdown)
                                    .filter(([, count]) => count > 0)
                                    .sort(([, left], [, right]) => right - left)
                                    .slice(0, 6)
                                    .map(([label, count]) => (
                                        <li key={label}>
                                            <span>{label}</span>
                                            <strong>{count}</strong>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    ) : null}

                    <div className="city-context-tax">
                        <p className="city-context-label">Tax context</p>
                        <h3>{context.taxContext.systemType}</h3>
                        <p>{context.taxContext.note}</p>
                    </div>

                    {context.insightSummary.length > 0 ? (
                        <div className="city-context-insights">
                            <p className="city-context-label">Planning insights</p>
                            <ul>
                                {context.insightSummary.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>

                            <div className="city-context-heatmap">
                                <p className="city-context-label">Commercial intensity mini-map</p>

                                <div className="city-context-heatmap-grid" role="list" aria-label="Commercial intensity heatmap by category">
                                    {(() => {
                                        const rows = heatKeys.map((key) => ({
                                            key,
                                            value: context.commercialBreakdown[key] ?? 0,
                                        }))
                                        const maxValue = Math.max(...rows.map((row) => row.value), 1)

                                        return rows.map((row, rowIndex) => {
                                            const cells = buildHeatCells(row.value, maxValue, rowIndex * 3)

                                            return (
                                                <div key={row.key} className="city-context-heatmap-row" role="listitem">
                                                    <span className="city-context-heatmap-label">{toTitle(row.key)}</span>

                                                    <div className="city-context-heatmap-cells" aria-hidden="true">
                                                        {cells.map((cell, cellIndex) => (
                                                            <span
                                                                key={`${row.key}-${cellIndex}`}
                                                                className={`city-context-heatmap-cell ${cell ? 'is-hot' : ''}`}
                                                            />
                                                        ))}
                                                    </div>

                                                    <strong className="city-context-heatmap-value">{row.value}</strong>
                                                </div>
                                            )
                                        })
                                    })()}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </>
            ) : null}
        </article>
    )
}
