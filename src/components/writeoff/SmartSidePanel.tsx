import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import type { FormState, Lookups } from '../../types'

type CheckItem = { label: string; ok: boolean }

export function SmartSidePanel({ form, lookups }: { form: FormState; lookups: Lookups }) {
  const quantity = Number(form.quantity)

  const reason = form.reasonId ? lookups.reason(form.reasonId) : null

  const checks: CheckItem[] = [
    { label: 'Фото загружено', ok: Boolean(form.photoUrl) },
    { label: 'Продукт выбран', ok: Boolean(form.productId) },
    { label: 'Количество корректно', ok: Number.isFinite(quantity) && quantity > 0 },
    { label: 'Причина выбрана', ok: Boolean(form.reasonId) },
    ...(reason && reason.name.toLowerCase().includes('просрочка')
      ? [
          { label: 'Дата производства', ok: Boolean(form.productionDate) },
          { label: 'Срок годности', ok: Boolean(form.expiryDate) },
        ]
      : []),
    ...(reason && reason.name.toLowerCase().includes('повреждение')
      ? [
          { label: 'Вид повреждения', ok: Boolean(form.damageType) },
          { label: 'Когда обнаружено', ok: Boolean(form.damageDiscoveredAt) },
        ]
      : []),
    { label: 'Комментарий достаточный', ok: form.comment.trim().length >= 10 },
    ...(form.type === 'with_deduction'
      ? [
          { label: 'Сотрудник для удержания', ok: Boolean(form.deductionEmployeeId) },
          { label: 'Причина удержания', ok: Boolean(form.deductionReason) },
        ]
      : []),
  ]

  const passedCount = checks.filter((c) => c.ok).length
  const allOk = passedCount === checks.length

  return (
    <div className={`smart-panel ${allOk ? 'smart-panel--ready' : ''}`}>
      <div className="smart-panel-title">
        <ShieldCheck size={17} />
        Проверка заявки
      </div>

      <div className="smart-checks">
        {checks.map((check) => (
          <div key={check.label} className={`smart-check ${check.ok ? 'ok' : 'fail'}`}>
            {check.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            <span>{check.label}</span>
          </div>
        ))}
      </div>

      {allOk ? (
        <div className="smart-ready">
          <CheckCircle2 size={16} />
          Заявка готова к отправке
        </div>
      ) : (
        <div className="smart-progress-hint">
          {passedCount} из {checks.length} условий выполнено
        </div>
      )}
    </div>
  )
}
