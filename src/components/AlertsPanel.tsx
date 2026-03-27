import { useMemo } from 'react'
import type { AlertThresholdConfig, RealtimeAlert } from '../types/climate'

interface AlertsPanelProps {
  alerts: RealtimeAlert[]
  isLoading: boolean
  cityName: string
  thresholds: AlertThresholdConfig[]
  isTransitioning: boolean
  transitionLabel: string | null
}

function titleCase(alertType: RealtimeAlert['type']): string {
  if (alertType === 'air-quality') {
    return 'Air quality'
  }

  if (alertType === 'heatwave') {
    return 'Heatwave'
  }

  return 'Flood'
}

function severityLabel(severity: RealtimeAlert['severity']): string {
  if (severity === 'emergency') {
    return 'Emergency'
  }

  if (severity === 'warning') {
    return 'Warning'
  }

  return 'Watch'
}

function severityRank(severity: RealtimeAlert['severity']): number {
  if (severity === 'emergency') {
    return 3
  }

  if (severity === 'warning') {
    return 2
  }

  return 1
}

function formatDeskTime(input: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(input))
}

export function AlertsPanel({
  alerts,
  isLoading,
  cityName,
  thresholds,
  isTransitioning,
  transitionLabel,
}: AlertsPanelProps) {
  const sortedAlerts = useMemo(
    () =>
      [...alerts].sort((left, right) => {
        const severityDiff = severityRank(right.severity) - severityRank(left.severity)

        if (severityDiff !== 0) {
          return severityDiff
        }

        return (
          new Date(right.triggeredAt).getTime() - new Date(left.triggeredAt).getTime()
        )
      }),
    [alerts],
  )

  const severityCounts = useMemo(
    () => ({
      emergency: alerts.filter((alert) => alert.severity === 'emergency').length,
      warning: alerts.filter((alert) => alert.severity === 'warning').length,
      watch: alerts.filter((alert) => alert.severity === 'watch').length,
    }),
    [alerts],
  )

  const latestDeskStamp = sortedAlerts[0]?.triggeredAt

  return (
    <article className={`panel panel-alerts ${isTransitioning ? 'is-city-transitioning' : ''}`}>
      <h2>Real alerts</h2>
      <p className="alerts-subhead">
        Active threshold checks for {cityName}: heatwave, flood, and air quality.
      </p>

      <div className="alerts-newsdesk">
        <div className="alerts-newsdesk__copy">
          <span className="alerts-newsdesk__label">Newsdesk live</span>
          <strong>{alerts.length} active bulletins</strong>
          <small>
            {latestDeskStamp ? `Updated ${formatDeskTime(latestDeskStamp)}` : 'Awaiting next bulletin'}
          </small>
        </div>

        <div className="alerts-severity-strip" role="list" aria-label="Alert severity tally">
          <span className="alerts-severity-chip is-emergency" role="listitem">
            E {severityCounts.emergency}
          </span>
          <span className="alerts-severity-chip is-warning" role="listitem">
            W {severityCounts.warning}
          </span>
          <span className="alerts-severity-chip is-watch" role="listitem">
            C {severityCounts.watch}
          </span>
        </div>
      </div>

      {transitionLabel ? (
        <p className="alerts-route-line" aria-live="polite">
          Switching briefing lane: {transitionLabel}
        </p>
      ) : null}

      <div className="threshold-strip" role="list">
        {thresholds.map((threshold) => (
          <div key={threshold.type} role="listitem" className="threshold-pill">
            <span>{titleCase(threshold.type)}</span>
            <small>
              W {threshold.watch}
              {threshold.unit} | A {threshold.warning}
              {threshold.unit} | E {threshold.emergency}
              {threshold.unit}
            </small>
          </div>
        ))}
      </div>

      {isLoading ? <p className="panel-note">Evaluating threshold triggers...</p> : null}

      {!isLoading && alerts.length === 0 ? (
        <p className="panel-note">No active threshold alerts in this monitoring cycle.</p>
      ) : null}

      {!isLoading && sortedAlerts.length > 0 ? (
        <ol className="alerts-timeline">
          {sortedAlerts.map((alert) => (
            <li key={alert.id} className={`alert-item alert-${alert.severity}`}>
              <div className="alerts-timeline__rail" aria-hidden="true" />
              <div className="alerts-timeline__stamp">{formatDeskTime(alert.triggeredAt)}</div>

              <div className="alerts-timeline__body">
                <div className="alert-item__header">
                  <h3>{alert.title}</h3>
                  <span>{severityLabel(alert.severity)}</span>
                </div>

                <p>{alert.message}</p>

                <p className="alert-item__meta">
                  Current: {alert.value}
                  {alert.unit} | Trigger: {alert.threshold}
                  {alert.unit}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  )
}
