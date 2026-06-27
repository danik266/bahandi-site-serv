export function BarList({
  items,
  unit,
}: {
  items: Array<{ label: string; value: number; percent: number }>
  unit: string
}) {
  return (
    <div className="bar-list">
      {items.map((item) => (
        <div key={item.label} className="bar-row">
          <div>
            <span>{item.label}</span>
            <strong>
              {Number.isInteger(item.value) ? item.value : item.value.toFixed(1)} {unit}
            </strong>
          </div>
          <div className="bar-track">
            <span style={{ width: `${item.percent}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
