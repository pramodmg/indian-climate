import type { AlertThresholdConfig, RealtimeAlert } from '../types/climate'

interface AlertsPanelProps {
  alerts: RealtimeAlert[]
  isLoading: boolean
  cityName: string
  thresholds: AlertThresholdConfig[]
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

export function AlertsPanel({ alerts, isLoading, cityName, thresholds }: AlertsPanelProps) {
  return (
    <article className="panel panel-alerts">
      <h2>Real alerts</h2>
      <p className="alerts-subhead">
        Active threshold checks for {cityName}: heatwave, flood, and air quality.
      </p>

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

      {!isLoading && alerts.length > 0 ? (
        <ul className="alerts-list">
          {alerts.map((alert) => (
            <li key={alert.id} className={`alert-item alert-${alert.severity}`}>
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
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
