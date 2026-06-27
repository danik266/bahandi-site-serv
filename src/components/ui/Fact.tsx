import { Store } from 'lucide-react'

export function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Store
  label: string
  value: string
}) {
  return (
    <div className="fact">
      <Icon size={17} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
