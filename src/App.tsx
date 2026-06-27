import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { analyzePhoto } from './lib/ai'
import { clearDraft, loadDraft, saveDraft } from './lib/draft'
import { LoginPage } from './pages/LoginPage'
import { EmployeePage } from './pages/EmployeePage'
import { ReviewerPage } from './pages/ReviewerPage'
import { SubmitPreviewModal, SuccessToast } from './components/writeoff'
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
  // Восстанавливаем сессию из localStorage, чтобы перезагрузка страницы не разлогинивала.
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    try {
      const raw = localStorage.getItem('bahandi_user')
      return raw ? (JSON.parse(raw) as Employee) : null
    } catch {
      return null
    }
  })
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [webView, setWebView] = useState<WebView>('create')
  const [data, setData] = useState<BootstrapPayload>(emptyData)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  
  // Form State
  const [form, setForm] = useState<FormState>(createEmptyForm())
  const [formError, setFormError] = useState('')
  
  // Smart Features State
  const [formMode, setFormMode] = useState<'initial' | 'filling'>('initial')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiHint, setAiHint] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Reviewer State
  const [searchTerm, setSearchTerm] = useState('')
  const [rejectionDraft, setRejectionDraft] = useState('')
  const [approvalDraft, setApprovalDraft] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState('')
  // --- НОВОЕ: режим массового апрува (Zen Mode) ---
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const lookups = useMemo(() => createLookups(data), [data])

  const refreshData = useCallback(async (userOverride?: Employee | null) => {
    try {
      setApiError('')
      const activeUser = userOverride === undefined ? currentUser : userOverride
      const payload = await loadBootstrap(activeUser?.id)
      setData(payload)
      setSelectedRequestId((current) =>
        payload.requests.some((request) => request.id === current)
          ? current
          : payload.requests[0]?.id || '',
      )
      
      // Load Draft or Default
      if (!form.outletId) {
        if (activeUser?.role === 'sender') {
          const draft = loadDraft(activeUser.id)
          setForm(draft ? { ...createDefaultForm(payload, activeUser), ...draft } : createDefaultForm(payload, activeUser))
        } else {
          setForm(createDefaultForm(payload, activeUser ?? payload.employees[0]))
        }
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Не удалось загрузить данные')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, form.outletId])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  // Чтобы polling не дёргал список во время сохранения (апрув/отказ).
  const isSavingRef = useRef(isSaving)
  useEffect(() => {
    isSavingRef.current = isSaving
  }, [isSaving])

  // Авто-обновление очереди проверяющего (фоновый polling каждые 20с).
  useEffect(() => {
    if (currentUser?.role !== 'reviewer') return
    const POLL_MS = 20000
    const intervalId = window.setInterval(() => {
      // Пауза, если вкладка свёрнута или идёт сохранение.
      if (document.hidden || isSavingRef.current) return
      void refreshData()
    }, POLL_MS)
    return () => window.clearInterval(intervalId)
  }, [currentUser?.role, refreshData])

  // Draft Auto-Save (сотрудник, вкладка создания)
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'sender' || webView !== 'create') return
    const interval = setInterval(() => {
      saveDraft(currentUser.id, form)
    }, 5000)
    return () => clearInterval(interval)
  }, [currentUser, form, webView])

  // Кнопка «Обновить» — полная перезагрузка страницы (сессия сохранена в localStorage).
  function handleRefresh() {
    window.location.reload()
  }

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
      const result = await loginUser(login, password)
      const payload = await loadBootstrap(result.user.id)
      setCurrentUser(result.user)
      // Сохраняем сессию, чтобы пережить перезагрузку страницы.
      localStorage.setItem('bahandi_user', JSON.stringify(result.user))
      setData(payload)
      setWebView(result.user.role === 'sender' ? 'create' : 'review')
      
      if (result.user.role === 'sender') {
        const draft = loadDraft(result.user.id)
        setForm(draft ? { ...createDefaultForm(payload, result.user), ...draft } : createDefaultForm(payload, result.user))
      } else {
        setForm(createDefaultForm(payload, result.user))
      }
      
      setSelectedRequestId(payload.requests[0]?.id || '')
      setPassword('')
      navigate(result.user.role === 'sender' ? '/employee' : '/reviewer')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Не удалось войти')
    } finally {
      setIsSaving(false)
    }
  }

  function handleLogout() {
    setCurrentUser(null)
    localStorage.removeItem('bahandi_user')
    setPassword('')
    setAuthError('')
    setData(emptyData)
    setForm(createEmptyForm())
    setFormMode('initial')
    setAiHint('')
    setWebView('create')
    setSelectionMode(false)
    setSelectedIds([])
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

  async function handleAnalyze() {
    if (!form.photoUrl) return
    setIsAnalyzing(true)
    setFormError('')
    try {
      const result = await analyzePhoto(form.photoUrl, aiHint, data.products, data.reasons)
      // Auto-fill form and advance wizard step
      setForm((current) => ({
        ...current,
        productId: result.productId,
        reasonId: result.reasonId,
        quantity: String(result.quantity || 1),
        damageType: result.damageType || '',
        damageDiscoveredAt: result.damageDiscoveredAt || '',
        comment: result.generatedComment,
      }))
      setFormMode('filling')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка ИИ анализа')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function useDemoPhoto() {
    setForm((current) => ({
      ...current,
      photoUrl: '/writeoff-evidence.png',
      photoName: 'writeoff-evidence.png',
      photoHash: `sha256:web-demo-${Date.now().toString(16).slice(-8)}`,
      quantity: '5',
      comment: 'Тестовое автоматическое списание для проверки работы системы.',
      damageType: 'Помято',
      damageDiscoveredAt: 'При приемке товара',
      productionDate: '2026-06-25',
      expiryDate: '2026-06-27',
      deductionEmployeeId: data?.employees?.find(e => e.role === 'sender')?.id || '',
      deductionReason: 'Халатное отношение к продукции',
      managerComment: 'Сотрудник предупрежден о недопустимости подобных ошибок.',
    }))
    setFormError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser) return

    const quantity = Number(form.quantity)
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

    // Show preview modal instead of submitting directly
    setShowPreview(true)
  }

  async function confirmSubmit() {
    if (!currentUser) return
    const quantity = Number(form.quantity)
    const comment = form.comment.trim()

    try {
      setIsSaving(true)
      const result = await createWriteOff({
        outletId: form.outletId,
        productId: form.productId,
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
      
      // Cleanup draft and form state
      clearDraft(currentUser.id)
      setForm(createDefaultForm(data, currentUser))
      setFormMode('initial')
      setAiHint('')
      setShowPreview(false)
      
      setSuccessMessage(`Заявка №${result.request.id.slice(-4)} успешно создана`)
      setShowSuccessToast(true)
      
      setWebView('mine')
      await refreshData()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось сохранить заявку.')
      setShowPreview(false)
    } finally {
      setIsSaving(false)
    }
  }

  async function approveRequest(requestId: string, comment?: string) {
    if (!currentUser) return
    try {
      setIsSaving(true)
      setReviewError('')
      const trimmed = comment?.trim()
      const result = await approveWriteOff(requestId, currentUser.id, trimmed || undefined)
      setSelectedRequestId(result.request.id)
      setApprovalDraft('')
      await refreshData()
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Не удалось подтвердить заявку.')
    } finally {
      setIsSaving(false)
    }
  }

  async function rejectRequest(requestId: string, reasonOverride?: string) {
    if (!currentUser) return
    // reasonOverride приходит из быстрых причин (свайп влево), иначе берём из textarea.
    const reason = (reasonOverride ?? rejectionDraft).trim()
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

  // --- НОВОЕ: управление выбором заявок для массового апрува ---
  function startSelection(requestId: string) {
    setSelectionMode(true)
    setSelectedIds((prev) => (prev.includes(requestId) ? prev : [...prev, requestId]))
  }

  function toggleSelection(requestId: string) {
    setSelectedIds((prev) => {
      const next = prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
      if (next.length === 0) setSelectionMode(false)
      return next
    })
  }

  function clearSelection() {
    setSelectionMode(false)
    setSelectedIds([])
  }

  async function bulkApproveRequests() {
    if (!currentUser || selectedIds.length === 0) return
    try {
      setIsSaving(true)
      setReviewError('')
      for (const requestId of selectedIds) {
        await approveWriteOff(requestId, currentUser.id)
      }
      clearSelection()
      await refreshData()
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : 'Не удалось одобрить выбранные заявки.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Массовый отказ: одна причина применяется ко всем выбранным заявкам.
  async function bulkRejectRequests(reason: string) {
    if (!currentUser || selectedIds.length === 0) return
    try {
      setIsSaving(true)
      setReviewError('')
      for (const requestId of selectedIds) {
        await rejectWriteOff(requestId, currentUser.id, reason)
      }
      clearSelection()
      await refreshData()
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : 'Не удалось отклонить выбранные заявки.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Переключение вкладок проверяющего сбрасывает режим выбора.
  function handleReviewerWebView(view: WebView) {
    clearSelection()
    setWebView(view)
  }

  const homePath = currentUser?.role === 'reviewer' ? '/reviewer' : '/employee'

  return (
    <div className="app-shell web">
      {showPreview && (
        <SubmitPreviewModal
          form={form}
          lookups={lookups}
          onCancel={() => setShowPreview(false)}
          onConfirm={confirmSubmit}
          isSubmitting={isSaving}
        />
      )}
      
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

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
            <button type="button" className="header-refresh" onClick={handleRefresh}>
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
                  login={login}
                  password={password}
                  authError={authError}
                  isSaving={isSaving}
                  onLogin={handleLogin}
                  onLoginChange={setLogin}
                  onPasswordChange={setPassword}
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
                  isAnalyzing={isAnalyzing}
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
                  aiHint={aiHint}
                  onHintChange={setAiHint}
                  formMode={formMode}
                  onFormModeChange={setFormMode}
                  onAnalyze={handleAnalyze}
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
                  approvalDraft={approvalDraft}
                  isSaving={isSaving}
                  onWebViewChange={handleReviewerWebView}
                  onSelect={setSelectedRequestId}
                  onSearch={setSearchTerm}
                  onApprove={approveRequest}
                  onReject={rejectRequest}
                  onRejectionDraft={setRejectionDraft}
                  onApprovalDraft={setApprovalDraft}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onLongPress={startSelection}
                  onToggleSelect={toggleSelection}
                  onBulkApprove={bulkApproveRequests}
                  onBulkReject={bulkRejectRequests}
                  onClearSelection={clearSelection}
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

