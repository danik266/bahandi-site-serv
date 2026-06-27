import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Database,
  History,
  RotateCcw,
  X,
} from 'lucide-react'
import { Metric, PanelTitle } from '../components/ui'
import {
  AnalyticsView,
  HistoryView,
  RequestDetail,
  SwipeableRequestCard,
} from '../components/writeoff'
import { moneyFormatter } from '../lib/format'
import { DAILY_WRITEOFF_LIMIT } from '../lib/constants'
import { getRequestCost } from '../lib/request'
import { getFraudScore } from '../lib/scoring'
import type {
  BootstrapPayload,
  Lookups,
  Metrics,
  WebView,
  WriteOffRequest,
} from '../types'

// --- НОВОЕ: быстрые причины отказа для Bottom Sheet ---
const REJECT_REASONS = ['Некачественное фото', 'Недостаточно оснований', 'Обсудим лично']
const UNDO_MS = 5000

type LastAction = { id: string; type: 'approve' | 'reject'; reason?: string }

// --- НОВОЕ: варианты сортировки очереди ---
type SortBy = 'time' | 'sum' | 'risk'
const SORT_OPTIONS: Array<{ key: SortBy; label: string }> = [
  { key: 'time', label: 'Время' },
  { key: 'sum', label: 'Сумма' },
  { key: 'risk', label: 'Риск' },
]

export function ReviewerPage({
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
  approvalDraft,
  isSaving,
  onWebViewChange,
  onSelect,
  onSearch,
  onApprove,
  onReject,
  onRejectionDraft,
  onApprovalDraft,
  selectionMode,
  selectedIds,
  onLongPress,
  onToggleSelect,
  onBulkApprove,
  onBulkReject,
  onClearSelection,
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
  approvalDraft: string
  isSaving: boolean
  onWebViewChange: (view: WebView) => void
  onSelect: (requestId: string) => void
  onSearch: (value: string) => void
  onApprove: (requestId: string, comment?: string) => void
  onReject: (requestId: string, reason?: string) => void
  onRejectionDraft: (value: string) => void
  onApprovalDraft: (value: string) => void
  selectionMode: boolean
  selectedIds: string[]
  onLongPress: (requestId: string) => void
  onToggleSelect: (requestId: string) => void
  onBulkApprove: () => void
  onBulkReject: (reason: string) => void
  onClearSelection: () => void
}) {
  const limitUsed = metrics.totalAmount
  const limitPercent = Math.min(100, Math.round((limitUsed / DAILY_WRITEOFF_LIMIT) * 100))
  const limitOver = limitUsed > DAILY_WRITEOFF_LIMIT

  // --- НОВОЕ: локальные стейты свайпов (не трогают структуру списка) ---
  const [hiddenIds, setHiddenIds] = useState<string[]>([]) // оптимистично скрытые карточки
  const [sheetId, setSheetId] = useState<string | null>(null) // открытая шторка отказа
  const [lastAction, setLastAction] = useState<LastAction | null>(null) // для Undo
  const timerRef = useRef<number | null>(null)

  // --- НОВОЕ: сортировка очереди ---
  const [sortBy, setSortBy] = useState<SortBy>('time')

  // --- НОВОЕ: мобильный master-detail (список ⇄ анкета) ---
  const [detailOpen, setDetailOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    const handler = () => setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // При уходе с вкладки «Проверка» закрываем открытую анкету.
  useEffect(() => {
    if (webView !== 'review') setDetailOpen(false)
  }, [webView])

  function openDetail(requestId: string) {
    onSelect(requestId)
    setDetailOpen(true)
  }

  // --- НОВОЕ: шторка причины для массового отказа ---
  const [bulkRejecting, setBulkRejecting] = useState(false)

  function chooseBulkReason(reason: string) {
    setBulkRejecting(false)
    onBulkReject(reason)
  }

  // --- НОВОЕ: открытая запись истории + смена вердикта ---
  const [historyOpenId, setHistoryOpenId] = useState<string | null>(null)
  const [historyRejecting, setHistoryRejecting] = useState(false)
  const openedRecord = data.requests.find((request) => request.id === historyOpenId)

  function closeHistoryRecord() {
    setHistoryOpenId(null)
    setHistoryRejecting(false)
  }

  function verdictApprove() {
    if (openedRecord) onApprove(openedRecord.id)
  }

  function verdictReject(reason: string) {
    if (openedRecord) onReject(openedRecord.id, reason)
    setHistoryRejecting(false)
  }

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => clearTimer, [])

  // Финализируем действие на сервере через 5 секунд, если не нажали «Отменить».
  function scheduleFinalize(action: LastAction) {
    clearTimer()
    setLastAction(action)
    timerRef.current = window.setTimeout(() => {
      if (action.type === 'approve') onApprove(action.id)
      else onReject(action.id, action.reason)
      setLastAction(null)
      setHiddenIds((prev) => prev.filter((id) => id !== action.id))
      timerRef.current = null
    }, UNDO_MS)
  }

  function handleSwipeApprove(id: string) {
    if (navigator.vibrate) navigator.vibrate(50)
    setHiddenIds((prev) => [...prev, id])
    scheduleFinalize({ id, type: 'approve' })
  }

  function handleSwipeReject(id: string) {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    setHiddenIds((prev) => [...prev, id])
    setSheetId(id) // ждём выбор причины в шторке
  }

  function chooseReason(reason: string) {
    if (!sheetId) return
    const id = sheetId
    setSheetId(null)
    scheduleFinalize({ id, type: 'reject', reason })
  }

  // Закрытие шторки без выбора — карточка возвращается в список.
  function dismissSheet() {
    if (!sheetId) return
    const id = sheetId
    setSheetId(null)
    setHiddenIds((prev) => prev.filter((item) => item !== id))
  }

  function undoLast() {
    clearTimer()
    if (lastAction) {
      setHiddenIds((prev) => prev.filter((id) => id !== lastAction.id))
      setLastAction(null)
    }
  }

  const visiblePending = pendingRequests
    .filter((request) => !hiddenIds.includes(request.id))
    .sort((a, b) => {
      if (sortBy === 'sum') return getRequestCost(b, lookups) - getRequestCost(a, lookups)
      if (sortBy === 'risk') return (getFraudScore(b) ?? -1) - (getFraudScore(a) ?? -1)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return (
    <main className={`web-dashboard${selectedIds.length > 0 ? ' has-bulk-bar' : ''}`}>
      <nav className="web-tabs">
        <button
          type="button"
          className={webView === 'review' ? 'active' : ''}
          onClick={() => onWebViewChange('review')}
        >
          <ClipboardCheck size={18} />
          Проверка
          {pendingRequests.length > 0 && (
            <span className="tab-badge">{pendingRequests.length}</span>
          )}
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
          {(!isMobile || !detailOpen) && (
          <div className="panel queue-panel">
            <PanelTitle icon={ClipboardCheck} title="Очередь проверки" detail="На проверке" />

            <div className={`limit-meter${limitOver ? ' over' : ''}`}>
              <div className="limit-meter-head">
                <span>Лимит списаний на сегодня</span>
                <strong>
                  {moneyFormatter.format(limitUsed)} / {moneyFormatter.format(DAILY_WRITEOFF_LIMIT)}
                </strong>
              </div>
              <div className="limit-meter-track">
                <span className="limit-meter-fill" style={{ width: `${limitPercent}%` }} />
              </div>
            </div>

            <div className="queue-sort" role="group" aria-label="Сортировка">
              <span className="queue-sort-label">Сортировка:</span>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={sortBy === option.key ? 'active' : ''}
                  onClick={() => setSortBy(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="request-list">
              <AnimatePresence initial={false}>
                {visiblePending.map((request) => (
                  <motion.div
                    key={request.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  >
                    <SwipeableRequestCard
                      request={request}
                      active={selectedRequestId === request.id}
                      lookups={lookups}
                      onClick={() => openDetail(request.id)}
                      selectionMode={selectionMode}
                      selected={selectedIds.includes(request.id)}
                      onLongPress={() => onLongPress(request.id)}
                      onToggleSelect={() => onToggleSelect(request.id)}
                      onSwipeApprove={() => handleSwipeApprove(request.id)}
                      onSwipeReject={() => handleSwipeReject(request.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {visiblePending.length === 0 && (
                <div className="empty-state">
                  <BadgeCheck size={34} />
                  <strong>Очередь пуста</strong>
                </div>
              )}
            </div>
          </div>
          )}

          {(!isMobile || detailOpen) && (
          <motion.div
            className="panel detail-panel"
            key={selectedRequest.id}
            initial={isMobile ? { opacity: 0, x: 48 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          >
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

                <label>
                  <span>Комментарий к одобрению (необязательно)</span>
                  <textarea
                    rows={2}
                    value={approvalDraft}
                    placeholder="Например: проверено, всё корректно"
                    onChange={(event) => onApprovalDraft(event.target.value)}
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
                    onClick={() => onApprove(selectedRequest.id, approvalDraft)}
                  >
                    <Check size={18} />
                    Подтвердить в Iiko
                  </button>
                </div>
              </div>
            )}
          </motion.div>
          )}

          {isMobile && detailOpen && (
            <button
              type="button"
              className="detail-back-fab"
              onClick={() => setDetailOpen(false)}
              aria-label="Назад к очереди"
            >
              <ArrowLeft size={24} />
            </button>
          )}
        </section>
      )}

      {webView === 'history' && (
        <HistoryView
          requests={filteredRequests}
          title="История списаний"
          searchTerm={searchTerm}
          lookups={lookups}
          onSearch={onSearch}
          onOpenRecord={setHistoryOpenId}
        />
      )}

      {webView === 'analytics' && (
        <AnalyticsView data={data} metrics={metrics} lookups={lookups} />
      )}

      {/* --- Плавающая нижняя панель массового апрува/отказа --- */}
      {selectedIds.length > 0 && (
        <div className="bulk-bar" role="region" aria-label="Массовое решение">
          <div className="bulk-bar-inner">
            <button
              type="button"
              className="bulk-clear-btn"
              onClick={onClearSelection}
              aria-label="Отменить выбор"
            >
              <X size={22} />
            </button>
            <button
              type="button"
              className="button reject bulk-reject-btn"
              disabled={isSaving}
              onClick={() => setBulkRejecting(true)}
            >
              <X size={18} />
              Отклонить ({selectedIds.length})
            </button>
            <button
              type="button"
              className="button green bulk-approve-btn"
              disabled={isSaving}
              onClick={onBulkApprove}
            >
              <Check size={18} />
              Одобрить ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* --- НОВОЕ: шторка причины для массового отказа --- */}
      <AnimatePresence>
        {bulkRejecting && (
          <>
            <motion.div
              className="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBulkRejecting(false)}
            />
            <motion.div
              className="bottom-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            >
              <div className="sheet-handle" />
              <h3>Причина отказа для {selectedIds.length} заявок</h3>
              <div className="reason-chips">
                {REJECT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className="reason-chip"
                    disabled={isSaving}
                    onClick={() => chooseBulkReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- НОВОЕ: Undo-snackbar --- */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            className="undo-snackbar"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <span>{lastAction.type === 'approve' ? 'Заявка одобрена' : 'Заявка отклонена'}</span>
            <button type="button" className="undo-btn" onClick={undoLast}>
              <RotateCcw size={17} />
              Отменить
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- НОВОЕ: Bottom Sheet быстрых причин отказа --- */}
      <AnimatePresence>
        {sheetId && (
          <>
            <motion.div
              className="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissSheet}
            />
            <motion.div
              className="bottom-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            >
              <div className="sheet-handle" />
              <h3>Причина отказа</h3>
              <div className="reason-chips">
                {REJECT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className="reason-chip"
                    onClick={() => chooseReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- НОВОЕ: модалка записи истории + смена вердикта --- */}
      <AnimatePresence>
        {openedRecord && (
          <>
            <motion.div
              className="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeHistoryRecord}
            />
            <motion.div
              className="detail-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="detail-modal-head">
                <strong>Заявка #{openedRecord.id}</strong>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeHistoryRecord}
                  aria-label="Закрыть"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="detail-modal-body">
                <RequestDetail
                  request={openedRecord}
                  auditEvents={data.auditEvents.filter(
                    (event) => event.requestId === openedRecord.id,
                  )}
                  lookups={lookups}
                />
              </div>

              <div className="verdict-bar">
                {reviewError && (
                  <div className="inline-alert">
                    <AlertTriangle size={17} />
                    {reviewError}
                  </div>
                )}

                {historyRejecting ? (
                  <div className="verdict-reasons">
                    <span className="verdict-hint">Причина отказа</span>
                    <div className="reason-chips">
                      {REJECT_REASONS.map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          className="reason-chip"
                          disabled={isSaving}
                          onClick={() => verdictReject(reason)}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="verdict-cancel"
                      onClick={() => setHistoryRejecting(false)}
                    >
                      Назад
                    </button>
                  </div>
                ) : (
                  <div className="verdict-actions">
                    {openedRecord.status !== 'rejected' && (
                      <button
                        type="button"
                        className="button reject"
                        disabled={isSaving}
                        onClick={() => setHistoryRejecting(true)}
                      >
                        <X size={18} />
                        Отклонить
                      </button>
                    )}
                    {openedRecord.status !== 'approved' && (
                      <button
                        type="button"
                        className="button green"
                        disabled={isSaving}
                        onClick={verdictApprove}
                      >
                        <Check size={18} />
                        Одобрить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
