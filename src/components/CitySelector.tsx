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
  const indiaOptions = cities.filter((city) => city.regionGroup === 'india')
  const internationalOptions = cities.filter((city) => city.regionGroup === 'international')

  return (
    <label className="city-selector">
      <span className="city-selector__label">Monitoring location</span>
      <select
        className="city-selector__select"
        value={selectedCityId}
        onChange={(event) => onSelectCity(event.target.value)}
      >
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
