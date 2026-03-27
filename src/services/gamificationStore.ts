// ── Types ────────────────────────────────────────────────────────────────────

export type BadgeId =
    | 'first-look'
    | 'city-hopper'
    | 'globe-trotter'
    | 'analyst'
    | 'pin-point'
    | 'alert-watcher'
    | 'streak-starter'
    | 'all-zones'

export interface Badge {
    id: BadgeId
    label: string
    description: string
    xpReward: number
}

export interface GamificationState {
    xp: number
    visitedCityIds: string[]
    visitedInternational: boolean
    compareUsed: boolean
    pinnedCount: number
    alertsViewed: number
    lastLoginDate: string | null
    currentStreak: number
    earnedBadgeIds: BadgeId[]
}

export interface LevelInfo {
    level: number
    title: string
    minXp: number
    maxXp: number
}

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'india-climate-gamification'

export const BADGES: Readonly<Record<BadgeId, Badge>> = {
    'first-look': {
        id: 'first-look',
        label: 'First Look',
        description: 'Loaded the dashboard for the first time.',
        xpReward: 25,
    },
    'city-hopper': {
        id: 'city-hopper',
        label: 'City Hopper',
        description: 'Explored 5 different cities.',
        xpReward: 50,
    },
    'globe-trotter': {
        id: 'globe-trotter',
        label: 'Globe Trotter',
        description: 'Monitored an international city.',
        xpReward: 40,
    },
    analyst: {
        id: 'analyst',
        label: 'Analyst',
        description: 'Used city compare mode.',
        xpReward: 35,
    },
    'pin-point': {
        id: 'pin-point',
        label: 'Pin Point',
        description: 'Pinned your first favourite city.',
        xpReward: 30,
    },
    'alert-watcher': {
        id: 'alert-watcher',
        label: 'Alert Watcher',
        description: 'Viewed 10 live alerts across sessions.',
        xpReward: 60,
    },
    'streak-starter': {
        id: 'streak-starter',
        label: 'Streak Starter',
        description: 'Visited the app on 3 consecutive days.',
        xpReward: 75,
    },
    'all-zones': {
        id: 'all-zones',
        label: 'All Zones',
        description: 'Visited cities from all 4 climate zones.',
        xpReward: 80,
    },
}

const LEVELS: LevelInfo[] = [
    { level: 1, title: 'Observer', minXp: 0, maxXp: 99 },
    { level: 2, title: 'Analyst', minXp: 100, maxXp: 249 },
    { level: 3, title: 'Monitor', minXp: 250, maxXp: 499 },
    { level: 4, title: 'Expert', minXp: 500, maxXp: 999 },
    { level: 5, title: 'Guardian', minXp: 1000, maxXp: Infinity },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayIso(): string {
    return new Date().toISOString().slice(0, 10)
}

function buildDefaultState(): GamificationState {
    return {
        xp: 0,
        visitedCityIds: [],
        visitedInternational: false,
        compareUsed: false,
        pinnedCount: 0,
        alertsViewed: 0,
        lastLoginDate: null,
        currentStreak: 0,
        earnedBadgeIds: [],
    }
}

// ── Store ────────────────────────────────────────────────────────────────────

export function readState(): GamificationState {
    if (typeof window === 'undefined') {
        return buildDefaultState()
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
        return buildDefaultState()
    }

    try {
        return { ...buildDefaultState(), ...(JSON.parse(raw) as Partial<GamificationState>) }
    } catch {
        return buildDefaultState()
    }
}

function writeState(state: GamificationState): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// ── Level helpers ────────────────────────────────────────────────────────────

export function getLevelInfo(xp: number): LevelInfo {
    return [...LEVELS].reverse().find((l) => xp >= l.minXp) ?? LEVELS[0]
}

export function getXpToNextLevel(xp: number): number {
    const current = getLevelInfo(xp)

    if (current.maxXp === Infinity) {
        return 0
    }

    return current.maxXp + 1 - xp
}

export function getLevelProgress(xp: number): number {
    const current = getLevelInfo(xp)

    if (current.maxXp === Infinity) {
        return 100
    }

    const range = current.maxXp - current.minXp + 1
    const progress = xp - current.minXp

    return Math.min(100, Math.round((progress / range) * 100))
}

// ── Badge evaluation ─────────────────────────────────────────────────────────

const INDIA_CLIMATE_ZONES = ['tropical', 'arid', 'semi-arid', 'humid subtropical']

function checkNewBadges(prev: GamificationState, next: GamificationState): BadgeId[] {
    const alreadyEarned = new Set(prev.earnedBadgeIds)
    const newBadges: BadgeId[] = []

    function test(id: BadgeId, condition: boolean) {
        if (condition && !alreadyEarned.has(id)) {
            newBadges.push(id)
        }
    }

    test('first-look', next.visitedCityIds.length >= 1)
    test('city-hopper', next.visitedCityIds.length >= 5)
    test('globe-trotter', next.visitedInternational)
    test('analyst', next.compareUsed)
    test('pin-point', next.pinnedCount >= 1)
    test('alert-watcher', next.alertsViewed >= 10)
    test('streak-starter', next.currentStreak >= 3)
    test(
        'all-zones',
        INDIA_CLIMATE_ZONES.every((zone) =>
            next.visitedCityIds.some((id) => id.toLowerCase().includes(zone.split(' ')[0])),
        ),
    )

    return newBadges
}

// ── Public event API ─────────────────────────────────────────────────────────

export interface XpEvent {
    xpGained: number
    newBadges: Badge[]
    leveledUp: boolean
    newLevel: LevelInfo | null
}

function applyEvent(
    mutation: (state: GamificationState) => GamificationState,
): XpEvent {
    const prev = readState()
    const prevLevel = getLevelInfo(prev.xp)

    let next = mutation(prev)

    const newBadgeIds = checkNewBadges(prev, next)
    const bonusXp = newBadgeIds.reduce((sum, id) => sum + BADGES[id].xpReward, 0)

    next = {
        ...next,
        xp: next.xp + bonusXp,
        earnedBadgeIds: [...next.earnedBadgeIds, ...newBadgeIds],
    }

    const nextLevel = getLevelInfo(next.xp)
    const leveledUp = nextLevel.level > prevLevel.level

    writeState(next)

    return {
        xpGained: next.xp - prev.xp,
        newBadges: newBadgeIds.map((id) => BADGES[id]),
        leveledUp,
        newLevel: leveledUp ? nextLevel : null,
    }
}

/** Call on mount / session restore. Updates daily streak. */
export function recordSession(): XpEvent {
    return applyEvent((state) => {
        const today = todayIso()

        if (state.lastLoginDate === today) {
            return state
        }

        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
        const isConsecutive = state.lastLoginDate === yesterday
        const newStreak = isConsecutive ? state.currentStreak + 1 : 1

        return {
            ...state,
            lastLoginDate: today,
            currentStreak: newStreak,
            xp: state.xp + 20, // daily login bonus
        }
    })
}

/** Call each time the user switches to a new city. */
export function recordCityVisit(cityId: string, isInternational: boolean): XpEvent {
    return applyEvent((state) => {
        const alreadyVisited = state.visitedCityIds.includes(cityId)

        return {
            ...state,
            visitedCityIds: alreadyVisited
                ? state.visitedCityIds
                : [...state.visitedCityIds, cityId],
            visitedInternational: state.visitedInternational || isInternational,
            xp: state.xp + (alreadyVisited ? 5 : 15),
        }
    })
}

/** Call when compare mode is toggled on for the first time (or each use). */
export function recordCompareUsed(): XpEvent {
    return applyEvent((state) => ({
        ...state,
        compareUsed: true,
        xp: state.xp + 20,
    }))
}

/** Call when a city is pinned. */
export function recordCityPinned(): XpEvent {
    return applyEvent((state) => ({
        ...state,
        pinnedCount: state.pinnedCount + 1,
        xp: state.xp + 10,
    }))
}

/** Call with the count of alerts loaded for the current city snapshot. */
export function recordAlertsViewed(count: number): XpEvent {
    if (count === 0) {
        return { xpGained: 0, newBadges: [], leveledUp: false, newLevel: null }
    }

    return applyEvent((state) => ({
        ...state,
        alertsViewed: state.alertsViewed + count,
        xp: state.xp + Math.min(count * 5, 25),
    }))
}
