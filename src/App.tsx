import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AlertTriangle, LoaderCircle, LogOut, RefreshCw } from 'lucide-react'
import {
  approveWriteOff,
  createWriteOff,
  loadBootstrap,
  loginUser,
  rejectWriteOff,
} from './api'
import { BahandiLogo } from './components/ui'
import { emptyData } from './lib/constants'
import { createDefaultForm, createEmptyForm } from './lib/form'
import { readFileAsDataUrl, hashText } from './lib/file'
import { createLookups } from './lib/lookups'
import { getRequestCost } from './lib/request'
import { LoginPage } from './pages/LoginPage'
import { EmployeePage } from './pages/EmployeePage'
import { ReviewerPage } from './pages/ReviewerPage'
import type {
  BootstrapPayload,
  Employee,
  FormState,
  Metrics,
  WebView,
} from './types'
import './App.css'

function App() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<Employee | null>(null)
  const [selectedLoginId, setSelectedLoginId] = useState('')
  const [pinCode, setPinCode] = useState('')
  const [authError, setAuthError] = useState('')
  const [webView, setWebView] = useState<WebView>('create')
  const [data, setData] = useState<BootstrapPayload>(emptyData)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [form, setForm] = useState<FormState>(createEmptyForm())
  const [formError, setFormError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [rejectionDraft, setRejectionDraft] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState('')

  const lookups = useMemo(() => createLookups(data), [data])

  const refreshData = useCallback(async () => {
    try {
      setApiError('')
      const payload = await loadBootstrap()
      setData(payload)
      setSelectedLoginId(
        (current) =>
          current || payload.employees.find((employee) => employee.role === 'sender')?.id || '',
      )
      setSelectedRequestId((current) => current || payload.requests[0]?.id || '')
      setForm((current) =>
        current.outletId
          ? current
          : createDefaultForm(payload, currentUser ?? payload.employees[0]),
      )
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Не удалось загрузить данные')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  const pendingRequests = useMemo(
    () =>
      data.requests
        .filter((request) => request.status === 'pending')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [data.requests],
  )

  const myRequests = useMemo(
    () => data.requests.filter((request) => request.createdById === currentUser?.id),
    [currentUser?.id, data.requests],
  )

  const selectedRequest =
    data.requests.find((request) => request.id === selectedRequestId) ??
    pendingRequests[0] ??
    data.requests[0]

  const filteredRequests = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    const base = currentUser?.role === 'sender' ? myRequests : data.requests
    if (!normalized) return base

    return base.filter((request) => {
      const values = [
        request.id,
        lookups.product(request.productId).name,
        lookups.outlet(request.outletId).name,
        lookups.employee(request.createdById).name,
      ]
      return values.some((value) => value.toLowerCase().includes(normalized))
    })
  }, [currentUser?.role, data.requests, lookups, myRequests, searchTerm])

  const metrics = useMemo<Metrics>(() => {
    const today = '2026-06-27'
    const todayRequests = data.requests.filter((request) => request.createdAt.startsWith(today))
    return {
      today: todayRequests.length,
      pending: data.requests.filter((request) => request.status === 'pending').length,
      approved: data.requests.filter((request) => request.status === 'approved').length,
      rejected: data.requests.filter((request) => request.status === 'rejected').length,
      iikoErrors: data.requests.filter((request) => request.status === 'iiko_error').length,
      withDeduction: data.requests.filter((request) => request.type === 'with_deduction').length,
      totalAmount: todayRequests.reduce(
        (sum, request) => sum + getRequestCost(request, lookups),
        0,
      ),
    }
  }, [data.requests, lookups])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      setIsSaving(true)
      setAuthError('')
      const result = await loginUser(selectedLoginId, pinCode)
      setCurrentUser(result.user)
      setWebView(result.user.role === 'sender' ? 'create' : 'review')
      setForm(createDefaultForm(data, result.user))
      setPinCode('')
      navigate(result.user.role === 'sender' ? '/employee' : '/reviewer')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Не удалось войти')
    } finally {
      setIsSaving(false)
    }
  }

  function handleLogout() {
    setCurrentUser(null)
    setPinCode('')
    setAuthError('')
    setWebView('create')
    navigate('/login')
  }

  function setFormField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setFormError('')
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const dataUrl = await readFileAsDataUrl(file)
    const hash = await hashText(`${file.name}:${file.size}:${file.lastModified}:${dataUrl}`)
    setForm((current) => ({
      ...current,
      photoUrl: dataUrl,
      photoName: file.name,
      photoHash: `sha256:${hash.slice(0, 12)}`,
    }))
    setFormError('')
  }

  function useDemoPhoto() {
    setForm((current) => ({
      ...current,
      photoUrl: '/writeoff-evidence.png',
      photoName: 'writeoff-evidence.png',
      photoHash: `sha256:web-demo-${Date.now().toString(16).slice(-8)}`,
    }))
    setFormError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser) return

    const quantity = Number(form.quantity)
    const product = lookups.product(form.productId)
    const comment = form.comment.trim()

    if (!form.photoUrl) {
      setFormError('Добавьте фото продукции.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError('Укажите корректное количество.')
      return
    }

    if (comment.length < 10) {
      setFormError('Комментарий должен быть не короче 10 символов.')
      return
    }

    if (form.type === 'with_deduction' && !form.deductionEmployeeId) {
      setFormError('Выберите сотрудника для удержания.')
      return
    }

    try {
      setIsSaving(true)
      const result = await createWriteOff({
        outletId: form.outletId,
        productId: product.id,
        quantity,
        reasonId: form.reasonId,
        type: form.type,
        deductionEmployeeId:
          form.type === 'with_deduction' ? form.deductionEmployeeId : undefined,
        comment,
        photoUrl: form.photoUrl,
        photoName: form.photoName,
        photoHash: form.photoHash,
        createdById: currentUser.id,
      })
      setSelectedRequestId(result.request.id)
      setWebView('mine')
      setForm(createDefaultForm(data, currentUser))
      await refreshData()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось сохранить заявку.')
    } finally {
      setIsSaving(false)
    }
  }

  async function approveRequest(requestId: string) {
    if (!currentUser) return
    try {
      setIsSaving(true)
      setReviewError('')
      const result = await approveWriteOff(requestId, currentUser.id)
      setSelectedRequestId(result.request.id)
      await refreshData()
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Не удалось подтвердить заявку.')
    } finally {
      setIsSaving(false)
    }
  }

  async function rejectRequest(requestId: string) {
    if (!currentUser) return
    const reason = rejectionDraft.trim()
    if (reason.length < 8) {
      setReviewError('Укажите причину отклонения.')
      return
    }

    try {
      setIsSaving(true)
      setReviewError('')
      const result = await rejectWriteOff(requestId, currentUser.id, reason)
      setSelectedRequestId(result.request.id)
      setRejectionDraft('')
      await refreshData()
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Не удалось отклонить заявку.')
    } finally {
      setIsSaving(false)
    }
  }

  const homePath = currentUser?.role === 'reviewer' ? '/reviewer' : '/employee'

  return (
    <div className="app-shell web">
      <header className="brand-header">
        <div className="brand-left">
          <BahandiLogo />
          <div>
            <strong>Списание+</strong>
            <span>{currentUser ? currentUser.name : 'Вход в систему'}</span>
          </div>
        </div>

        {currentUser ? (
          <div className="header-actions">
            <button type="button" className="header-refresh" onClick={refreshData} disabled={isSaving}>
              <RefreshCw size={17} />
              Обновить
            </button>
            <button type="button" className="header-logout" onClick={handleLogout}>
              <LogOut size={17} />
              Выйти
            </button>
          </div>
        ) : null}
      </header>

      {apiError && (
        <div className="inline-alert site-alert">
          <AlertTriangle size={17} />
          {apiError}
        </div>
      )}

      {isLoading ? (
        <div className="loading-panel">
          <LoaderCircle size={26} />
          Загружаем систему...
        </div>
      ) : (
        <Routes>
          <Route
            path="/login"
            element={
              currentUser ? (
                <Navigate to={homePath} replace />
              ) : (
                <LoginPage
                  employees={data.employees}
                  selectedLoginId={selectedLoginId}
                  pinCode={pinCode}
                  authError={authError}
                  isSaving={isSaving}
                  onLogin={handleLogin}
                  onSelect={setSelectedLoginId}
                  onPinChange={setPinCode}
                />
              )
            }
          />
          <Route
            path="/employee"
            element={
              currentUser?.role === 'sender' ? (
                <EmployeePage
                  data={data}
                  currentUser={currentUser}
                  form={form}
                  formError={formError}
                  isSaving={isSaving}
                  myRequests={myRequests}
                  filteredRequests={filteredRequests}
                  webView={webView}
                  lookups={lookups}
                  searchTerm={searchTerm}
                  onWebViewChange={setWebView}
                  onSubmit={handleSubmit}
                  onFieldChange={setFormField}
                  onPhotoChange={handlePhotoChange}
                  onDemoPhoto={useDemoPhoto}
                  onSearch={setSearchTerm}
                />
              ) : (
                <Navigate to={currentUser ? '/reviewer' : '/login'} replace />
              )
            }
          />
          <Route
            path="/reviewer"
            element={
              currentUser?.role === 'reviewer' ? (
                <ReviewerPage
                  data={data}
                  metrics={metrics}
                  pendingRequests={pendingRequests}
                  selectedRequest={selectedRequest}
                  selectedRequestId={selectedRequestId}
                  filteredRequests={filteredRequests}
                  webView={webView}
                  lookups={lookups}
                  searchTerm={searchTerm}
                  reviewError={reviewError}
                  rejectionDraft={rejectionDraft}
                  isSaving={isSaving}
                  onWebViewChange={setWebView}
                  onSelect={setSelectedRequestId}
                  onSearch={setSearchTerm}
                  onApprove={approveRequest}
                  onReject={rejectRequest}
                  onRejectionDraft={setRejectionDraft}
                />
              ) : (
                <Navigate to={currentUser ? '/employee' : '/login'} replace />
              )
            }
          />
          <Route path="*" element={<Navigate to={currentUser ? homePath : '/login'} replace />} />
        </Routes>
      )}
    </div>
  )
}

export default App
