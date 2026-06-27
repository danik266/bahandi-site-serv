import { useState, type FormEvent } from 'react'

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
  const [showPin, setShowPin] = useState(false)

  const demoAccounts = [
    { username: 'aibek', pin: '1234' },
    { username: 'aigerim', pin: '9999' },
    { username: 'manager', pin: '0000' },
    { username: 'madina', pin: '2222' },
    { username: 'timur', pin: '3333' },
  ]

  const handleDemoClick = (username: string, pin: string) => {
    onLoginChange(username)
    onPasswordChange(pin)
  }

  return (
    <main className="login-shell">
      <form className="panel login-panel mobile-style-auth" onSubmit={onLogin}>
        <h1 className="login-welcome-title">Добро пожаловать!</h1>
        <p className="login-welcome-subtitle">
          Войдите личным логином<br />и пин-кодом.
        </p>

        {/* Login input box */}
        <div className="login-field-group">
          <label className="login-field-label">Логин</label>
          <div className="login-input-wrapper">
            <span className="login-input-icon">@</span>
            <input
              value={login}
              onChange={(e) => onLoginChange(e.target.value)}
              placeholder="aibek"
              autoCapitalize="none"
              autoComplete="username"
              className="login-text-input"
              disabled={isSaving}
            />
            {login.length > 0 && (
              <button
                type="button"
                onClick={() => onLoginChange('')}
                className="login-input-clear-btn"
                aria-label="Очистить логин"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* PIN code input box */}
        <div className="login-field-group">
          <label className="login-field-label">Пин-код</label>
          <div className="login-input-wrapper">
            <span className="login-input-icon">*</span>
            <input
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••"
              type={showPin ? 'text' : 'password'}
              autoComplete="current-password"
              className="login-text-input"
              disabled={isSaving}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="login-input-eye-btn"
            >
              {showPin ? 'скрыть' : 'показать'}
            </button>
          </div>
        </div>

        {authError && (
          <div className="login-error-box-inline">
            <p className="login-error-text">{authError}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving}
          className={`login-submit-button ${isSaving ? 'disabled-button' : ''}`}
        >
          <span className="login-submit-text">Войти</span>
          <div className="login-submit-arrow-circle">
            {isSaving ? (
              <span className="login-spinner" />
            ) : (
              <span className="login-submit-arrow-text">→</span>
            )}
          </div>
        </button>

        {/* Demo Accounts Panel */}
        <div className="demo-panel">
          <div className="demo-header-row">
            <span className="demo-title">Демо-аккаунт</span>
            <span className="demo-info-icon">ⓘ</span>
          </div>
          <div className="demo-body-text">
            {demoAccounts.map((acc, index) => (
              <span key={acc.username}>
                <button
                  type="button"
                  className="demo-account-btn"
                  onClick={() => handleDemoClick(acc.username, acc.pin)}
                  title={`Заполнить ${acc.username} / ${acc.pin}`}
                >
                  {acc.username}/{acc.pin}
                </button>
                {index < demoAccounts.length - 1 && <span className="demo-divider">  ·  </span>}
              </span>
            ))}
          </div>
        </div>

        {/* Footer message */}
        <div className="login-footer">
          <span className="login-footer-icon">[i]</span>
          <span className="login-footer-text">
            По вопросам доступа<br />обратитесь к администратору.
          </span>
        </div>
      </form>
    </main>
  )
}

