import type { IndiaCity, ClimateSnapshot } from '../types/climate'
import type { LeaderboardEntry } from '../components/RiskLeaderboard'
import { computeRiskScore } from '../services/riskScoreService'

export function buildLeaderboard(
    snapshots: Map<string, ClimateSnapshot>,
    cities: IndiaCity[],
): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = []

    for (const city of cities) {
        const snap = snapshots.get(city.id)

        if (snap) {
            entries.push({
                city,
                snapshot: snap,
                score: computeRiskScore(snap),
                rank: 0,
            })
        }
    }

    entries.sort((a, b) => b.score - a.score)

    entries.forEach((entry, i) => {
        entry.rank = i + 1
    })

    return entries
}
