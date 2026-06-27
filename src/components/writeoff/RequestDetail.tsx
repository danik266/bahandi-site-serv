import {
  CircleDollarSign,
  Database,
  MapPin,
  MessageSquareText,
  Scale,
  ShieldCheck,
  Store,
  UserRound,
  XCircle,
} from 'lucide-react'
import { Fact, InfoPanel, StatusBadge } from '../ui'
import { statusIcon } from '../../lib/constants'
import { dateFormatter, moneyFormatter } from '../../lib/format'
import { getRequestCost } from '../../lib/request'
import type { AuditEvent, Lookups, WriteOffRequest } from '../../types'

export function RequestDetail({
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
  const photos = request.photoUrls?.length ? request.photoUrls : [request.photoUrl]

  return (
    <div className="request-detail">
      <div className="detail-photo">
        <img src={photos[0]} alt={`Фото заявки ${request.id}`} />
      </div>
      {photos.length > 1 && (
        <div className="detail-photo-strip" aria-label="Дополнительные фото">
          {photos.map((photoUrl, index) => (
            <img key={`${photoUrl}-${index}`} src={photoUrl} alt="" />
          ))}
        </div>
      )}

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
          {reviewer.name} · {request.reviewedAt ? dateFormatter.format(new Date(request.reviewedAt)) : ''}
        </div>
      )}

      <div className="audit-feed">
        {auditEvents.map((event) => (
          <div key={event.id}>
            <span>{dateFormatter.format(new Date(event.createdAt))}</span>
            <strong>{event.action}</strong>
            <small>{lookups.employee(event.userId).name}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
