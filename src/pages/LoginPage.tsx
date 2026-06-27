import type { FormEvent } from 'react'
import { AlertTriangle, LoaderCircle, UserCheck, UserRound } from 'lucide-react'
import { PanelTitle } from '../components/ui'
import type { Employee } from '../types'

export function LoginPage({
  employees,
  selectedLoginId,
  pinCode,
  authError,
  isSaving,
  onLogin,
  onSelect,
  onPinChange,
}: {
  employees: Employee[]
  selectedLoginId: string
  pinCode: string
  authError: string
  isSaving: boolean
  onLogin: (event: FormEvent<HTMLFormElement>) => void
  onSelect: (id: string) => void
  onPinChange: (value: string) => void
}) {
  return (
    <main className="login-shell">
      <form className="panel login-panel" onSubmit={onLogin}>
        <PanelTitle icon={UserRound} title="Авторизация" detail="role access" />
        <p className="login-copy">
          Войдите сотрудником торговой точки или проверяющим. Сотрудник создает
          заявки, проверяющий подтверждает списание и отправляет акт в Iiko.
        </p>

        <div className="login-users">
          {employees.map((employee) => (
            <button
              key={employee.id}
              type="button"
              className={selectedLoginId === employee.id ? 'login-user active' : 'login-user'}
              onClick={() => onSelect(employee.id)}
            >
              <strong>{employee.name}</strong>
              <span>{employee.role === 'sender' ? 'Сотрудник' : 'Проверяющий'}</span>
            </button>
          ))}
        </div>

        <label>
          <span>PIN</span>
          <input
            value={pinCode}
            inputMode="numeric"
            placeholder="1111 для сотрудника, 9999 для проверяющего"
            onChange={(event) => onPinChange(event.target.value)}
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
