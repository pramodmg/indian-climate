import { useEffect, useMemo, useState } from 'react'
import { AlertsPanel } from '../components/AlertsPanel'
import { AuthPanel } from '../components/AuthPanel'
import { CitySelector } from '../components/CitySelector'
import { ForecastTable } from '../components/ForecastTable'
import { IndiaMapView } from '../components/IndiaMapView'
import { MetricCard } from '../components/MetricCard'
import { indiaCities } from '../data/indiaCities'
import { findDistrictOverlayByCityId } from '../data/indiaOverlays'
import { generateRealtimeAlerts, realtimeAlertThresholds } from '../services/alertEngine'
import {
  clearStoredAuthToken,
  fetchCurrentUser,
  getStoredAuthToken,
  loginUser,
  registerUser,
  storeAuthToken,
} from '../services/backendApi'
import { fetchClimateSnapshot } from '../services/climateApi'
import type { MetricTone } from '../components/MetricCard'
import type { AuthUser, ClimateSnapshot, OverlayMetric, RealtimeAlert } from '../types/climate'

interface PriorityItem {
  title: string
  detail: string
}

const priorities: PriorityItem[] = [
  {
    title: 'Urban heat readiness',
    detail:
      'Track high-temperature windows in dense districts and trigger ward-level cooling actions.',
  },
  {
    title: 'Monsoon resilience',
    detail:
      'Compare rain risk with local drainage capacity to flag flood-prone blocks before peak spells.',
  },
  {
    title: 'Air quality alerts',
    detail:
      'Prioritize health messaging for schools and commuters when particulate levels stay elevated.',
  },
  {
    title: 'Agriculture planning',
    detail:
      'Share practical crop-window guidance using near-term rainfall and temperature outlooks.',
  },
]

function sourceLabel(source: ClimateSnapshot['dataSource']): string {
  if (source === 'live') {
    return 'Live Open-Meteo feed'
  }

  if (source === 'backend-cache') {
    return 'Backend cached feed'
  }

  return 'Offline baseline estimate'
}

function metricCards(snapshot: ClimateSnapshot): Array<{
  label: string
  value: string
  unit: string
  tone: MetricTone
}> {
  return [
    {
      label: 'Temperature',
      value: snapshot.currentTempC.toFixed(1),
      unit: 'C',
      tone: 'heat',
    },
    {
      label: 'Feels like',
      value: snapshot.feelsLikeC.toFixed(1),
      unit: 'C',
      tone: 'heat',
    },
    {
      label: 'Humidity',
      value: String(snapshot.humidity),
      unit: '%',
      tone: 'water',
    },
    {
      label: 'Wind speed',
      value: snapshot.windSpeedKmh.toFixed(1),
      unit: 'km/h',
      tone: 'wind',
    },
    {
      label: 'Rainfall',
      value: snapshot.precipitationMm.toFixed(1),
      unit: 'mm',
      tone: 'water',
    },
    {
      label: 'PM2.5 level',
      value: snapshot.pm25.toFixed(1),
      unit: 'ug/m3',
      tone: 'air',
    },
    {
      label: 'Air quality',
      value: snapshot.aqiLabel,
      unit: '',
      tone: 'air',
    },
    {
      label: 'Risk level',
      value: snapshot.riskLevel,
      unit: '',
      tone: 'risk',
    },
  ]
}

export default function ClimateDashboard() {
  const [selectedCityId, setSelectedCityId] = useState(indiaCities[0].id)
  const [snapshot, setSnapshot] = useState<ClimateSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Map overlay state
  const [overlayMetric, setOverlayMetric] = useState<OverlayMetric>('heat')
  const [showStateOverlay, setShowStateOverlay] = useState(true)
  const [showDistrictOverlay, setShowDistrictOverlay] = useState(true)

  // Alerts state
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([])

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const selectedCity = useMemo(
    () => indiaCities.find((city) => city.id === selectedCityId) ?? indiaCities[0],
    [selectedCityId],
  )

  const districtOverlay = useMemo(
    () => findDistrictOverlayByCityId(selectedCityId),
    [selectedCityId],
  )

  useEffect(() => {
    let isCancelled = false

    async function loadClimateSnapshot() {
      setIsLoading(true)

      const result = await fetchClimateSnapshot(selectedCity)

      if (!isCancelled) {
        setSnapshot(result)
        setAlerts(generateRealtimeAlerts(result, selectedCity, districtOverlay))
        setIsLoading(false)
      }
    }

    void loadClimateSnapshot()

    return () => {
      isCancelled = true
    }
  }, [selectedCity, districtOverlay])

  // Restore auth session from stored token on mount
  useEffect(() => {
    const token = getStoredAuthToken()

    if (!token) {
      return
    }

    fetchCurrentUser(token)
      .then((user) => setAuthUser(user))
      .catch(() => clearStoredAuthToken())
  }, [])

  async function handleLogin(email: string, password: string) {
    setAuthLoading(true)
    setAuthError(null)

    try {
      const session = await loginUser(email, password)
      storeAuthToken(session.token)
      setAuthUser(session.user)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleRegister(name: string, email: string, password: string) {
    setAuthLoading(true)
    setAuthError(null)

    try {
      const session = await registerUser(name, email, password)
      storeAuthToken(session.token)
      setAuthUser(session.user)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    clearStoredAuthToken()
    setAuthUser(null)
  }

  const updatedAt = snapshot
    ? new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(snapshot.lastUpdated))
    : ''

  return (
    <main className="dashboard-shell">
      <div className="backdrop-glow backdrop-glow--one" aria-hidden="true" />
      <div className="backdrop-glow backdrop-glow--two" aria-hidden="true" />

      <section className="hero-panel reveal delay-1">
        <p className="eyebrow">Climate intelligence for India</p>
        <h1>India Climate Pulse</h1>
        <p className="hero-text">
          A starter workspace for turning climate data into city-level planning
          insights across India.
        </p>

        <div className="controls-row">
          <CitySelector
            cities={indiaCities}
            selectedCityId={selectedCityId}
            onSelectCity={setSelectedCityId}
          />

          <div className="city-meta">
            <span>{selectedCity.state}</span>
            <span>{selectedCity.climateZone}</span>
            <span>Monsoon: {selectedCity.monsoonWindow}</span>
          </div>
        </div>

        {snapshot ? (
          <p className="status-line">
            Source: {sourceLabel(snapshot.dataSource)} | Updated: {updatedAt}
          </p>
        ) : null}
      </section>

      <section className="metrics-grid reveal delay-2" aria-live="polite">
        {isLoading && <p className="panel-note">Loading climate indicators...</p>}

        {!isLoading && snapshot
          ? metricCards(snapshot).map((card) => (
              <MetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                unit={card.unit}
                tone={card.tone}
              />
            ))
          : null}
      </section>

      <section className="content-grid reveal delay-3">
        <article className="panel">
          <h2>3-day outlook</h2>
          {snapshot ? (
            <ForecastTable days={snapshot.nextThreeDays} />
          ) : (
            <p className="panel-note">Preparing forecast...</p>
          )}
        </article>

        <article className="panel">
          <h2>Adaptation checklist</h2>
          <ul className="priority-list">
            {priorities.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="map-section reveal delay-3">
        <IndiaMapView
          selectedCity={selectedCity}
          overlayMetric={overlayMetric}
          showStateOverlay={showStateOverlay}
          showDistrictOverlay={showDistrictOverlay}
          onOverlayMetricChange={setOverlayMetric}
          onToggleStateOverlay={setShowStateOverlay}
          onToggleDistrictOverlay={setShowDistrictOverlay}
        />
      </section>

      <section className="bottom-grid reveal delay-3">
        <AlertsPanel
          alerts={alerts}
          isLoading={isLoading}
          cityName={selectedCity.name}
          thresholds={realtimeAlertThresholds}
        />

        <AuthPanel
          user={authUser}
          isLoading={authLoading}
          error={authError}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onLogout={handleLogout}
        />
      </section>
    </main>
  )
}
