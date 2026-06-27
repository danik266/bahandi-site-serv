import { Clock3 } from 'lucide-react'

export function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock3
  label: string
  value: string | number
  tone: 'orange' | 'green' | 'black' | 'red'
}) {
  return (
    <div className={`metric ${tone}`}>
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
