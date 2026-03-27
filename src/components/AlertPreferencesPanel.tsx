import { useEffect, useMemo, useState } from 'react'
import type { AlertPreferences, AlertSeverity, AlertType, AuthUser } from '../types/climate'

interface AlertPreferencesPanelProps {
  user: AuthUser | null
  preferences: AlertPreferences
  isLoading: boolean
  isSaving: boolean
  error: string | null
  onSave: (preferences: AlertPreferences) => Promise<void>
}

const severityOptions: Array<{ value: AlertSeverity; label: string }> = [
  { value: 'watch', label: 'Watch and above' },
  { value: 'warning', label: 'Warning and emergency' },
  { value: 'emergency', label: 'Emergency only' },
]

const typeOptions: Array<{ value: AlertType; label: string }> = [
  { value: 'heatwave', label: 'Heatwave alerts' },
  { value: 'flood', label: 'Flood alerts' },
  { value: 'air-quality', label: 'Air quality alerts' },
]

export function AlertPreferencesPanel({
  user,
  preferences,
  isLoading,
  isSaving,
  error,
  onSave,
}: AlertPreferencesPanelProps) {
  const [draft, setDraft] = useState<AlertPreferences>(preferences)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(preferences)
  }, [preferences])

  const isDirty = useMemo(() => {
    if (draft.minSeverity !== preferences.minSeverity) {
      return true
    }

    const left = [...draft.enabledTypes].sort()
    const right = [...preferences.enabledTypes].sort()

    return left.join('|') !== right.join('|')
  }, [draft, preferences])

  function toggleType(alertType: AlertType) {
    setLocalError(null)

    setDraft((current) => {
      const isEnabled = current.enabledTypes.includes(alertType)

      if (isEnabled) {
        return {
          ...current,
          enabledTypes: current.enabledTypes.filter((type) => type !== alertType),
        }
      }

      return {
        ...current,
        enabledTypes: [...current.enabledTypes, alertType],
      }
    })
  }

  async function handleSave() {
    if (draft.enabledTypes.length === 0) {
      setLocalError('Select at least one alert type to keep your feed active.')
      return
    }

    await onSave({
      minSeverity: draft.minSeverity,
      enabledTypes: [...new Set(draft.enabledTypes)],
    })
  }

  if (!user) {
    return (
      <article className="panel panel-alert-preferences">
        <h2>Alert preferences</h2>
        <p className="alerts-preferences-subhead">
          Sign in to personalize which climate alerts appear in your live feed.
        </p>
      </article>
    )
  }

  return (
    <article className="panel panel-alert-preferences">
      <h2>Alert preferences</h2>
      <p className="alerts-preferences-subhead">
        Personalize your alert stream for {user.name}. Settings are synced with your account.
      </p>

      {isLoading ? <p className="panel-note">Loading your preferences...</p> : null}

      {!isLoading ? (
        <>
          <label className="preferences-label" htmlFor="minSeveritySelect">
            Minimum severity
          </label>
          <select
            id="minSeveritySelect"
            value={draft.minSeverity}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                minSeverity: event.target.value as AlertSeverity,
              }))
            }
            className="preferences-select"
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <p className="preferences-label">Alert categories</p>
          <div className="preferences-types" role="group" aria-label="Alert categories">
            {typeOptions.map((option) => (
              <label key={option.value} className="preferences-checkbox">
                <input
                  type="checkbox"
                  checked={draft.enabledTypes.includes(option.value)}
                  onChange={() => toggleType(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          {localError ? <p className="auth-error">{localError}</p> : null}
          {error ? <p className="auth-error">{error}</p> : null}

          <button
            type="button"
            className="auth-button"
            onClick={() => void handleSave()}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? 'Saving...' : isDirty ? 'Save preferences' : 'Saved'}
          </button>
        </>
      ) : null}
    </article>
  )
}
