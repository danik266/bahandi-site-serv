import { statusCopy, statusIcon } from '../../lib/constants'
import type { Status } from '../../types'

export function StatusBadge({ status }: { status: Status }) {
  const Icon = statusIcon[status]
  return (
    <span className={`status-badge ${status}`}>
      <Icon size={15} />
      {statusCopy[status]}
    </span>
  )
}
