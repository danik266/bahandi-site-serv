import type { CreateEmployeePayload, CreateRequestPayload, Employee, WriteOffRequest } from '../types'
import { requestJson } from './client'

export async function createWriteOff(payload: CreateRequestPayload) {
  return requestJson<{ request: WriteOffRequest }>('/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function approveWriteOff(
  requestId: string,
  reviewedById: string,
  comment?: string,
) {
  return requestJson<{ request: WriteOffRequest }>(`/requests/${requestId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify(comment ? { reviewedById, comment } : { reviewedById }),
  })
}

export async function rejectWriteOff(
  requestId: string,
  reviewedById: string,
  rejectionReason: string,
) {
  return requestJson<{ request: WriteOffRequest }>(`/requests/${requestId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewedById, rejectionReason }),
  })
}

export async function createEmployee(payload: CreateEmployeePayload) {
  return requestJson<{ user: Employee }>('/employees', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
