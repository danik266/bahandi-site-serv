import { moneyFormatter } from '../../lib/format'

export function CostSummary({
  unitCost,
  quantity,
}: {
  unitCost: number
  quantity: number
}) {
  if (!unitCost || !Number.isFinite(quantity) || quantity <= 0) return null
  const total = unitCost * quantity

  return (
    <div className="cost-summary">
      <div className="cost-row">
        <span>Цена за единицу</span>
        <strong>{moneyFormatter.format(unitCost)}</strong>
      </div>
      <div className="cost-row">
        <span>Количество</span>
        <strong>
          {quantity} шт.
        </strong>
      </div>
      <div className="cost-row cost-total">
        <span>Итого к списанию</span>
        <strong>{moneyFormatter.format(total)}</strong>
      </div>
    </div>
  )
}
