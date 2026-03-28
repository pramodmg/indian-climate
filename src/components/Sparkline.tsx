import type { SparkMetric, SparkReading } from '../services/sparklineStore'

interface SparklineProps {
    readings: SparkReading[]
    metric: SparkMetric
    width?: number
    height?: number
}

const METRIC_COLOR: Record<SparkMetric, string> = {
    temp: '#e87040',
    pm25: '#9b59b6',
    humidity: '#2980b9',
    wind: '#27ae60',
    rain: '#2471a3',
}

export function Sparkline({ readings, metric, width = 80, height = 28 }: SparklineProps) {
    if (readings.length < 2) {
        return <svg width={width} height={height} aria-hidden="true" />
    }

    const values = readings.map((r) => r.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const pad = 2
    const innerW = width - pad * 2
    const innerH = height - pad * 2

    const points = values
        .map((v, i) => {
            const x = pad + (i / (values.length - 1)) * innerW
            const y = pad + (1 - (v - min) / range) * innerH
            return `${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')

    const color = METRIC_COLOR[metric]

    // Filled area path: line down right edge, across bottom, back up left
    const firstX = pad
    const lastX = pad + innerW
    const bottomY = pad + innerH
    const areaPath = `M ${points.split(' ').join(' L ')} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            aria-hidden="true"
            className="sparkline"
        >
            <defs>
                <linearGradient id={`sg-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.03" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#sg-${metric})`} />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
