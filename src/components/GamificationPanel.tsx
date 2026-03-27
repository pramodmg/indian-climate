import type {
    Badge,
    BadgeId,
    GamificationState,
    LevelInfo,
} from '../services/gamificationStore'
import {
    BADGES,
    getLevelInfo,
    getLevelProgress,
    getXpToNextLevel,
} from '../services/gamificationStore'

interface GamificationPanelProps {
    state: GamificationState
}

const BADGE_ORDER: BadgeId[] = [
    'first-look',
    'city-hopper',
    'globe-trotter',
    'analyst',
    'pin-point',
    'alert-watcher',
    'streak-starter',
    'all-zones',
]

const LEVEL_COLOR: Record<number, string> = {
    1: '#5e7a9e',
    2: '#2a7fb0',
    3: '#2060c4',
    4: '#7c3bcc',
    5: '#c44a10',
}

function BadgeChip({ badge, earned }: { badge: Badge; earned: boolean }) {
    return (
        <div
            className={`gamif-badge ${earned ? 'is-earned' : 'is-locked'}`}
            title={`${badge.label}: ${badge.description}${earned ? '' : ' (locked)'}`}
            aria-label={`${badge.label}${earned ? '' : ' – locked'}`}
        >
            <span className="gamif-badge__icon" aria-hidden="true">
                {earned ? badgeIcon(badge.id) : '?'}
            </span>
            <span className="gamif-badge__label">{badge.label}</span>
        </div>
    )
}

function badgeIcon(id: BadgeId): string {
    const icons: Record<BadgeId, string> = {
        'first-look': '👁',
        'city-hopper': '🗺',
        'globe-trotter': '🌍',
        analyst: '📊',
        'pin-point': '📍',
        'alert-watcher': '🚨',
        'streak-starter': '🔥',
        'all-zones': '🌦',
    }
    return icons[id]
}

function LevelBar({ xp, levelInfo }: { xp: number; levelInfo: LevelInfo }) {
    const progress = getLevelProgress(xp)
    const toNext = getXpToNextLevel(xp)
    const color = LEVEL_COLOR[levelInfo.level] ?? LEVEL_COLOR[1]

    return (
        <div className="gamif-level-bar">
            <div className="gamif-level-bar__track">
                <div
                    className="gamif-level-bar__fill"
                    style={{ width: `${progress}%`, background: color }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Level progress: ${progress}%`}
                />
            </div>
            <span className="gamif-level-bar__label">
                {levelInfo.maxXp === Infinity
                    ? 'Max level reached'
                    : `${toNext} XP to ${nextLevelTitle(levelInfo.level)}`}
            </span>
        </div>
    )
}

function nextLevelTitle(currentLevel: number): string {
    const titles: Record<number, string> = {
        1: 'Analyst',
        2: 'Monitor',
        3: 'Expert',
        4: 'Guardian',
    }
    return titles[currentLevel] ?? ''
}

export function GamificationPanel({ state }: GamificationPanelProps) {
    const levelInfo = getLevelInfo(state.xp)
    const color = LEVEL_COLOR[levelInfo.level] ?? LEVEL_COLOR[1]

    return (
        <article className="panel gamif-panel">
            <h2>Climate score</h2>

            <div className="gamif-identity">
                <div
                    className="gamif-level-badge"
                    style={{ background: color }}
                    aria-label={`Level ${levelInfo.level}`}
                >
                    {levelInfo.level}
                </div>
                <div className="gamif-identity__copy">
                    <strong className="gamif-title" style={{ color }}>
                        {levelInfo.title}
                    </strong>
                    <span className="gamif-xp">{state.xp} XP total</span>
                </div>
            </div>

            <LevelBar xp={state.xp} levelInfo={levelInfo} />

            <div className="gamif-stats">
                <div className="gamif-stat">
                    <strong>{state.visitedCityIds.length}</strong>
                    <span>cities explored</span>
                </div>
                <div className="gamif-stat">
                    <strong>{state.currentStreak}</strong>
                    <span>day streak</span>
                </div>
                <div className="gamif-stat">
                    <strong>{state.earnedBadgeIds.length}</strong>
                    <span>/ {BADGE_ORDER.length} badges</span>
                </div>
            </div>

            <div className="gamif-badges" role="list" aria-label="Achievement badges">
                {BADGE_ORDER.map((id) => (
                    <BadgeChip
                        key={id}
                        badge={BADGES[id]}
                        earned={state.earnedBadgeIds.includes(id)}
                    />
                ))}
            </div>
        </article>
    )
}
