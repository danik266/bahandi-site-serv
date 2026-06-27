export function FormProgressBar({ percent }: { percent: number }) {
  const color =
    percent >= 100 ? 'var(--green)' : percent >= 60 ? 'var(--orange)' : '#c1c1bb'

  return (
    <div className="form-progress">
      <div className="form-progress-header">
        <span>Заполнение формы</span>
        <strong style={{ color }}>{percent}%</strong>
      </div>
      <div className="form-progress-track">
        <div
          className="form-progress-fill"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
    </div>
  )
}
