export const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
  style: 'currency',
  currency: 'KZT',
})

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}
