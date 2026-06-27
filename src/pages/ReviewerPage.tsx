import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Database,
  History,
  X,
} from 'lucide-react'
import { Metric, PanelTitle } from '../components/ui'
import {
  AnalyticsView,
  HistoryView,
  RequestCard,
  RequestDetail,
} from '../components/writeoff'
import { moneyFormatter } from '../lib/format'
import type {
  BootstrapPayload,
  Lookups,
  Metrics,
  WebView,
  WriteOffRequest,
} from '../types'

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
