import React from 'react'
import type { AQIData } from '../types/climate'

interface AQIPanelProps {
  aqi: AQIData | null
  isLoading?: boolean
}

export const AQIPanel: React.FC<AQIPanelProps> = ({ aqi, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="aqi-panel loading">
        <div className="aqi-spinner"></div>
        <p>Loading air quality data...</p>
      </div>
    )
  }

  if (!aqi) {
    return null
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Good':
        return '#34c38f'
      case 'Satisfactory':
        return '#63ad6f'
      case 'Moderately Polluted':
        return '#ffc107'
      case 'Poor':
        return '#ff9800'
      case 'Very Poor':
        return '#e74c3c'
      case 'Severe':
        return '#8b0000'
      default:
        return '#95a5a6'
    }
  }

  const getHealthRiskIcon = (risk: string) => {
    switch (risk) {
      case 'none':
        return '✓'
      case 'sensitive':
        return '⚠'
      case 'general':
        return '⚠⚠'
      case 'everyone':
        return '⚠⚠⚠'
      case 'severe':
        return '🚨'
      default:
        return '—'
    }
  }

  return (
    <div className="aqi-panel">
      <div className="aqi-header">
        <h3>Air Quality Index (AQI)</h3>
        <div className="aqi-score">
          <div
            className="aqi-gauge"
            style={{ backgroundColor: getCategoryColor(aqi.category) }}
          >
            {aqi.aqi}
          </div>
          <span className="aqi-category">{aqi.category}</span>
        </div>
      </div>

      <div className="aqi-health-warning">
        <span className="health-icon">{getHealthRiskIcon(aqi.healthRisk)}</span>
        <p className="health-recommendation">{aqi.recommendation}</p>
      </div>

      {aqi.affectedGroups.length > 0 && (
        <div className="aqi-affected-groups">
          <strong>At Risk:</strong>
          <ul>
            {aqi.affectedGroups.map((group) => (
              <li key={group}>{group}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="aqi-pollutants">
        <h4>Pollutant Levels</h4>
        <div className="pollutant-grid">
          {aqi.pollutants.pm25 !== null && (
            <div className="pollutant-item">
              <div className="pollutant-name">PM2.5</div>
              <div className="pollutant-value">{aqi.pollutants.pm25}</div>
              <div className="pollutant-unit">µg/m³</div>
            </div>
          )}
          {aqi.pollutants.pm10 !== null && (
            <div className="pollutant-item">
              <div className="pollutant-name">PM10</div>
              <div className="pollutant-value">{aqi.pollutants.pm10}</div>
              <div className="pollutant-unit">µg/m³</div>
            </div>
          )}
          {aqi.pollutants.no2 !== null && (
            <div className="pollutant-item">
              <div className="pollutant-name">NO₂</div>
              <div className="pollutant-value">{aqi.pollutants.no2}</div>
              <div className="pollutant-unit">ppb</div>
            </div>
          )}
          {aqi.pollutants.o3 !== null && (
            <div className="pollutant-item">
              <div className="pollutant-name">O₃</div>
              <div className="pollutant-value">{aqi.pollutants.o3}</div>
              <div className="pollutant-unit">ppb</div>
            </div>
          )}
        </div>
      </div>

      <div className="aqi-footer">
        <small>Updated: {new Date(aqi.updatedAt).toLocaleTimeString()}</small>
      </div>
    </div>
  )
}
