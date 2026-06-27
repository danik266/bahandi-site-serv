import type {
  BootstrapPayload,
  Employee,
  Lookups,
  Outlet,
  Product,
  Reason,
} from '../types'

export const fallbackOutlet: Outlet = {
  id: 'outlet-fallback',
  name: 'Bahandi',
  address: 'Алматы',
  iikoStoreId: 'store_demo',
}

export const fallbackProduct: Product = {
  id: 'product-fallback',
  name: 'Продукт',
  unit: 'шт',
  iikoProductId: 'prd_demo',
  cost: 0,
  category: 'Demo',
}

export const fallbackEmployee: Employee = {
  id: 'user-fallback',
  name: 'Пользователь',
  role: 'sender',
  login: 'user',
  outletId: 'outlet-fallback',
  outletIds: ['outlet-fallback'],
  accessScope: 'assigned',
  iikoEmployeeId: 'emp_demo',
}

export const fallbackReason: Reason = {
  id: 'reason-fallback',
  name: 'Причина',
}

export function createLookups(data: BootstrapPayload): Lookups {
  return {
    outlet: (id) => data.outlets.find((outlet) => outlet.id === id) ?? fallbackOutlet,
    product: (id) => data.products.find((product) => product.id === id) ?? fallbackProduct,
    employee: (id) => data.employees.find((employee) => employee.id === id) ?? fallbackEmployee,
    reason: (id) => data.reasons.find((reason) => reason.id === id) ?? fallbackReason,
  }
}
