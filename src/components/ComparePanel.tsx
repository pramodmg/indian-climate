import type { ClimateSnapshot, IndiaCity } from '../types/climate'

interface ComparePanelProps {
    primaryCity: IndiaCity
    primarySnapshot: ClimateSnapshot | null
    compareCity: IndiaCity
    compareSnapshot: ClimateSnapshot | null
    isPrimaryLoading: boolean
    isCompareLoading: boolean
}

interface MetricRow {
    label: string
    primaryValue: string
    compareValue: string
    unit: string
    delta: number | null
    /** null = direction is neutral (e.g. temperature), false = lower is better (e.g. PM2.5) */
    lowerIsBetter: boolean | null
}

function buildRows(
    primary: ClimateSnapshot,
    compare: ClimateSnapshot,
): MetricRow[] {
    return [
        {
            label: 'Temperature',
            primaryValue: primary.currentTempC.toFixed(1),
            compareValue: compare.currentTempC.toFixed(1),
            unit: '°C',
            delta: compare.currentTempC - primary.currentTempC,
            lowerIsBetter: null,
        },
        {
            label: 'Feels like',
            primaryValue: primary.feelsLikeC.toFixed(1),
            compareValue: compare.feelsLikeC.toFixed(1),
            unit: '°C',
            delta: compare.feelsLikeC - primary.feelsLikeC,
            lowerIsBetter: null,
        },
        {
            label: 'Humidity',
            primaryValue: String(primary.humidity),
            compareValue: String(compare.humidity),
            unit: '%',
            delta: compare.humidity - primary.humidity,
            lowerIsBetter: null,
        },
        {
            label: 'Wind speed',
            primaryValue: primary.windSpeedKmh.toFixed(1),
            compareValue: compare.windSpeedKmh.toFixed(1),
            unit: 'km/h',
            delta: compare.windSpeedKmh - primary.windSpeedKmh,
            lowerIsBetter: null,
        },
        {
            label: 'Rainfall',
            primaryValue: primary.precipitationMm.toFixed(1),
            compareValue: compare.precipitationMm.toFixed(1),
            unit: 'mm',
            delta: compare.precipitationMm - primary.precipitationMm,
            lowerIsBetter: null,
        },
        {
            label: 'PM2.5',
            primaryValue: primary.aqi.pollutants.pm25?.toFixed(1) ?? '--',
            compareValue: compare.aqi.pollutants.pm25?.toFixed(1) ?? '--',
            unit: 'µg/m³',
            delta: (primary.aqi.pollutants.pm25 && compare.aqi.pollutants.pm25) 
                ? compare.aqi.pollutants.pm25 - primary.aqi.pollutants.pm25 
                : null,
            lowerIsBetter: true,
        },
        {
            label: 'Air quality',
            primaryValue: primary.aqi.category,
            compareValue: compare.aqi.category,
            unit: '',
            delta: null,
            lowerIsBetter: null,
        },
        {
            label: 'Risk level',
            primaryValue: primary.riskLevel,
            compareValue: compare.riskLevel,
            unit: '',
            delta: null,
            lowerIsBetter: null,
        },
    ]
}

function deltaModifier(delta: number | null, lowerIsBetter: boolean | null): string {
    if (delta === null || Math.abs(delta) < 0.05) {
        return 'is-neutral'
    }

    if (lowerIsBetter === null) {
        return delta > 0 ? 'is-up' : 'is-down'
    }

    return (lowerIsBetter ? delta < 0 : delta > 0) ? 'is-better' : 'is-worse'
}

function formatDelta(delta: number | null, unit: string): string {
    if (delta === null) {
        return '—'
    }

    if (Math.abs(delta) < 0.05) {
        return '0'
    }

    const sign = delta > 0 ? '+' : ''
    return `${sign}${delta.toFixed(1)}${unit ? ` ${unit}` : ''}`
}

export function ComparePanel({
    primaryCity,
    primarySnapshot,
    compareCity,
    compareSnapshot,
    isPrimaryLoading,
    isCompareLoading,
}: ComparePanelProps) {
    const isLoading = isPrimaryLoading || isCompareLoading
    const hasData = primarySnapshot !== null && compareSnapshot !== null
    const rows = hasData ? buildRows(primarySnapshot, compareSnapshot) : []

    return (
        <article className="panel compare-panel">
            <h2>City comparison</h2>

            <div className="compare-panel__header">
                <div className="compare-city-badge compare-city-badge--primary">
                    <span className="compare-city-badge__flag">A</span>
                    <div>
                        <strong>{primaryCity.name}</strong>
                        <small>{primaryCity.country}</small>
                    </div>
                </div>

                <span className="compare-vs">vs</span>

                <div className="compare-city-badge compare-city-badge--secondary">
                    <span className="compare-city-badge__flag">B</span>
                    <div>
                        <strong>{compareCity.name}</strong>
                        <small>{compareCity.country}</small>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <p className="panel-note">Fetching comparison data...</p>
            ) : null}

            {!isLoading && hasData ? (
                <div className="compare-table" role="table" aria-label="Climate metric comparison">
                    <div className="compare-table__head" role="row">
                        <span role="columnheader">Metric</span>
                        <span role="columnheader">{primaryCity.name}</span>
                        <span role="columnheader" className="compare-table__delta-head">Δ (B−A)</span>
                        <span role="columnheader">{compareCity.name}</span>
                    </div>

                    {rows.map((row) => {
                        const mod = deltaModifier(row.delta, row.lowerIsBetter)

                        return (
                            <div key={row.label} className="compare-table__row" role="row">
                                <span className="compare-table__label" role="cell">
                                    {row.label}
                                </span>
                                <span className="compare-table__value compare-table__value--primary" role="cell">
                                    {row.primaryValue}
                                    {row.unit ? <small> {row.unit}</small> : null}
                                </span>
                                <span
                                    className={`compare-delta compare-delta--${mod}`}
                                    role="cell"
                                    aria-label={`Delta: ${formatDelta(row.delta, row.unit)}`}
                                >
                                    {formatDelta(row.delta, row.unit)}
                                </span>
                                <span className="compare-table__value compare-table__value--secondary" role="cell">
                                    {row.compareValue}
                                    {row.unit ? <small> {row.unit}</small> : null}
                                </span>
                            </div>
                        )
                    })}
                </div>
            ) : null}

            {!isLoading && !hasData ? (
                <p className="panel-note">Awaiting data for one or both cities...</p>
            ) : null}
        </article>
    )
}
