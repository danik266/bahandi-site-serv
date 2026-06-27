import { useMemo, useState } from 'react'
import { BarChart3, Download } from 'lucide-react'
import { PanelTitle } from '../ui'
import { moneyFormatter } from '../../lib/format'
import { getRequestCost } from '../../lib/request'
import type { BootstrapPayload, Lookups, Metrics } from '../../types'

type StatsTab = 'outlets' | 'employees' | 'reasons'
type StatsItem = {
  id: string
  name: string
  detail?: string
  amount: number
}

export function AnalyticsView({
  data,
  metrics,
  lookups,
}: {
  data: BootstrapPayload
  metrics: Metrics
  lookups: Lookups
}) {
  const [activeTab, setActiveTab] = useState<StatsTab>('outlets')

  const approvedRequests = useMemo(
    () => data.requests.filter((request) => request.status === 'approved'),
    [data.requests],
  )
  const totalSum = approvedRequests.reduce(
    (sum, request) => sum + getRequestCost(request, lookups),
    0,
  )
  const deductionsSum = approvedRequests
    .filter((request) => request.type === 'with_deduction')
    .reduce((sum, request) => sum + getRequestCost(request, lookups), 0)
  const averageSum = metrics.approved > 0 ? totalSum / metrics.approved : 0

  const outletStats = useMemo<StatsItem[]>(() => {
    const totals = new Map<string, number>()
    approvedRequests.forEach((request) => {
      totals.set(request.outletId, (totals.get(request.outletId) ?? 0) + getRequestCost(request, lookups))
    })

    return data.outlets
      .map((outlet) => ({
        id: outlet.id,
        name: outlet.name,
        detail: outlet.city,
        amount: totals.get(outlet.id) ?? 0,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [approvedRequests, data.outlets, lookups])

  const employeeStats = useMemo<StatsItem[]>(() => {
    const totals = new Map<string, number>()
    approvedRequests.forEach((request) => {
      totals.set(request.createdById, (totals.get(request.createdById) ?? 0) + getRequestCost(request, lookups))
    })

    return data.employees
      .map((employee) => ({
        id: employee.id,
        name: employee.name,
        detail: employee.role === 'sender' ? 'Сотрудник' : 'Проверяющий',
        amount: totals.get(employee.id) ?? 0,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [approvedRequests, data.employees, lookups])

  const reasonStats = useMemo<StatsItem[]>(() => {
    const totals = new Map<string, number>()
    approvedRequests.forEach((request) => {
      totals.set(request.reasonId, (totals.get(request.reasonId) ?? 0) + getRequestCost(request, lookups))
    })

    return data.reasons
      .map((reason) => ({
        id: reason.id,
        name: reason.name,
        amount: totals.get(reason.id) ?? 0,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [approvedRequests, data.reasons, lookups])

  const activeStats =
    activeTab === 'outlets'
      ? outletStats
      : activeTab === 'employees'
        ? employeeStats
        : reasonStats
  const maxAmount = Math.max(1, ...activeStats.map((item) => item.amount))

  function exportAnalytics() {
    const rows = [
      ['id', 'status', 'outlet', 'employee', 'product', 'quantity', 'amount', 'createdAt'],
      ...data.requests.map((request) => [
        request.id,
        request.status,
        lookups.outlet(request.outletId).name,
        lookups.employee(request.createdById).name,
        lookups.product(request.productId).name,
        String(request.quantity),
        String(getRequestCost(request, lookups)),
        request.createdAt,
      ]),
    ]
    const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bahandi-stat-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="workspace analytics-grid mobile-like-stats">
      <div className="panel analytics-summary">
        <div className="analytics-title-row">
          <PanelTitle icon={BarChart3} title="Сводные данные" detail="утверждено" />
          <button type="button" className="analytics-export" onClick={exportAnalytics}>
            <Download size={17} />
            Экспорт
          </button>
        </div>

        <div className="stats-kpi-grid">
          <div className="stats-kpi-card green">
            <span>Сумма списаний</span>
            <strong>{moneyFormatter.format(totalSum)}</strong>
          </div>
          <div className="stats-kpi-card red">
            <span>Сумма удержаний</span>
            <strong>{moneyFormatter.format(deductionsSum)}</strong>
          </div>
          <div className="stats-kpi-card">
            <span>Среднее списание</span>
            <strong>{moneyFormatter.format(averageSum)}</strong>
          </div>
          <div className="stats-kpi-card">
            <span>Всего заявок</span>
            <strong>{data.requests.length} шт</strong>
            <small>
              Утв: {metrics.approved} · Откл: {metrics.rejected} · Ожид: {metrics.pending}
            </small>
          </div>
        </div>
      </div>

      <div className="stats-segmented" role="tablist" aria-label="Статистика">
        <button
          type="button"
          className={activeTab === 'outlets' ? 'active' : ''}
          onClick={() => setActiveTab('outlets')}
        >
          По точкам
        </button>
        <button
          type="button"
          className={activeTab === 'employees' ? 'active' : ''}
          onClick={() => setActiveTab('employees')}
        >
          Сотрудники
        </button>
        <button
          type="button"
          className={activeTab === 'reasons' ? 'active' : ''}
          onClick={() => setActiveTab('reasons')}
        >
          Причины
        </button>
      </div>

      <div className="panel stats-list-panel">
        {activeStats.length === 0 ? (
          <div className="empty-state stats-empty">
            <strong>Пока нет утвержденных заявок</strong>
          </div>
        ) : (
          activeStats.map((item) => (
            <div key={item.id} className="stats-chart-item">
              <div className="stats-chart-head">
                <div>
                  <strong>{item.name}</strong>
                  {item.detail && <span>{item.detail}</span>}
                </div>
                <b>{moneyFormatter.format(item.amount)}</b>
              </div>
              <div className="stats-progress">
                <span style={{ width: `${Math.max(4, (item.amount / maxAmount) * 100)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}
