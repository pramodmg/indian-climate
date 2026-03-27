import type { IndiaCity } from '../types/climate'

interface CitySelectorProps {
  cities: IndiaCity[]
  selectedCityId: string
  favoriteCityIds: string[]
  showFavoritesOnly: boolean
  onSelectCity: (cityId: string) => void
  onToggleFavorite: (cityId: string) => void
  onShowFavoritesOnlyChange: (showOnly: boolean) => void
}

export function CitySelector({
  cities,
  selectedCityId,
  favoriteCityIds,
  showFavoritesOnly,
  onSelectCity,
  onToggleFavorite,
  onShowFavoritesOnlyChange,
}: CitySelectorProps) {
  const selectedCity = cities.find((city) => city.id === selectedCityId) ?? null
  const hasCities = cities.length > 0
  const favoriteCount = favoriteCityIds.length
  const isSelectedFavorite = selectedCity ? favoriteCityIds.includes(selectedCity.id) : false

  const indiaOptions = cities.filter((city) => city.regionGroup === 'india')
  const internationalOptions = cities.filter((city) => city.regionGroup === 'international')

  return (
    <label className="city-selector">
      <span className="city-selector__label">Monitoring location</span>
      <div className="city-selector__controls">
        <button
          type="button"
          className="city-selector__favorite-btn"
          onClick={() => (selectedCity ? onToggleFavorite(selectedCity.id) : undefined)}
          disabled={!selectedCity}
        >
          {isSelectedFavorite ? 'Unpin city' : 'Pin city'}
        </button>

        <label className="city-selector__favorites-only">
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(event) => onShowFavoritesOnlyChange(event.target.checked)}
            disabled={favoriteCount === 0}
          />
          <span>Favorites only ({favoriteCount})</span>
        </label>
      </div>

      <select
        className="city-selector__select"
        value={hasCities ? selectedCityId : ''}
        onChange={(event) => onSelectCity(event.target.value)}
        disabled={!hasCities}
      >
        {!hasCities ? (
          <option value="">No pinned cities yet</option>
        ) : null}

        <optgroup label="India">
          {indiaOptions.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}, {city.state}
            </option>
          ))}
        </optgroup>

        <optgroup label="International">
          {internationalOptions.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}, {city.country}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  )
}
