import { useCallback, useState } from 'react'
import type { XpEvent } from '../services/gamificationStore'
import type { ToastPayload } from '../components/XpToast'

let toastCounter = 0

export function useXpToasts() {
    const [toasts, setToasts] = useState<ToastPayload[]>([])

    const pushEvent = useCallback((event: XpEvent) => {
        if (event.xpGained === 0 && event.newBadges.length === 0 && !event.leveledUp) {
            return
        }

        toastCounter += 1

        setToasts((prev) => [
            ...prev,
            {
                id: toastCounter,
                xpGained: event.xpGained,
                newBadges: event.newBadges,
                leveledUp: event.leveledUp,
                newLevel: event.newLevel,
            },
        ])
    }, [])

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return { toasts, pushEvent, dismiss }
}
