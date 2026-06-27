import { Camera } from 'lucide-react'

export function PanelTitle({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Camera
  title: string
  detail: string
}) {
  return (
    <div className="panel-title">
      <div>
        <Icon size={20} />
        <h2>{title}</h2>
      </div>
      <span>{detail}</span>
    </div>
  )
}
