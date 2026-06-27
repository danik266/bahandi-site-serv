import { Database } from 'lucide-react'

export function InfoPanel({
  icon: Icon,
  title,
  rows,
}: {
  icon: typeof Database
  title: string
  rows: Array<[string, string]>
}) {
  return (
    <div className="info-panel">
      <div className="info-title">
        <Icon size={18} />
        <strong>{title}</strong>
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className="info-row">
          <span>{label}</span>
          <code>{value}</code>
        </div>
      ))}
    </div>
  )
}
