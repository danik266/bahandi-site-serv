import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  XCircle,
} from 'lucide-react'
import type { BootstrapPayload, Status } from '../types'

export const statusCopy: Record<Status, string> = {
  pending: 'На проверке',
  approved: 'Подтверждено',
  rejected: 'Отклонено',
  iiko_error: 'Ошибка Iiko',
}

export const statusIcon: Record<Status, typeof Clock3> = {
  pending: Clock3,
  approved: CheckCircle2,
  rejected: XCircle,
  iiko_error: AlertTriangle,
}

export const emptyData: BootstrapPayload = {
  outlets: [],
  products: [],
  employees: [],
  reasons: [],
  requests: [],
  auditEvents: [],
  serverTime: '',
}
