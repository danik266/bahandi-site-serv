import {
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Database,
  FileText,
  Hash,
  MessageSquareText,
  Scale,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { BarList, Metric, PanelTitle, RiskItem } from '../ui'
import { buildBars, countDuplicateHashes, getRequestCost } from '../../lib/request'
import type { BootstrapPayload, Lookups, Metrics } from '../../types'

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
