import type { ForecastDay } from '../types/climate'

interface ForecastTableProps {
  days: ForecastDay[]
}

export function ForecastTable({ days }: ForecastTableProps) {
  return (
    <div className="forecast-table-wrap">
      <table className="forecast-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Min temp</th>
            <th>Max temp</th>
            <th>Rain chance</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.minC.toFixed(1)} C</td>
              <td>{day.maxC.toFixed(1)} C</td>
              <td>{day.rainChance}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
