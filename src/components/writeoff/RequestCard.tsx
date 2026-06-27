import { AlertTriangle, Eye } from 'lucide-react'
import { dateFormatter } from '../../lib/format'
import { getRequestCost } from '../../lib/request'
import type { Lookups, WriteOffRequest } from '../../types'

export function RequestCard({
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
          {request.quantity} {request.unit} · {dateFormatter.format(new Date(request.createdAt))}
        </small>
      </div>
      <Eye size={18} />
    </button>
  )
}
