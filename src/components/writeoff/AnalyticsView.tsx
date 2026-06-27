import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  Database,
  FileText,
  Hash,
  MessageSquareText,
  PieChart,
  Scale,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { BarList, Metric, PanelTitle, RiskItem } from '../ui'
import { buildBars, countDuplicateHashes, getRequestCost } from '../../lib/request'
import type { BootstrapPayload, Lookups, Metrics, WriteOffRequest } from '../../types'

type Segment = { label: string; value: number; color: string }

export function AnalyticsView({
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

  // Кольцевая диаграмма по статусам.
  const statusSegments: Segment[] = [
    { label: 'Подтверждено', value: metrics.approved, color: 'var(--green)' },
    { label: 'Отклонено', value: metrics.rejected, color: 'var(--red)' },
    { label: 'На проверке', value: metrics.pending, color: 'var(--orange)' },
    { label: 'Ошибка Iiko', value: metrics.iikoErrors, color: '#6b6259' },
  ].filter((segment) => segment.value > 0)
  const statusTotal = data.requests.length

  // Тренд за последние 7 дней (кол-во заявок).
  const trend = buildDailyTrend(data.requests)
  const trendMax = Math.max(1, ...trend.map((day) => day.count))

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
        <PanelTitle icon={PieChart} title="Статусы заявок" detail="всего" />
        <div className="donut-wrap">
          <div className="donut" style={{ background: buildConic(statusSegments, statusTotal) }}>
            <div className="donut-center">
              <strong>{statusTotal}</strong>
              <span>заявок</span>
            </div>
          </div>
          <div className="donut-legend">
            {statusSegments.length === 0 && <span className="donut-empty">Нет данных</span>}
            {statusSegments.map((segment) => (
              <div key={segment.label} className="legend-item">
                <span className="legend-dot" style={{ background: segment.color }} />
                <span className="legend-label">{segment.label}</span>
                <strong>{segment.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <PanelTitle icon={CalendarRange} title="Динамика за 7 дней" detail="заявки" />
        <div className="trend-chart">
          {trend.map((day) => (
            <div key={day.key} className="trend-col">
              <span className="trend-count">{day.count}</span>
              <div className="trend-bar-track">
                <span
                  className="trend-bar"
                  style={{ height: `${day.count === 0 ? 2 : (day.count / trendMax) * 100}%` }}
                />
              </div>
              <span className="trend-day">{day.label}</span>
            </div>
          ))}
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

// Собираем conic-gradient из сегментов для кольцевой диаграммы.
function buildConic(segments: Segment[], total: number) {
  if (total <= 0 || segments.length === 0) return 'var(--surface-soft)'
  let acc = 0
  const stops = segments.map((segment) => {
    const start = (acc / total) * 100
    acc += segment.value
    const end = (acc / total) * 100
    return `${segment.color} ${start}% ${end}%`
  })
  return `conic-gradient(${stops.join(', ')})`
}

// Последние 7 дней: метка-число дня + количество заявок.
function buildDailyTrend(requests: WriteOffRequest[]) {
  const base = new Date()
  const days: Array<{ key: string; label: string; count: number }> = []
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(base)
    date.setDate(base.getDate() - offset)
    const key = date.toISOString().slice(0, 10)
    const count = requests.filter((request) => request.createdAt.startsWith(key)).length
    days.push({ key, label: String(date.getDate()), count })
  }
  return days
}
