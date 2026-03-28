import type { ReactNode } from 'react'

export type MetricTone = 'heat' | 'air' | 'wind' | 'water' | 'risk'

interface MetricCardProps {
  label: string
  value: string
  unit: string
  tone: MetricTone
  sparkline?: ReactNode
}

export function MetricCard({ label, value, unit, tone, sparkline }: MetricCardProps) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">
        <span>{value}</span>
        <small>{unit}</small>
      </p>
      {sparkline ? <div className="metric-card__sparkline">{sparkline}</div> : null}
    </article>
  )
}
