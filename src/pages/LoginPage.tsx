import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  LoaderCircle,
  Lock,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { BahandiLogo } from '../components/ui'

const DEMO_ACCOUNTS = [
  { login: 'aibek', pass: '1234' },
  { login: 'aigerim', pass: '9999' },
  { login: 'manager', pass: '0000' },
  { login: 'madina', pass: '2222' },
  { login: 'timur', pass: '3333' },
]

export function LoginPage({
  login,
  password,
  authError,
  isSaving,
  onLogin,
  onLoginChange,
  onPasswordChange,
}: {
  login: string
  password: string
  authError: string
  isSaving: boolean
  onLogin: (event: FormEvent<HTMLFormElement>) => void
  onLoginChange: (value: string) => void
  onPasswordChange: (value: string) => void
}) {
  const [showPass, setShowPass] = useState(false)

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={onLogin}>
        <div className="auth-brand">
          <BahandiLogo />
          <span className="auth-brand-sub">SPISANDI</span>
        </div>

        <h1 className="auth-title">Добро пожаловать!</h1>
        <p className="auth-sub">
          Войдите личным логином
          <br />и пин-кодом.
        </p>

        <label className="auth-field">
          <span className="auth-label">Логин</span>
          <div className="auth-input">
            <User size={19} className="auth-input-icon" />
            <input
              value={login}
              autoComplete="username"
              autoCapitalize="none"
              placeholder="Например: aibek"
              onChange={(event) => onLoginChange(event.target.value)}
            />
            {login && (
              <button
                type="button"
                className="auth-input-action"
                onClick={() => onLoginChange('')}
                aria-label="Очистить"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </label>

        <label className="auth-field">
          <span className="auth-label">Пин-код</span>
          <div className="auth-input">
            <Lock size={19} className="auth-input-icon" />
            <input
              value={password}
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Введите пин-код"
              onChange={(event) => onPasswordChange(event.target.value)}
            />
            <button
              type="button"
              className="auth-input-action"
              onClick={() => setShowPass((value) => !value)}
              aria-label={showPass ? 'Скрыть' : 'Показать'}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {authError && (
          <div className="login-error-box-inline">
            <p className="login-error-text">{authError}</p>
          </div>
        )}

        <button type="submit" className="auth-submit" disabled={isSaving}>
          {isSaving ? <LoaderCircle size={20} className="spin" /> : null}
          Войти
          {!isSaving && <ArrowRight size={20} />}
        </button>

        <div className="auth-demo">
          <div className="auth-demo-head">
            <Info size={16} />
            Демо-аккаунт
          </div>
          <div className="auth-demo-grid">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.login}
                type="button"
                className="auth-demo-chip"
                onClick={() => {
                  onLoginChange(account.login)
                  onPasswordChange(account.pass)
                }}
              >
                {account.login}/{account.pass}
              </button>
            ))}
          </div>
        </div>

        <div className="auth-foot">
          <ShieldCheck size={16} />
          По вопросам доступа обратитесь к администратору.
        </div>
      </form>
    </main>
  )
}
