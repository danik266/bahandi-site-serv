export type ClientMode = 'mobile' | 'web'
export type Role = 'sender' | 'reviewer'
export type MobileView = 'create' | 'mine'
export type WebView = 'create' | 'mine' | 'review' | 'history' | 'analytics'
export type Status = 'pending' | 'approved' | 'rejected' | 'iiko_error'
export type WriteOffType = 'without_deduction' | 'with_deduction'

export type Outlet = {
  id: string
  name: string
  address: string
  iikoStoreId: string
}

export type Product = {
  id: string
  name: string
  unit: string
  iikoProductId: string
  cost: number
  category: string
}

export type Employee = {
  id: string
  name: string
  role: Role
  login: string
  outletId: string
  outletIds: string[]
  accessScope: 'assigned' | 'all'
  iikoEmployeeId: string
}

export type Reason = {
  id: string
  name: string
}

export type WriteOffRequest = {
  id: string
  outletId: string
  productId: string
  quantity: number
  unit: string
  reasonId: string
  type: WriteOffType
  deductionEmployeeId?: string
  comment: string
  photoUrl: string
  photoName: string
  photoHash: string
  status: Status
  createdById: string
  reviewedById?: string
  rejectionReason?: string
  iikoDocumentId?: string
  iikoStatusMessage?: string
  createdAt: string
  reviewedAt?: string
}

export type AuditEvent = {
  id: string
  requestId: string
  userId: string
  action: string
  createdAt: string
}

export type BootstrapPayload = {
  outlets: Outlet[]
  products: Product[]
  employees: Employee[]
  reasons: Reason[]
  requests: WriteOffRequest[]
  auditEvents: AuditEvent[]
  serverTime: string
}

export type FormState = {
  outletId: string
  productId: string
  quantity: string
  reasonId: string
  type: WriteOffType
  deductionEmployeeId: string
  comment: string
  photoUrl: string
  photoName: string
  photoHash: string
}

export type CreateRequestPayload = {
  outletId: string
  productId: string
  quantity: number
  reasonId: string
  type: WriteOffType
  deductionEmployeeId?: string
  comment: string
  photoUrl: string
  photoName: string
  photoHash: string
  createdById: string
}

export type Lookups = {
  outlet: (id: string) => Outlet
  product: (id: string) => Product
  employee: (id: string) => Employee
  reason: (id: string) => Reason
}

export type Metrics = {
  today: number
  pending: number
  approved: number
  rejected: number
  iikoErrors: number
  withDeduction: number
  totalAmount: number
}
