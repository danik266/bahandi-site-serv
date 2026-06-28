import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { AlertTriangle, CheckCircle2, Circle, Eye } from 'lucide-react'
import { dateFormatter } from '../../lib/format'
import { getRequestPhotoUrls } from '../../lib/media'
import { getRequestCost } from '../../lib/request'
import { getScoreTone } from '../../lib/scoring'
import type { Lookups, WriteOffRequest } from '../../types'

const LONG_PRESS_MS = 450
const MOVE_TOLERANCE = 12

export function RequestCard({
  request,
  active,
  lookups,
  onClick,
  // --- НОВОЕ: режим массового выбора ---
  selectionMode = false,
  selected = false,
  onLongPress,
  onToggleSelect,
}: {
  request: WriteOffRequest
  active: boolean
  lookups: Lookups
  onClick: () => void
  selectionMode?: boolean
  selected?: boolean
  onLongPress?: () => void
  onToggleSelect?: () => void
}) {
  const product = lookups.product(request.productId)
  const outlet = lookups.outlet(request.outletId)
  const risk = getRequestCost(request, lookups) > 1000 || request.type === 'with_deduction'
  // --- НОВОЕ: AI-скоринг ---
  const tone = getScoreTone(request)
  const photos = getRequestPhotoUrls(request)

  // --- НОВОЕ: long-press логика (без захламления UI чекбоксами) ---
  const timerRef = useRef<number | null>(null)
  const longPressed = useRef(false)
  const startPoint = useRef<{ x: number; y: number } | null>(null)

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    longPressed.current = false
    startPoint.current = { x: event.clientX, y: event.clientY }
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      longPressed.current = true
      onLongPress?.()
    }, LONG_PRESS_MS)
  }

  // Отменяем long-press, если палец «поехал» (скролл списка).
  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!startPoint.current) return
    const dx = Math.abs(event.clientX - startPoint.current.x)
    const dy = Math.abs(event.clientY - startPoint.current.y)
    if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) clearTimer()
  }

  function handlePointerEnd() {
    clearTimer()
  }

  function handleClick() {
    clearTimer()
    // Если только что сработал long-press — клик игнорируем.
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    if (selectionMode) {
      onToggleSelect?.()
    } else {
      onClick()
    }
  }

  const className = [
    'request-card',
    active && !selectionMode ? 'active' : '',
    selected ? 'selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      {tone && <span className={`score-dot score-${tone}`} aria-hidden="true" />}
      <span className="request-card-photo">
        <img className={tone ? `score-${tone}` : undefined} src={photos[0]} alt="" />
        {photos.length > 1 && <small>{photos.length}</small>}
      </span>
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
      {selectionMode ? (
        selected ? (
          <CheckCircle2 size={20} className="select-icon on" />
        ) : (
          <Circle size={20} className="select-icon" />
        )
      ) : (
        <Eye size={18} />
      )}
    </button>
  )
}
