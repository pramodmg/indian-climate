import { useEffect, useState } from 'react'
import type { Badge, LevelInfo } from '../services/gamificationStore'

export interface ToastPayload {
    id: number
    xpGained: number
    newBadges: Badge[]
    leveledUp: boolean
    newLevel: LevelInfo | null
}

interface XpToastProps {
    toasts: ToastPayload[]
    onDismiss: (id: number) => void
}

export function XpToast({ toasts, onDismiss }: XpToastProps) {
    return (
        <div className="xp-toast-stack" aria-live="polite" aria-label="Achievement notifications">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    )
}

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: ToastPayload
    onDismiss: (id: number) => void
}) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // Trigger enter animation on next frame
        const enterTimer = window.setTimeout(() => setVisible(true), 16)
        // Auto-dismiss after 3.5 s
        const exitTimer = window.setTimeout(() => {
            setVisible(false)
            window.setTimeout(() => onDismiss(toast.id), 400)
        }, 3500)

        return () => {
            window.clearTimeout(enterTimer)
            window.clearTimeout(exitTimer)
        }
    }, [toast.id, onDismiss])

    const hasBadge = toast.newBadges.length > 0

    return (
        <div
            className={`xp-toast ${visible ? 'is-visible' : ''} ${hasBadge ? 'has-badge' : ''}`}
            role="status"
        >
            {toast.xpGained > 0 && (
                <span className="xp-toast__xp">+{toast.xpGained} XP</span>
            )}

            {toast.leveledUp && toast.newLevel ? (
                <span className="xp-toast__levelup">
                    Level up! You are now a <strong>{toast.newLevel.title}</strong>
                </span>
            ) : null}

            {toast.newBadges.map((badge) => (
                <span key={badge.id} className="xp-toast__badge">
                    {badge.label} unlocked
                </span>
            ))}
        </div>
    )
}

// ── Hook moved to src/hooks/useXpToasts.ts ───────────────