import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertsPanel } from '../components/AlertsPanel'
import { AlertPreferencesPanel } from '../components/AlertPreferencesPanel'
import { AuthPanel } from '../components/AuthPanel'
import { ComparePanel } from '../components/ComparePanel'
import { GamificationPanel } from '../components/GamificationPanel'
import { XpToast } from '../components/XpToast'
import { useXpToasts } from '../hooks/useXpToasts'
import { IndiaMapView } from '../components/IndiaMapView'
import { findDistrictOverlayByCityId } from '../data/indiaOverlays'
import { generateRealtimeAlerts, realtimeAlertThresholds } from '../services/alertEngine'
import {
  clearStoredAuthToken,
  fetchUserAlertPreferences,
  fetchCurrentUser,
  getStoredAuthToken,
  loginUser,
  registerUser,
  storeAuthToken,
  updateUserAlertPreferences,
} from '../services/backendApi'
import {
  readState,
  recordAlertsViewed,
  recordCityPinned,
  recordCityVisit,
  recordCompareUsed,
  recordSession,
} from '../services/gamificationStore'
import type { GamificationState } from '../services/gamificationStore'
import type { AlertPreferences, AlertSeverity, AuthUser, OverlayMetric, RealtimeAlert } from '../types/climate'
import { CitySelector } from '../components/CitySelector'
import { ForecastTable } from '../components/ForecastTable'
import { MetricCard } from '../components/MetricCard'
import { allClimateCities } from '../data/indiaCities'
import { fetchClimateSnapshot } from '../services/climateApi'
import type { MetricTone } from '../components/MetricCard'
import type { ClimateSnapshot } from '../types/climate'

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

const AUTO_REFRESH_SECONDS = 90
const FAVORITE_CITIES_STORAGE_KEY = 'india-climate-favorite-cities'

const defaultAlertPreferences: AlertPreferences = {
  minSeverity: 'watch',
  enabledTypes: ['heatwave', 'flood', 'air-quality'],
}

function readFavoriteCityIds(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(FAVORITE_CITIES_STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return [...new Set(parsed)].filter((value) => typeof value === 'string')
  } catch {
    return []
  }
}

function severityRank(severity: AlertSeverity): number {
  if (severity === 'emergency') {
    return 3
  }

  if (severity === 'warning') {
    return 2
  }

  return 1
}

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
  const [selectedCityId, setSelectedCityId] = useState(allClimateCities[0].id)
  const [favoriteCityIds, setFavoriteCityIds] = useState<string[]>(() => readFavoriteCityIds())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Gamification
  const [gamifState, setGamifState] = useState<GamificationState>(() => readState())
  const { toasts, pushEvent, dismiss } = useXpToasts()
  const compareModeUsedRef = useRef(false)
  const [snapshot, setSnapshot] = useState<ClimateSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshToken, setRefreshToken] = useState(0)
  const [secondsToRefresh, setSecondsToRefresh] = useState(AUTO_REFRESH_SECONDS)

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false)
  const [compareCityId, setCompareCityId] = useState(
    () => allClimateCities[1]?.id ?? allClimateCities[0].id,
  )
  const [compareSnapshot, setCompareSnapshot] = useState<ClimateSnapshot | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)

  // Map overlay state
  const [overlayMetric, setOverlayMetric] = useState<OverlayMetric>('heat')
  const [showStateOverlay, setShowStateOverlay] = useState(true)
  const [showDistrictOverlay, setShowDistrictOverlay] = useState(true)

  // Alerts state
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([])
  const [isCityTransitioning, setIsCityTransitioning] = useState(false)
  const [transitionRoute, setTransitionRoute] = useState<string | null>(null)

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [alertPreferences, setAlertPreferences] =
    useState<AlertPreferences>(defaultAlertPreferences)
  const [prefLoading, setPrefLoading] = useState(false)
  const [prefSaving, setPrefSaving] = useState(false)
  const [prefError, setPrefError] = useState<string | null>(null)

  const selectedCity = useMemo(
    () => allClimateCities.find((city) => city.id === selectedCityId) ?? allClimateCities[0],
    [selectedCityId],
  )

  const favoriteCities = useMemo(
    () => allClimateCities.filter((city) => favoriteCityIds.includes(city.id)),
    [favoriteCityIds],
  )

  const selectorCities = showFavoritesOnly ? favoriteCities : allClimateCities
  const previousCityRef = useRef(selectedCity)

  const isIndiaCity = selectedCity.regionGroup === 'india'

  const districtOverlay = useMemo(
    () => findDistrictOverlayByCityId(selectedCityId),
    [selectedCityId],
  )

  const visibleAlerts = useMemo(() => {
    if (!authUser) {
      return alerts
    }

    const minimumRank = severityRank(alertPreferences.minSeverity)

    return alerts.filter(
      (alert) =>
        alertPreferences.enabledTypes.includes(alert.type) &&
        severityRank(alert.severity) >= minimumRank,
    )
  }, [alerts, alertPreferences, authUser])

  const alertSummary = useMemo(
    () => ({
      total: visibleAlerts.length,
      severe: visibleAlerts.filter((alert) => alert.severity !== 'watch').length,
      emergency: visibleAlerts.filter((alert) => alert.severity === 'emergency').length,
    }),
    [visibleAlerts],
  )

  const hiddenAlertCount = Math.max(0, alerts.length - visibleAlerts.length)

  useEffect(() => {
    const previousCity = previousCityRef.current

    if (previousCity.id === selectedCity.id) {
      return
    }

    setTransitionRoute(`${previousCity.name} to ${selectedCity.name}`)
    setIsCityTransitioning(true)
    previousCityRef.current = selectedCity

    const timer = window.setTimeout(() => {
      setIsCityTransitioning(false)
    }, 850)

    return () => {
      window.clearTimeout(timer)
    }
  }, [selectedCity])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsToRefresh((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (secondsToRefresh === 0) {
      setRefreshToken((value) => value + 1)
      setSecondsToRefresh(AUTO_REFRESH_SECONDS)
    }
  }, [secondsToRefresh])

  useEffect(() => {
    setSecondsToRefresh(AUTO_REFRESH_SECONDS)
  }, [selectedCityId])

  useEffect(() => {
    if (!compareMode) {
      return
    }

    let isCancelled = false

    async function loadCompareSnapshot() {
      const city = allClimateCities.find((c) => c.id === compareCityId)

      if (!city) {
        return
      }

      setCompareLoading(true)

      const result = await fetchClimateSnapshot(city)

      if (!isCancelled) {
        setCompareSnapshot(result)
        setCompareLoading(false)
      }
    }

    void loadCompareSnapshot()

    return () => {
      isCancelled = true
    }
  }, [compareMode, compareCityId, refreshToken])

  useEffect(() => {
    window.localStorage.setItem(FAVORITE_CITIES_STORAGE_KEY, JSON.stringify(favoriteCityIds))
  }, [favoriteCityIds])

  // Record session on mount (handles daily streak + first-look badge)
  useEffect(() => {
    const event = recordSession()
    setGamifState(readState())
    pushEvent(event)
    // record first city visit too
    const firstCity = allClimateCities[0]
    const visitEvent = recordCityVisit(firstCity.id, firstCity.regionGroup === 'international')
    setGamifState(readState())
    pushEvent(visitEvent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!showFavoritesOnly) {
      return
    }

    if (favoriteCities.length === 0) {
      return
    }

    const isSelectedVisible = favoriteCities.some((city) => city.id === selectedCityId)

    if (!isSelectedVisible) {
      setSelectedCityId(favoriteCities[0].id)
    }
  }, [favoriteCities, selectedCityId, showFavoritesOnly])

  useEffect(() => {
    let isCancelled = false

    async function loadClimateSnapshot() {
      setIsLoading(true)

      const result = await fetchClimateSnapshot(selectedCity)

      if (!isCancelled) {
        setSnapshot(result)
        const nextAlerts = generateRealtimeAlerts(result, selectedCity, districtOverlay)
        setAlerts(nextAlerts)
        setIsLoading(false)

        // XP for viewing alerts (capped per city load)
        const alertEvent = recordAlertsViewed(nextAlerts.length)
        setGamifState(readState())
        pushEvent(alertEvent)
      }
    }

    void loadClimateSnapshot()

    return () => {
      isCancelled = true
    }
  }, [selectedCity, districtOverlay, pushEvent, refreshToken])

  // Restore auth session from stored token on mount
  useEffect(() => {
    const token = getStoredAuthToken()

    if (!token) {
      return
    }

    setPrefLoading(true)

    fetchCurrentUser(token)
      .then((user) => {
        setAuthUser(user)
        setAlertPreferences(user.alertPreferences)
        return fetchUserAlertPreferences(token)
      })
      .then((preferences) => {
        setAlertPreferences(preferences)
      })
      .catch(() => clearStoredAuthToken())
      .finally(() => {
        setPrefLoading(false)
      })
  }, [])

  async function handleLogin(email: string, password: string) {
    setAuthLoading(true)
    setAuthError(null)

    try {
      const session = await loginUser(email, password)
      storeAuthToken(session.token)
      setAuthUser(session.user)
      setAlertPreferences(session.user.alertPreferences)
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
      setAlertPreferences(session.user.alertPreferences)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    clearStoredAuthToken()
    setAuthUser(null)
    setAlertPreferences(defaultAlertPreferences)
    setPrefError(null)
  }

  async function handleSaveAlertPreferences(nextPreferences: AlertPreferences) {
    const token = getStoredAuthToken()

    if (!token || !authUser) {
      setPrefError('Sign in again to update alert preferences.')
      return
    }

    setPrefSaving(true)
    setPrefError(null)

    try {
      const updated = await updateUserAlertPreferences(token, nextPreferences)
      setAlertPreferences(updated)
      setAuthUser({
        ...authUser,
        alertPreferences: updated,
      })
    } catch (err) {
      setPrefError(err instanceof Error ? err.message : 'Unable to save preferences')
    } finally {
      setPrefSaving(false)
    }
  }

  function handleManualRefresh() {
    setRefreshToken((value) => value + 1)
    setSecondsToRefresh(AUTO_REFRESH_SECONDS)
  }

  function handleToggleFavoriteCity(cityId: string) {
    setFavoriteCityIds((current) => {
      const isPinning = !current.includes(cityId)

      if (isPinning) {
        const event = recordCityPinned()
        setGamifState(readState())
        pushEvent(event)
        return [...current, cityId]
      }

      return current.filter((id) => id !== cityId)
    })
  }

  const handleCitySelect = useCallback(
    (cityId: string) => {
      setSelectedCityId(cityId)
      const city = allClimateCities.find((c) => c.id === cityId)

      if (city) {
        const event = recordCityVisit(cityId, city.regionGroup === 'international')
        setGamifState(readState())
        pushEvent(event)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  function handleToggleCompareMode() {
    setCompareMode((current) => {
      const turning = !current

      if (turning && !compareModeUsedRef.current) {
        compareModeUsedRef.current = true
        const event = recordCompareUsed()
        setGamifState(readState())
        pushEvent(event)
      }

      return turning
    })
  }

  const updatedAt = snapshot
    ? new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(snapshot.lastUpdated))
    : ''

  return (
    <main className={`dashboard-shell ${isCityTransitioning ? 'is-city-transitioning' : ''}`}>
      <div className="backdrop-glow backdrop-glow--one" aria-hidden="true" />
      <div className="backdrop-glow backdrop-glow--two" aria-hidden="true" />
      <div
        className={`city-transition-veil ${isCityTransitioning ? 'is-active' : ''}`}
        aria-hidden="true"
      >
        <span>{transitionRoute ? `Reframing climate feed: ${transitionRoute}` : ''}</span>
      </div>

      <section className="hero-panel reveal delay-1">
        <div className="hero-headline-row">
          <p className="eyebrow">Climate command center</p>
          <span
            className={`live-pill ${snapshot?.dataSource === 'fallback' ? 'is-fallback' : ''}`}
          >
            <span className="live-pill__dot" aria-hidden="true" />
            {snapshot?.dataSource === 'fallback' ? 'Fallback mode' : 'Live mode'}
          </span>
        </div>

        <div className="hero-layout">
          <div className="hero-copy">
            <h1>Climate Pulse Atlas</h1>
            <p className="hero-text">
              A live climate command center for Indian hotspots and international city
              monitoring in one place.
            </p>

            <div className="pulse-band" aria-live="polite">
              <div className="pulse-band__item">
                <strong>{alertSummary.total}</strong>
                <span>active alerts</span>
              </div>

              <div className="pulse-band__item">
                <strong>{alertSummary.severe}</strong>
                <span>high priority</span>
              </div>

              <div className="pulse-band__item">
                <strong>{secondsToRefresh}s</strong>
                <span>next sync</span>
              </div>

              <button
                type="button"
                className="refresh-now-btn"
                onClick={handleManualRefresh}
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh now'}
              </button>
            </div>
          </div>

          <aside className="signal-stage" aria-hidden="true">
            <div className="signal-stage__halo signal-stage__halo--outer" />
            <div className="signal-stage__halo signal-stage__halo--middle" />
            <div className="signal-stage__halo signal-stage__halo--inner" />

            <div className="signal-stage__core">
              <span>{selectedCity.name}</span>
              <strong>{snapshot ? `${snapshot.currentTempC.toFixed(1)}°` : '--'}</strong>
              <small>{snapshot ? `${snapshot.aqiLabel} air` : 'Loading pulse'}</small>
            </div>

            <div className="signal-stage__tag signal-stage__tag--one">{selectedCity.country}</div>
            <div className="signal-stage__tag signal-stage__tag--two">
              {snapshot ? snapshot.riskLevel : 'Monitoring'}
            </div>
            <div className="signal-stage__tag signal-stage__tag--three">
              {isIndiaCity ? 'Overlay grid' : 'Global focus'}
            </div>
          </aside>
        </div>

        <div className="climate-ticker" aria-hidden="true">
          <div className="climate-ticker__track">
            <span>Heat corridors</span>
            <span>{selectedCity.name}</span>
            <span>{selectedCity.country}</span>
            <span>{selectedCity.climateZone}</span>
            <span>
              {snapshot ? `${snapshot.pm25.toFixed(1)} ug/m3 PM2.5` : 'Syncing air indicators'}
            </span>
            <span>
              {snapshot
                ? `${snapshot.windSpeedKmh.toFixed(1)} km/h wind stream`
                : 'Syncing wind stream'}
            </span>
            <span>Heat corridors</span>
            <span>{selectedCity.name}</span>
            <span>{selectedCity.country}</span>
            <span>{selectedCity.climateZone}</span>
            <span>
              {snapshot ? `${snapshot.pm25.toFixed(1)} ug/m3 PM2.5` : 'Syncing air indicators'}
            </span>
            <span>
              {snapshot
                ? `${snapshot.windSpeedKmh.toFixed(1)} km/h wind stream`
                : 'Syncing wind stream'}
            </span>
          </div>
        </div>

        <div className="controls-row">
          <CitySelector
            cities={selectorCities}
            selectedCityId={selectedCityId}
            favoriteCityIds={favoriteCityIds}
            showFavoritesOnly={showFavoritesOnly}
            onSelectCity={handleCitySelect}
            onToggleFavorite={handleToggleFavoriteCity}
            onShowFavoritesOnlyChange={setShowFavoritesOnly}
          />

          <div className="compare-controls">
            <button
              type="button"
              className={`compare-toggle-btn ${compareMode ? 'is-active' : ''}`}
              onClick={handleToggleCompareMode}
            >
              {compareMode ? 'Exit compare' : 'Compare cities'}
            </button>

            {compareMode ? (
              <label className="compare-city-select-label">
                <span>Compare with</span>
                <select
                  className="compare-city-select"
                  value={compareCityId}
                  onChange={(event) => {
                    setCompareCityId(event.target.value)
                    setCompareSnapshot(null)
                  }}
                >
                  {allClimateCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}, {city.country}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="city-meta">
            <span>{selectedCity.country}</span>
            <span>{selectedCity.state}</span>
            <span>{selectedCity.climateZone}</span>
            <span>Seasonal window: {selectedCity.monsoonWindow}</span>
            <span>{isIndiaCity ? 'India overlays enabled' : 'Global city mode'}</span>
          </div>
        </div>

        {snapshot ? (
          <p className="status-line">
            Source: {sourceLabel(snapshot.dataSource)} | Updated: {updatedAt} | Emergency
            alerts: {alertSummary.emergency}
            {authUser && hiddenAlertCount > 0
              ? ` | Filtered by your preferences: ${hiddenAlertCount}`
              : ''}
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

      {compareMode ? (
        <section className="compare-section reveal delay-2">
          <ComparePanel
            primaryCity={selectedCity}
            primarySnapshot={snapshot}
            compareCity={
              allClimateCities.find((city) => city.id === compareCityId) ?? allClimateCities[1]
            }
            compareSnapshot={compareSnapshot}
            isPrimaryLoading={isLoading}
            isCompareLoading={compareLoading}
          />
        </section>
      ) : null}

      <section className="map-section reveal delay-3">
        <IndiaMapView
          selectedCity={selectedCity}
          overlayMetric={overlayMetric}
          showStateOverlay={showStateOverlay}
          showDistrictOverlay={showDistrictOverlay}
          isTransitioning={isCityTransitioning}
          transitionLabel={transitionRoute}
          onOverlayMetricChange={setOverlayMetric}
          onToggleStateOverlay={setShowStateOverlay}
          onToggleDistrictOverlay={setShowDistrictOverlay}
        />
      </section>

      <section className="bottom-grid reveal delay-3">
        <AlertsPanel
          alerts={visibleAlerts}
          isLoading={isLoading}
          cityName={selectedCity.name}
          thresholds={realtimeAlertThresholds}
          isTransitioning={isCityTransitioning}
          transitionLabel={transitionRoute}
        />

        <div className="account-stack">
          <GamificationPanel state={gamifState} />

          <AlertPreferencesPanel
            user={authUser}
            preferences={alertPreferences}
            isLoading={prefLoading}
            isSaving={prefSaving}
            error={prefError}
            onSave={handleSaveAlertPreferences}
          />

          <AuthPanel
            user={authUser}
            isLoading={authLoading}
            error={authError}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onLogout={handleLogout}
          />
        </div>
      </section>
      <XpToast toasts={toasts} onDismiss={dismiss} />
    </main>
  )
}
