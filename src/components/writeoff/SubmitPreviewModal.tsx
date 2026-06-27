import { CheckCircle2, X } from 'lucide-react'
import type { FormState, Lookups } from '../../types'
import { moneyFormatter } from '../../lib/format'

export function SubmitPreviewModal({
  form,
  lookups,
  onCancel,
  onConfirm,
  isSubmitting,
}: {
  form: FormState
  lookups: Lookups
  onCancel: () => void
  onConfirm: () => void
  isSubmitting: boolean
}) {
  const product = lookups.product(form.productId)
  const reason = lookups.reason(form.reasonId)
  const quantity = Number(form.quantity) || 0
  const totalCost = product.cost * quantity

  return (
    <div className="modal-overlay">
      <div className="modal-content submit-preview">
        <button className="modal-close" onClick={onCancel} disabled={isSubmitting}>
          <X size={20} />
        </button>

        <h2>Проверьте заявку</h2>

        <div className="preview-grid">
          <div className="preview-photo">
            <span>Фото</span>
            <img src={form.photoUrl} alt="Preview" />
          </div>

          <div className="preview-details">
            <div className="preview-row">
              <span>Товар</span>
              <strong>{product.name}</strong>
            </div>
            <div className="preview-row">
              <span>Количество</span>
              <strong>
                {form.quantity} шт.
              </strong>
            </div>
            <div className="preview-row">
              <span>Причина</span>
              <strong>{reason.name}</strong>
            </div>

            {reason.name.toLowerCase().includes('просрочка') && (
              <>
                <div className="preview-row">
                  <span>Производство</span>
                  <strong>{form.productionDate}</strong>
                </div>
                <div className="preview-row">
                  <span>Годен до</span>
                  <strong>{form.expiryDate}</strong>
                </div>
              </>
            )}

            {reason.name.toLowerCase().includes('повреждение') && (
              <>
                <div className="preview-row">
                  <span>Повреждение</span>
                  <strong>{form.damageType}</strong>
                </div>
                <div className="preview-row">
                  <span>Обнаружено</span>
                  <strong>{form.damageDiscoveredAt}</strong>
                </div>
              </>
            )}

            {totalCost > 0 && (
              <div className="preview-row">
                <span>Сумма списания</span>
                <strong>{moneyFormatter.format(totalCost)}</strong>
              </div>
            )}
            
            {form.type === 'with_deduction' && (
              <>
                <div className="preview-row">
                  <span>Удержание с</span>
                  <strong>
                    {lookups.employee(form.deductionEmployeeId).name || 'Не выбран'}
                  </strong>
                </div>
                <div className="preview-row">
                  <span>Причина удержания</span>
                  <strong>{form.deductionReason}</strong>
                </div>
                {form.managerComment && (
                  <div className="preview-row">
                    <span>Коммент. менеджера</span>
                    <strong>{form.managerComment}</strong>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="button white"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            type="button"
            className="button green"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            <CheckCircle2 size={18} />
            Подтвердить и отправить
          </button>
        </div>
      </div>
    </div>
  )
}
