import type { FormEvent } from 'react'
import { AlertTriangle, LoaderCircle, UserCheck, UserRound } from 'lucide-react'
import { PanelTitle } from '../components/ui'

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
  return (
    <main className="login-shell">
      <form className="panel login-panel" onSubmit={onLogin}>
        <PanelTitle icon={UserRound} title="Авторизация" detail="role access" />
        <p className="login-copy">
          Войдите сотрудником торговой точки или проверяющим. Сотрудник создает
          заявки, проверяющий подтверждает списание и отправляет акт в Iiko.
        </p>

        <label>
          <span>Логин</span>
          <input
            value={login}
            autoComplete="username"
            placeholder="Например: reviewer"
            onChange={(event) => onLoginChange(event.target.value)}
          />
        </label>

        <label>
          <span>Пароль</span>
          <input
            value={password}
            type="password"
            autoComplete="current-password"
            placeholder="Пароль сотрудника"
            onChange={(event) => onPasswordChange(event.target.value)}
          />
        </label>

        {authError && (
          <div className="inline-alert">
            <AlertTriangle size={17} />
            {authError}
          </div>
        )}

        <button type="submit" className="button green submit-button" disabled={isSaving}>
          {isSaving ? <LoaderCircle size={18} /> : <UserCheck size={18} />}
          Войти
        </button>
      </form>
    </main>
  )
}
