import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Database,
  Eye,
  FileText,
  Hash,
  History,
  ImagePlus,
  LoaderCircle,
  LogOut,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Store,
  Upload,
  UserCheck,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'
import {
  approveWriteOff,
  createWriteOff,
  loadBootstrap,
  loginUser,
  rejectWriteOff,
} from './api'
import type {
  AuditEvent,
  BootstrapPayload,
  Employee,
  FormState,
  Outlet,
  Product,
  Reason,
  Status,
  WebView,
  WriteOffRequest,
} from './types'
import './App.css'

type Lookups = {
  outlet: (id: string) => Outlet
  product: (id: string) => Product
  employee: (id: string) => Employee
  reason: (id: string) => Reason
}

type Metrics = {
  today: number
  pending: number
  approved: number
  rejected: number
  iikoErrors: number
  withDeduction: number
  totalAmount: number
}

const emptyData: BootstrapPayload = {
  outlets: [],
  products: [],
  employees: [],
  reasons: [],
  requests: [],
  auditEvents: [],
  serverTime: '',
}

const fallbackOutlet: Outlet = {
  id: 'outlet-fallback',
  name: 'Bahandi',
  address: 'Алматы',
  iikoStoreId: 'store_demo',
}

const fallbackProduct: Product = {
  id: 'product-fallback',
  name: 'Продукт',
  unit: 'шт',
  iikoProductId: 'prd_demo',
  cost: 0,
  category: 'Demo',
}

const fallbackEmployee: Employee = {
  id: 'user-fallback',
  name: 'Пользователь',
  role: 'sender',
  outletId: 'outlet-fallback',
  iikoEmployeeId: 'emp_demo',
}

const fallbackReason: Reason = {
  id: 'reason-fallback',
  name: 'Причина',
}

const statusCopy: Record<Status, string> = {
  pending: 'На проверке',
  approved: 'Подтверждено',
  rejected: 'Отклонено',
  iiko_error: 'Ошибка Iiko',
}

const statusIcon: Record<Status, typeof Clock3> = {
  pending: Clock3,
  approved: CheckCircle2,
  rejected: XCircle,
  iiko_error: AlertTriangle,
}

const formatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
  style: 'currency',
  currency: 'KZT',
})

function App() {
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
      ) : !currentUser ? (
        <LoginView
          employees={data.employees}
          selectedLoginId={selectedLoginId}
          pinCode={pinCode}
          authError={authError}
          isSaving={isSaving}
          onLogin={handleLogin}
          onSelect={setSelectedLoginId}
          onPinChange={setPinCode}
        />
      ) : currentUser.role === 'sender' ? (
        <SenderDashboard
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
        <ReviewerDashboard
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
      )}
    </div>
  )
}

function LoginView({
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

function SenderDashboard({
  data,
  currentUser,
  form,
  formError,
  isSaving,
  myRequests,
  filteredRequests,
  webView,
  lookups,
  searchTerm,
  onWebViewChange,
  onSubmit,
  onFieldChange,
  onPhotoChange,
  onDemoPhoto,
  onSearch,
}: {
  data: BootstrapPayload
  currentUser: Employee
  form: FormState
  formError: string
  isSaving: boolean
  myRequests: WriteOffRequest[]
  filteredRequests: WriteOffRequest[]
  webView: WebView
  lookups: Lookups
  searchTerm: string
  onWebViewChange: (view: WebView) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFieldChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDemoPhoto: () => void
  onSearch: (value: string) => void
}) {
  return (
    <main className="web-dashboard">
      <nav className="web-tabs two">
        <button
          type="button"
          className={webView === 'create' ? 'active' : ''}
          onClick={() => onWebViewChange('create')}
        >
          <Send size={18} />
          Новая заявка
        </button>
        <button
          type="button"
          className={webView === 'mine' ? 'active' : ''}
          onClick={() => onWebViewChange('mine')}
        >
          <ClipboardList size={18} />
          Мои заявки
        </button>
      </nav>

      {webView === 'create' ? (
        <section className="workspace create-grid">
          <WriteOffForm
            data={data}
            currentUser={currentUser}
            form={form}
            formError={formError}
            isSaving={isSaving}
            lookups={lookups}
            onSubmit={onSubmit}
            onFieldChange={onFieldChange}
            onPhotoChange={onPhotoChange}
            onDemoPhoto={onDemoPhoto}
          />
          <aside className="side-rail">
            <InfoPanel
              icon={Store}
              title="Текущий доступ"
              rows={[
                ['role', 'sender'],
                ['outlet', lookups.outlet(currentUser.outletId).name],
                ['employeeId', currentUser.iikoEmployeeId],
                ['requests', String(myRequests.length)],
              ]}
            />
          </aside>
        </section>
      ) : (
        <HistoryView
          requests={filteredRequests}
          title="Мои заявки"
          searchTerm={searchTerm}
          lookups={lookups}
          onSearch={onSearch}
        />
      )}
    </main>
  )
}

function ReviewerDashboard({
  data,
  metrics,
  pendingRequests,
  selectedRequest,
  selectedRequestId,
  filteredRequests,
  webView,
  lookups,
  searchTerm,
  reviewError,
  rejectionDraft,
  isSaving,
  onWebViewChange,
  onSelect,
  onSearch,
  onApprove,
  onReject,
  onRejectionDraft,
}: {
  data: BootstrapPayload
  metrics: Metrics
  pendingRequests: WriteOffRequest[]
  selectedRequest?: WriteOffRequest
  selectedRequestId: string
  filteredRequests: WriteOffRequest[]
  webView: WebView
  lookups: Lookups
  searchTerm: string
  reviewError: string
  rejectionDraft: string
  isSaving: boolean
  onWebViewChange: (view: WebView) => void
  onSelect: (requestId: string) => void
  onSearch: (value: string) => void
  onApprove: (requestId: string) => void
  onReject: (requestId: string) => void
  onRejectionDraft: (value: string) => void
}) {
  return (
    <main className="web-dashboard">
      <nav className="web-tabs">
        <button
          type="button"
          className={webView === 'review' ? 'active' : ''}
          onClick={() => onWebViewChange('review')}
        >
          <ClipboardCheck size={18} />
          Проверка
        </button>
        <button
          type="button"
          className={webView === 'history' ? 'active' : ''}
          onClick={() => onWebViewChange('history')}
        >
          <History size={18} />
          История
        </button>
        <button
          type="button"
          className={webView === 'analytics' ? 'active' : ''}
          onClick={() => onWebViewChange('analytics')}
        >
          <BarChart3 size={18} />
          Аналитика
        </button>
      </nav>

      <section className="status-strip">
        <Metric icon={Clock3} label="На проверке" value={metrics.pending} tone="orange" />
        <Metric icon={CheckCircle2} label="Подтверждено" value={metrics.approved} tone="green" />
        <Metric
          icon={CircleDollarSign}
          label="С удержанием"
          value={metrics.withDeduction}
          tone="black"
        />
        <Metric
          icon={Database}
          label="Сумма сегодня"
          value={moneyFormatter.format(metrics.totalAmount)}
          tone="orange"
        />
      </section>

      {webView === 'review' && selectedRequest && (
        <section className="workspace review-grid">
          <div className="panel queue-panel">
            <PanelTitle icon={ClipboardCheck} title="Очередь проверки" detail="pending" />
            <div className="request-list">
              {pendingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  active={selectedRequestId === request.id}
                  lookups={lookups}
                  onClick={() => onSelect(request.id)}
                />
              ))}
              {pendingRequests.length === 0 && (
                <div className="empty-state">
                  <BadgeCheck size={34} />
                  <strong>Очередь пуста</strong>
                </div>
              )}
            </div>
          </div>

          <div className="panel detail-panel">
            <RequestDetail
              request={selectedRequest}
              auditEvents={data.auditEvents.filter(
                (event) => event.requestId === selectedRequest.id,
              )}
              lookups={lookups}
            />

            {selectedRequest.status === 'pending' && (
              <div className="decision-panel">
                <label>
                  <span>Причина отклонения</span>
                  <textarea
                    rows={3}
                    value={rejectionDraft}
                    placeholder="Например: фото не подтверждает количество"
                    onChange={(event) => onRejectionDraft(event.target.value)}
                  />
                </label>

                {reviewError && (
                  <div className="inline-alert">
                    <AlertTriangle size={17} />
                    {reviewError}
                  </div>
                )}

                <div className="decision-actions">
                  <button
                    type="button"
                    className="button reject"
                    disabled={isSaving}
                    onClick={() => onReject(selectedRequest.id)}
                  >
                    <X size={18} />
                    Отклонить
                  </button>
                  <button
                    type="button"
                    className="button green"
                    disabled={isSaving}
                    onClick={() => onApprove(selectedRequest.id)}
                  >
                    <Check size={18} />
                    Подтвердить в Iiko
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {webView === 'history' && (
        <HistoryView
          requests={filteredRequests}
          title="История списаний"
          searchTerm={searchTerm}
          lookups={lookups}
          onSearch={onSearch}
        />
      )}

      {webView === 'analytics' && (
        <AnalyticsView data={data} metrics={metrics} lookups={lookups} />
      )}
    </main>
  )
}

function WriteOffForm({
  data,
  currentUser,
  form,
  formError,
  isSaving,
  lookups,
  onSubmit,
  onFieldChange,
  onPhotoChange,
  onDemoPhoto,
}: {
  data: BootstrapPayload
  currentUser: Employee
  form: FormState
  formError: string
  isSaving: boolean
  lookups: Lookups
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFieldChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDemoPhoto: () => void
}) {
  const selectedProduct = lookups.product(form.productId)

  return (
    <form className="panel writeoff-form" onSubmit={onSubmit}>
      <PanelTitle
        icon={Camera}
        title="Новая заявка на списание"
        detail={`${currentUser.name} · ${lookups.outlet(currentUser.outletId).name}`}
      />

      <div className="photo-uploader">
        <div className="photo-preview">
          {form.photoUrl ? (
            <img src={form.photoUrl} alt="Фото продукции для списания" />
          ) : (
            <div className="empty-photo">
              <ImagePlus size={30} />
              <span>Фото продукции</span>
            </div>
          )}
        </div>
        <div className="photo-actions">
          <label className="button white">
            <Upload size={17} />
            Фото
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPhotoChange}
            />
          </label>
          <button type="button" className="button orange-soft" onClick={onDemoPhoto}>
            <RefreshCw size={17} />
            Demo
          </button>
        </div>
        {form.photoHash && (
          <div className="photo-meta">
            <Hash size={14} />
            {form.photoHash}
          </div>
        )}
      </div>

      <div className="form-row">
        <label>
          <span>Торговая точка</span>
          <select
            value={form.outletId}
            onChange={(event) => onFieldChange('outletId', event.target.value)}
          >
            {data.outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Продукт</span>
          <select
            value={form.productId}
            onChange={(event) => onFieldChange('productId', event.target.value)}
          >
            {data.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row compact">
        <label>
          <span>Количество</span>
          <input
            min="0"
            step="0.1"
            type="number"
            value={form.quantity}
            onChange={(event) => onFieldChange('quantity', event.target.value)}
          />
        </label>
        <label>
          <span>Ед.</span>
          <input value={selectedProduct.unit} readOnly />
        </label>
      </div>

      <label>
        <span>Причина</span>
        <select
          value={form.reasonId}
          onChange={(event) => onFieldChange('reasonId', event.target.value)}
        >
          {data.reasons.map((reason) => (
            <option key={reason.id} value={reason.id}>
              {reason.name}
            </option>
          ))}
        </select>
      </label>

      <div className="segmented">
        <button
          type="button"
          className={form.type === 'without_deduction' ? 'active' : ''}
          onClick={() => onFieldChange('type', 'without_deduction')}
        >
          Без удержания
        </button>
        <button
          type="button"
          className={form.type === 'with_deduction' ? 'active' : ''}
          onClick={() => onFieldChange('type', 'with_deduction')}
        >
          С удержанием
        </button>
      </div>

      {form.type === 'with_deduction' && (
        <label>
          <span>Сотрудник</span>
          <select
            value={form.deductionEmployeeId}
            onChange={(event) => onFieldChange('deductionEmployeeId', event.target.value)}
          >
            <option value="">Выберите сотрудника</option>
            {data.employees
              .filter((employee) => employee.role === 'sender')
              .map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
          </select>
        </label>
      )}

      <label>
        <span>Комментарий</span>
        <textarea
          value={form.comment}
          rows={4}
          maxLength={280}
          placeholder="Например: булочки повреждены при приемке"
          onChange={(event) => onFieldChange('comment', event.target.value)}
        />
      </label>

      {formError && (
        <div className="inline-alert">
          <AlertTriangle size={17} />
          {formError}
        </div>
      )}

      <button type="submit" className="button green submit-button" disabled={isSaving}>
        {isSaving ? <LoaderCircle size={18} /> : <Send size={18} />}
        Отправить на проверку
      </button>
    </form>
  )
}

function HistoryView({
  requests,
  title,
  searchTerm,
  lookups,
  onSearch,
}: {
  requests: WriteOffRequest[]
  title: string
  searchTerm: string
  lookups: Lookups
  onSearch: (value: string) => void
}) {
  return (
    <section className="workspace single-column">
      <div className="panel">
        <PanelTitle icon={History} title={title} detail={`${requests.length} записей`} />
        <label className="search-field">
          <Search size={17} />
          <input
            type="search"
            value={searchTerm}
            placeholder="Поиск по ID, точке или продукту"
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
        <div className="history-table">
          {requests.map((request) => (
            <HistoryRow key={request.id} request={request} lookups={lookups} />
          ))}
        </div>
      </div>
    </section>
  )
}

function AnalyticsView({
  data,
  metrics,
  lookups,
}: {
  data: BootstrapPayload
  metrics: Metrics
  lookups: Lookups
}) {
  const byReason = buildBars(
    data.reasons.map((reason) => ({
      label: reason.name,
      value: data.requests.filter((request) => request.reasonId === reason.id).length,
    })),
  )
  const byProduct = buildBars(
    data.products.map((product) => ({
      label: product.name,
      value: data.requests
        .filter((request) => request.productId === product.id)
        .reduce((sum, request) => sum + request.quantity, 0),
    })),
  )
  const duplicatePhotoCount = countDuplicateHashes(data.requests)
  const highValueCount = data.requests.filter((request) => getRequestCost(request, lookups) > 1000).length

  return (
    <section className="workspace analytics-grid">
      <div className="panel analytics-summary">
        <PanelTitle icon={BarChart3} title="Итоги смены" detail="сегодня" />
        <div className="analytics-cards">
          <Metric icon={FileText} label="Заявок сегодня" value={metrics.today} tone="black" />
          <Metric icon={CheckCircle2} label="Закрыто" value={metrics.approved} tone="green" />
          <Metric icon={XCircle} label="Отклонено" value={metrics.rejected} tone="red" />
          <Metric
            icon={Database}
            label="В Iiko"
            value={metrics.approved - metrics.iikoErrors}
            tone="orange"
          />
        </div>
      </div>

      <div className="panel">
        <PanelTitle icon={MessageSquareText} title="Причины" detail="top" />
        <BarList items={byReason} unit="заяв." />
      </div>

      <div className="panel">
        <PanelTitle icon={Scale} title="Продукты" detail="qty" />
        <BarList items={byProduct} unit="ед." />
      </div>

      <div className="panel control-panel">
        <PanelTitle icon={ShieldCheck} title="Контроль" detail="flags" />
        <RiskItem icon={Hash} label="Повтор фото" value={duplicatePhotoCount} />
        <RiskItem icon={CircleDollarSign} label="Высокая сумма" value={highValueCount} />
        <RiskItem icon={UserCheck} label="Удержания" value={metrics.withDeduction} />
      </div>
    </section>
  )
}

function RequestDetail({
  request,
  auditEvents,
  lookups,
}: {
  request: WriteOffRequest
  auditEvents: AuditEvent[]
  lookups: Lookups
}) {
  const product = lookups.product(request.productId)
  const outlet = lookups.outlet(request.outletId)
  const author = lookups.employee(request.createdById)
  const reviewer = request.reviewedById ? lookups.employee(request.reviewedById) : undefined
  const StatusIcon = statusIcon[request.status]

  return (
    <div className="request-detail">
      <div className="detail-photo">
        <img src={request.photoUrl} alt={`Фото заявки ${request.id}`} />
      </div>

      <div className="detail-header">
        <div>
          <span className="eyebrow">Заявка #{request.id}</span>
          <h1>{product.name}</h1>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="fact-grid">
        <Fact icon={Store} label="Точка" value={outlet.name} />
        <Fact icon={MapPin} label="Адрес" value={outlet.address} />
        <Fact icon={Scale} label="Количество" value={`${request.quantity} ${request.unit}`} />
        <Fact
          icon={CircleDollarSign}
          label="Оценка"
          value={moneyFormatter.format(getRequestCost(request, lookups))}
        />
        <Fact icon={UserRound} label="Отправил" value={author.name} />
        <Fact
          icon={ShieldCheck}
          label="Тип"
          value={request.type === 'with_deduction' ? 'С удержанием' : 'Без удержания'}
        />
      </div>

      {request.type === 'with_deduction' && request.deductionEmployeeId && (
        <div className="deduction-banner">
          <CircleDollarSign size={18} />
          Удержание: {lookups.employee(request.deductionEmployeeId).name}
        </div>
      )}

      <div className="comment-block">
        <MessageSquareText size={18} />
        <p>{request.comment}</p>
      </div>

      <InfoPanel
        icon={Database}
        title="Iiko adapter"
        rows={[
          ['documentType', 'WRITEOFF_DOCUMENT'],
          ['storeId', outlet.iikoStoreId],
          ['productId', product.iikoProductId],
          ['documentId', request.iikoDocumentId ?? 'ожидает подтверждения'],
        ]}
      />

      {request.rejectionReason && (
        <div className="rejection-note">
          <XCircle size={18} />
          {request.rejectionReason}
        </div>
      )}

      {reviewer && (
        <div className="review-note">
          <StatusIcon size={18} />
          {reviewer.name} · {request.reviewedAt ? formatter.format(new Date(request.reviewedAt)) : ''}
        </div>
      )}

      <div className="audit-feed">
        {auditEvents.map((event) => (
          <div key={event.id}>
            <span>{formatter.format(new Date(event.createdAt))}</span>
            <strong>{event.action}</strong>
            <small>{lookups.employee(event.userId).name}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function RequestCard({
  request,
  active,
  lookups,
  onClick,
}: {
  request: WriteOffRequest
  active: boolean
  lookups: Lookups
  onClick: () => void
}) {
  const product = lookups.product(request.productId)
  const outlet = lookups.outlet(request.outletId)
  const risk = getRequestCost(request, lookups) > 1000 || request.type === 'with_deduction'

  return (
    <button type="button" className={`request-card ${active ? 'active' : ''}`} onClick={onClick}>
      <img src={request.photoUrl} alt="" />
      <div>
        <div className="request-card-title">
          <strong>#{request.id} · {product.name}</strong>
          {risk && <AlertTriangle size={16} />}
        </div>
        <span>{outlet.name}</span>
        <small>
          {request.quantity} {request.unit} · {formatter.format(new Date(request.createdAt))}
        </small>
      </div>
      <Eye size={18} />
    </button>
  )
}

function HistoryRow({
  request,
  lookups,
}: {
  request: WriteOffRequest
  lookups: Lookups
}) {
  const product = lookups.product(request.productId)
  const outlet = lookups.outlet(request.outletId)

  return (
    <article className="history-row">
      <img src={request.photoUrl} alt="" />
      <div className="history-main">
        <strong>#{request.id} · {product.name}</strong>
        <span>{outlet.name}</span>
      </div>
      <div className="history-meta">
        <span>
          {request.quantity} {request.unit}
        </span>
        <small>{formatter.format(new Date(request.createdAt))}</small>
      </div>
      <StatusBadge status={request.status} />
      <div className="history-doc">
        {request.iikoDocumentId ? (
          <>
            <Database size={15} />
            {request.iikoDocumentId}
          </>
        ) : (
          <>
            <Clock3 size={15} />
            Нет акта
          </>
        )}
      </div>
    </article>
  )
}

function BahandiLogo() {
  return (
    <div className="bahandi-logo" aria-label="Bahandi">
      <span />
      <strong>BAHANDI</strong>
      <span />
    </div>
  )
}

function PanelTitle({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Camera
  title: string
  detail: string
}) {
  return (
    <div className="panel-title">
      <div>
        <Icon size={20} />
        <h2>{title}</h2>
      </div>
      <span>{detail}</span>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock3
  label: string
  value: string | number
  tone: 'orange' | 'green' | 'black' | 'red'
}) {
  return (
    <div className={`metric ${tone}`}>
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function InfoPanel({
  icon: Icon,
  title,
  rows,
}: {
  icon: typeof Database
  title: string
  rows: Array<[string, string]>
}) {
  return (
    <div className="info-panel">
      <div className="info-title">
        <Icon size={18} />
        <strong>{title}</strong>
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className="info-row">
          <span>{label}</span>
          <code>{value}</code>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const Icon = statusIcon[status]
  return (
    <span className={`status-badge ${status}`}>
      <Icon size={15} />
      {statusCopy[status]}
    </span>
  )
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Store
  label: string
  value: string
}) {
  return (
    <div className="fact">
      <Icon size={17} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function BarList({
  items,
  unit,
}: {
  items: Array<{ label: string; value: number; percent: number }>
  unit: string
}) {
  return (
    <div className="bar-list">
      {items.map((item) => (
        <div key={item.label} className="bar-row">
          <div>
            <span>{item.label}</span>
            <strong>
              {Number.isInteger(item.value) ? item.value : item.value.toFixed(1)} {unit}
            </strong>
          </div>
          <div className="bar-track">
            <span style={{ width: `${item.percent}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function RiskItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash
  label: string
  value: number
}) {
  return (
    <div className={value > 0 ? 'risk-item warning' : 'risk-item ok'}>
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function createDefaultForm(data: BootstrapPayload, user?: Employee): FormState {
  const outlet = data.outlets.find((item) => item.id === user?.outletId) ?? data.outlets[0]
  return {
    outletId: outlet?.id ?? '',
    productId: data.products[0]?.id ?? '',
    quantity: '1',
    reasonId: data.reasons[0]?.id ?? '',
    type: 'without_deduction',
    deductionEmployeeId: '',
    comment: '',
    photoUrl: '',
    photoName: '',
    photoHash: '',
  }
}

function createEmptyForm(): FormState {
  return {
    outletId: '',
    productId: '',
    quantity: '1',
    reasonId: '',
    type: 'without_deduction',
    deductionEmployeeId: '',
    comment: '',
    photoUrl: '',
    photoName: '',
    photoHash: '',
  }
}

function createLookups(data: BootstrapPayload): Lookups {
  return {
    outlet: (id) => data.outlets.find((outlet) => outlet.id === id) ?? fallbackOutlet,
    product: (id) => data.products.find((product) => product.id === id) ?? fallbackProduct,
    employee: (id) => data.employees.find((employee) => employee.id === id) ?? fallbackEmployee,
    reason: (id) => data.reasons.find((reason) => reason.id === id) ?? fallbackReason,
  }
}

function getRequestCost(request: WriteOffRequest, lookups: Lookups) {
  return request.quantity * lookups.product(request.productId).cost
}

function buildBars(items: Array<{ label: string; value: number }>) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return items
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ ...item, percent: Math.max(8, (item.value / max) * 100) }))
}

function countDuplicateHashes(requests: WriteOffRequest[]) {
  return requests.filter((request, index, list) =>
    list.findIndex((item) => item.photoHash === request.photoHash) !== index,
  ).length
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsDataURL(file)
  })
}

async function hashText(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export default App
