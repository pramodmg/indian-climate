import type { IndiaCity } from '../types/climate'

interface CitySelectorProps {
  cities: IndiaCity[]
  selectedCityId: string
  onSelectCity: (cityId: string) => void
}

export function CitySelector({
  cities,
  selectedCityId,
  onSelectCity,
}: CitySelectorProps) {
  return (
    <label className="city-selector">
      <span className="city-selector__label">Monitoring city</span>
      <select
        className="city-selector__select"
        value={selectedCityId}
        onChange={(event) => onSelectCity(event.target.value)}
      >
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}, {city.state}
          </option>
        ))}
      </select>
    </label>
  )
}
