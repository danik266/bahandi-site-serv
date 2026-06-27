import { Hash } from 'lucide-react'

export function RiskItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash
  label: string
  value: number
}) {
  return (
    <div className={value > 0 ? 'risk-item warning' : 'risk-item ok'}>
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
