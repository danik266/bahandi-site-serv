import type { BootstrapPayload, Employee, FormState } from '../types'

export function createDefaultForm(data: BootstrapPayload, user?: Employee): FormState {
  const preferredOutletId = user?.outletIds?.[0] ?? user?.outletId
  const outlet = data.outlets.find((item) => item.id === preferredOutletId) ?? data.outlets[0]
  return {
    outletId: outlet?.id ?? '',
    productId: data.products[0]?.id ?? '',
    quantity: '1',
    reasonId: data.reasons[0]?.id ?? '',
    type: 'without_deduction',
    deductionEmployeeId: '',
    comment: '',
    photoUrl: '',
    photoName: '',
    photoHash: '',
    damageType: '',
    damageDiscoveredAt: '',
    productionDate: '',
    expiryDate: '',
    deductionReason: '',
    managerComment: '',
  }
}

export function createEmptyForm(): FormState {
  return {
    outletId: '',
    productId: '',
    quantity: '1',
    reasonId: '',
    type: 'without_deduction',
    deductionEmployeeId: '',
    comment: '',
    photoUrl: '',
    photoName: '',
    photoHash: '',
    damageType: '',
    damageDiscoveredAt: '',
    productionDate: '',
    expiryDate: '',
    deductionReason: '',
    managerComment: '',
  }
}

