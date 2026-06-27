import { Clock3, Database } from 'lucide-react'
import { StatusBadge } from '../ui'
import { dateFormatter } from '../../lib/format'
import type { Lookups, WriteOffRequest } from '../../types'

export function HistoryRow({
  request,
  lookups,
  onOpen,
}: {
  request: WriteOffRequest
  lookups: Lookups
  // Если передан — строка становится кликабельной (история проверяющего).
  onOpen?: () => void
}) {
  const product = lookups.product(request.productId)
  const outlet = lookups.outlet(request.outletId)

  const content = (
    <>
      <img src={request.photoUrl} alt="" />
      <div className="history-main">
        <strong>#{request.id} · {product.name}</strong>
        <span>{outlet.name}</span>
      </div>
      <div className="history-meta">
        <span>
          {request.quantity} {request.unit}
        </span>
        <small>{dateFormatter.format(new Date(request.createdAt))}</small>
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
    </>
  )

  if (onOpen) {
    return (
      <button type="button" className="history-row history-row-button" onClick={onOpen}>
        {content}
      </button>
    )
  }

  return <article className="history-row">{content}</article>
}
