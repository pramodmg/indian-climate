import { FormEvent, useState } from 'react'
import type { AuthUser } from '../types/climate'

interface AuthPanelProps {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (name: string, email: string, password: string) => Promise<void>
  onLogout: () => void
}

export function AuthPanel({
  user,
  isLoading,
  error,
  onLogin,
  onRegister,
  onLogout,
}: AuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (mode === 'register') {
      await onRegister(name.trim(), email.trim(), password)
      return
    }

    await onLogin(email.trim(), password)
  }

  if (user) {
    return (
      <article className="panel panel-auth">
        <h2>User account</h2>
        <p className="auth-user-line">
          Signed in as <strong>{user.name}</strong> ({user.email})
        </p>
        <button type="button" className="auth-button auth-button--ghost" onClick={onLogout}>
          Sign out
        </button>
      </article>
    )
  }

  return (
    <article className="panel panel-auth">
      <h2>User account</h2>
      <p className="auth-subhead">Sign in to sync watchlists and alerts with the API backend.</p>

      <div className="auth-mode-row" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          className={`auth-mode-btn ${mode === 'login' ? 'is-active' : ''}`}
          onClick={() => setMode('login')}
        >
          Login
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          className={`auth-mode-btn ${mode === 'register' ? 'is-active' : ''}`}
          onClick={() => setMode('register')}
        >
          Register
        </button>
      </div>

      <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
        {mode === 'register' ? (
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              required
            />
          </label>
        ) : null}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required
          />
        </label>

        {error ? <p className="auth-error">{error}</p> : null}

        <button className="auth-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </article>
  )
}
