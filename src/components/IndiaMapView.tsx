import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import { districtOverlays, stateOverlays } from '../data/indiaOverlays'
import type { IndiaCity, OverlayMetric } from '../types/climate'

interface IndiaMapViewProps {
  selectedCity: IndiaCity
  overlayMetric: OverlayMetric
  showStateOverlay: boolean
  showDistrictOverlay: boolean
  isTransitioning: boolean
  transitionLabel: string | null
  onOverlayMetricChange: (metric: OverlayMetric) => void
  onToggleStateOverlay: (visible: boolean) => void
  onToggleDistrictOverlay: (visible: boolean) => void
}

function toStateId(state: string): string {
  return state.toLowerCase().replace(/\s+/g, '-')
}

function scoreToColor(score: number): string {
  if (score < 30) {
    return '#5ea562'
  }

  if (score < 55) {
    return '#d4b840'
  }

  if (score < 75) {
    return '#df7d34'
  }

  return '#c74633'
}

function metricLabel(metric: OverlayMetric): string {
  if (metric === 'heat') {
    return 'Heat pressure'
  }

  if (metric === 'flood') {
    return 'Flood pressure'
  }

  return 'Air quality pressure'
}

function FlyToCity({
  latitude,
  longitude,
  zoom,
}: {
  latitude: number
  longitude: number
  zoom: number
}) {
  const map = useMap()

  useEffect(() => {
    map.flyTo([latitude, longitude], zoom, { duration: 0.9 })
  }, [latitude, longitude, map, zoom])

  return null
}

export function IndiaMapView({
  selectedCity,
  overlayMetric,
  showStateOverlay,
  showDistrictOverlay,
  isTransitioning,
  transitionLabel,
  onOverlayMetricChange,
  onToggleStateOverlay,
  onToggleDistrictOverlay,
}: IndiaMapViewProps) {
  const selectedStateId = toStateId(selectedCity.state)
  const isIndiaCity = selectedCity.regionGroup === 'india'
  const targetZoom = isIndiaCity ? 6 : 7

  return (
    <article className={`panel panel-map ${isTransitioning ? 'is-city-transitioning' : ''}`}>
      <div className="panel-map__header">
        <div>
          <div className="panel-map__title-row">
            <h2>{isIndiaCity ? 'India map view' : 'Global city spotlight'}</h2>
            <span className={`panel-map__badge ${isIndiaCity ? 'is-india' : 'is-global'}`}>
              {isIndiaCity ? 'State + district overlays' : 'Global focus mode'}
            </span>
          </div>
          <p className="panel-map__subhead">
            {isIndiaCity
              ? 'State and district overlays for hotspot scanning'
              : `Focused climate view for ${selectedCity.name}, ${selectedCity.country}. Select an Indian city to unlock administrative overlays.`}
          </p>
        </div>

        {isIndiaCity ? (
          <div className="map-filter">
            <label htmlFor="overlayMetric">Metric</label>
            <select
              id="overlayMetric"
              value={overlayMetric}
              onChange={(event) =>
                onOverlayMetricChange(event.target.value as OverlayMetric)
              }
            >
              <option value="heat">Heatwave</option>
              <option value="flood">Flood</option>
              <option value="air">Air quality</option>
            </select>
          </div>
        ) : (
          <p className="map-mode-note">Global mode keeps the city focus and live marker only.</p>
        )}
      </div>

      {isIndiaCity ? (
        <div className="map-toggle-row">
          <label>
            <input
              type="checkbox"
              checked={showStateOverlay}
              onChange={(event) => onToggleStateOverlay(event.target.checked)}
            />
            State overlays
          </label>

          <label>
            <input
              type="checkbox"
              checked={showDistrictOverlay}
              onChange={(event) => onToggleDistrictOverlay(event.target.checked)}
            />
            District overlays
          </label>
        </div>
      ) : null}

      <div
        className={`map-radar-frame ${isIndiaCity ? 'is-india' : 'is-global'} ${
          isTransitioning ? 'is-transitioning' : ''
        }`}
      >
        <div className="map-radar-head">
          <span className="map-radar-pill">Radar sweep</span>
          <span className="map-radar-head__meta">
            {isIndiaCity ? metricLabel(overlayMetric) : 'Global pressure watch'}
          </span>
          {transitionLabel ? (
            <span className="map-radar-head__route">Routing {transitionLabel}</span>
          ) : null}
        </div>

        <div className="map-radar-layer map-radar-layer--rings" aria-hidden="true" />
        <div className="map-radar-layer map-radar-layer--sweep" aria-hidden="true" />
        <div className="map-radar-layer map-radar-layer--scanline" aria-hidden="true" />

        <div className="map-wrap" role="region" aria-label="Climate map with overlays">
          <MapContainer
            center={[22.45, 79.35]}
            zoom={5}
            minZoom={2}
            maxZoom={12}
            scrollWheelZoom={false}
            className="india-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FlyToCity
              latitude={selectedCity.latitude}
              longitude={selectedCity.longitude}
              zoom={targetZoom}
            />

            {isIndiaCity && showStateOverlay
              ? stateOverlays.map((overlay) => {
                  const score = overlay.metrics[overlayMetric]
                  const isSelected = overlay.stateId === selectedStateId

                  return (
                    <Polygon
                      key={overlay.id}
                      positions={overlay.coordinates}
                      pathOptions={{
                        color: isSelected ? '#0d5b60' : '#215f63',
                        fillColor: scoreToColor(score),
                        fillOpacity: isSelected ? 0.43 : 0.28,
                        weight: isSelected ? 2.2 : 1.3,
                      }}
                    >
                      <Tooltip sticky>
                        {overlay.name} | {metricLabel(overlayMetric)}: {score}/100
                      </Tooltip>
                    </Polygon>
                  )
                })
              : null}

            {isIndiaCity && showDistrictOverlay
              ? districtOverlays.map((overlay) => {
                  const score = overlay.metrics[overlayMetric]
                  const isSelected = overlay.cityId === selectedCity.id

                  return (
                    <Polygon
                      key={overlay.id}
                      positions={overlay.coordinates}
                      pathOptions={{
                        color: isSelected ? '#7a2e1f' : '#8f4f39',
                        fillColor: scoreToColor(score),
                        fillOpacity: isSelected ? 0.56 : 0.4,
                        weight: isSelected ? 2.1 : 1,
                        dashArray: isSelected ? undefined : '3 4',
                      }}
                    >
                      <Tooltip sticky>
                        {overlay.name} | {metricLabel(overlayMetric)}: {score}/100
                      </Tooltip>
                    </Polygon>
                  )
                })
              : null}

            <CircleMarker
              center={[selectedCity.latitude, selectedCity.longitude]}
              radius={18}
              pathOptions={{ color: '#1b6ecf', fillColor: '#1b6ecf', fillOpacity: 0.12, weight: 1 }}
            />

            <CircleMarker
              center={[selectedCity.latitude, selectedCity.longitude]}
              radius={8}
              pathOptions={{ color: '#0f3f43', fillColor: '#f7c870', fillOpacity: 0.95, weight: 2 }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>
                {selectedCity.name}
              </Tooltip>
            </CircleMarker>
          </MapContainer>
        </div>
      </div>

      <p className="map-legend">
        {isIndiaCity
          ? `${metricLabel(overlayMetric)} scale: low to severe (<30, 30-54, 55-74, 75+)`
          : 'Global focus mode highlights the selected city while preserving international climate monitoring.'}
      </p>
    </article>
  )
}
