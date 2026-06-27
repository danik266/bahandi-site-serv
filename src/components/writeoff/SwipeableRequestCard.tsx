import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { RequestCard } from './RequestCard'
import type { Lookups, WriteOffRequest } from '../../types'

const SWIPE_THRESHOLD = 100
const FLY_OUT = 520

// Обёртка над существующей карточкой: Tinder-style свайп через Framer Motion.
// Сама карточка (RequestCard) не меняется — все жесты живут здесь.
export function SwipeableRequestCard({
  request,
  lookups,
  active,
  onClick,
  selectionMode,
  selected,
  onLongPress,
  onToggleSelect,
  onSwipeApprove,
  onSwipeReject,
}: {
  request: WriteOffRequest
  lookups: Lookups
  active: boolean
  onClick: () => void
  selectionMode: boolean
  selected: boolean
  onLongPress: () => void
  onToggleSelect: () => void
  onSwipeApprove: () => void
  onSwipeReject: () => void
}) {
  const x = useMotionValue(0)
  // Фон проявляется по мере утягивания карточки.
  const approveOpacity = useTransform(x, [10, SWIPE_THRESHOLD], [0, 1])
  const rejectOpacity = useTransform(x, [-SWIPE_THRESHOLD, -10], [1, 0])

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const offset = info.offset.x

    if (offset > SWIPE_THRESHOLD) {
      animate(x, FLY_OUT, { duration: 0.2, ease: 'easeIn', onComplete: onSwipeApprove })
    } else if (offset < -SWIPE_THRESHOLD) {
      animate(x, -FLY_OUT, { duration: 0.2, ease: 'easeIn', onComplete: onSwipeReject })
    } else {
      // Короткий свайп — snap back.
      animate(x, 0, { type: 'spring', stiffness: 520, damping: 36 })
    }
  }

  return (
    <div className="swipe-shell">
      <motion.div className="swipe-bg approve" style={{ opacity: approveOpacity }} aria-hidden="true">
        <Check size={24} />
        <span>Одобрить</span>
      </motion.div>
      <motion.div className="swipe-bg reject" style={{ opacity: rejectOpacity }} aria-hidden="true">
        <span>Отклонить</span>
        <X size={24} />
      </motion.div>

      <motion.div
        className="swipe-fg"
        style={{ x }}
        drag={selectionMode ? false : 'x'}
        dragElastic={0.6}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        <RequestCard
          request={request}
          lookups={lookups}
          active={active}
          onClick={onClick}
          selectionMode={selectionMode}
          selected={selected}
          onLongPress={onLongPress}
          onToggleSelect={onToggleSelect}
        />
      </motion.div>
    </div>
  )
}
