import type { IndiaCity } from '../types/climate'
import type { ClimateSnapshot } from '../types/climate'
import { riskScoreGrade } from '../services/riskScoreService'

export interface LeaderboardEntry {
    city: IndiaCity
    snapshot: ClimateSnapshot
    score: number
    rank: number
}

interface RiskLeaderboardProps {
    entries: LeaderboardEntry[]
    selectedCityId: string
    onSelectCity: (cityId: string) => void
}

const GRADE_LABEL: Record<ReturnType<typeof riskScoreGrade>, string> = {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    severe: 'Severe',
}

export function RiskLeaderboard({ entries, selectedCityId, onSelectCity }: RiskLeaderboardProps) {
    return (
        <article className="panel risk-leaderboard">
            <h2>City risk leaderboard</h2>
            <p className="risk-leaderboard__sub">
                Live composite score across heat, air quality and rainfall. Higher = more stressed.
            </p>

            {entries.length === 0 ? (
                <p className="panel-note">Loading city rankings...</p>
            ) : (
                <ol className="risk-leaderboard__list" aria-label="Cities ranked by risk score">
                    {entries.map((entry) => {
                        const grade = riskScoreGrade(entry.score)
                        const isSelected = entry.city.id === selectedCityId

                        return (
                            <li
                                key={entry.city.id}
                                className={`risk-row ${isSelected ? 'is-selected' : ''} risk-row--${grade}`}
                            >
                                <button
                                    type="button"
                                    className="risk-row__btn"
                                    onClick={() => onSelectCity(entry.city.id)}
                                    aria-current={isSelected ? 'true' : undefined}
                                >
                                    <span className="risk-row__rank" aria-label={`Rank ${entry.rank}`}>
                                        {entry.rank}
                                    </span>

                                    <span className="risk-row__city">
                                        <strong>{entry.city.name}</strong>
                                        <small>{entry.city.country}</small>
                                    </span>

                                    <span className="risk-row__bar-wrap" aria-hidden="true">
                                        <span
                                            className={`risk-row__bar risk-row__bar--${grade}`}
                                            style={{ width: `${entry.score}%` }}
                                        />
                                    </span>

                                    <span className={`risk-row__score risk-row__score--${grade}`}>
                                        {entry.score}
                                        <small>{GRADE_LABEL[grade]}</small>
                                    </span>
                                </button>
                            </li>
                        )
                    })}
                </ol>
            )}
        </article>
    )
}
