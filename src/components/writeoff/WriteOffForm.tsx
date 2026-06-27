import type { ChangeEvent, FormEvent } from 'react'
import {
  AlertTriangle,
  Camera,
  Hash,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Send,
  Upload,
} from 'lucide-react'
import { PanelTitle } from '../ui'
import type { BootstrapPayload, Employee, FormState, Lookups } from '../../types'

export function WriteOffForm({
  data,
  currentUser,
  form,
  formError,
  isSaving,
  lookups,
  onSubmit,
  onFieldChange,
  onPhotoChange,
  onDemoPhoto,
}: {
  data: BootstrapPayload
  currentUser: Employee
  form: FormState
  formError: string
  isSaving: boolean
  lookups: Lookups
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFieldChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDemoPhoto: () => void
}) {
  const selectedProduct = lookups.product(form.productId)

  return (
    <form className="panel writeoff-form" onSubmit={onSubmit}>
      <PanelTitle
        icon={Camera}
        title="Новая заявка на списание"
        detail={`${currentUser.name} · ${lookups.outlet(currentUser.outletId).name}`}
      />

      <div className="photo-uploader">
        <div className="photo-preview">
          {form.photoUrl ? (
            <img src={form.photoUrl} alt="Фото продукции для списания" />
          ) : (
            <div className="empty-photo">
              <ImagePlus size={30} />
              <span>Фото продукции</span>
            </div>
          )}
        </div>
        <div className="photo-actions">
          <label className="button white">
            <Upload size={17} />
            Фото
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPhotoChange}
            />
          </label>
          <button type="button" className="button orange-soft" onClick={onDemoPhoto}>
            <RefreshCw size={17} />
            Demo
          </button>
        </div>
        {form.photoHash && (
          <div className="photo-meta">
            <Hash size={14} />
            {form.photoHash}
          </div>
        )}
      </div>

      <div className="form-row">
        <label>
          <span>Торговая точка</span>
          <select
            value={form.outletId}
            onChange={(event) => onFieldChange('outletId', event.target.value)}
          >
            {data.outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Продукт</span>
          <select
            value={form.productId}
            onChange={(event) => onFieldChange('productId', event.target.value)}
          >
            {data.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row compact">
        <label>
          <span>Количество</span>
          <input
            min="0"
            step="0.1"
            type="number"
            value={form.quantity}
            onChange={(event) => onFieldChange('quantity', event.target.value)}
          />
        </label>
        <label>
          <span>Ед.</span>
          <input value={selectedProduct.unit} readOnly />
        </label>
      </div>

      <label>
        <span>Причина</span>
        <select
          value={form.reasonId}
          onChange={(event) => onFieldChange('reasonId', event.target.value)}
        >
          {data.reasons.map((reason) => (
            <option key={reason.id} value={reason.id}>
              {reason.name}
            </option>
          ))}
        </select>
      </label>

      <div className="segmented">
        <button
          type="button"
          className={form.type === 'without_deduction' ? 'active' : ''}
          onClick={() => onFieldChange('type', 'without_deduction')}
        >
          Без удержания
        </button>
        <button
          type="button"
          className={form.type === 'with_deduction' ? 'active' : ''}
          onClick={() => onFieldChange('type', 'with_deduction')}
        >
          С удержанием
        </button>
      </div>

      {form.type === 'with_deduction' && (
        <label>
          <span>Сотрудник</span>
          <select
            value={form.deductionEmployeeId}
            onChange={(event) => onFieldChange('deductionEmployeeId', event.target.value)}
          >
            <option value="">Выберите сотрудника</option>
            {data.employees
              .filter((employee) => employee.role === 'sender')
              .map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
          </select>
        </label>
      )}

      <label>
        <span>Комментарий</span>
        <textarea
          value={form.comment}
          rows={4}
          maxLength={280}
          placeholder="Например: булочки повреждены при приемке"
          onChange={(event) => onFieldChange('comment', event.target.value)}
        />
      </label>

      {formError && (
        <div className="inline-alert">
          <AlertTriangle size={17} />
          {formError}
        </div>
      )}

      <button type="submit" className="button green submit-button" disabled={isSaving}>
        {isSaving ? <LoaderCircle size={18} /> : <Send size={18} />}
        Отправить на проверку
      </button>
    </form>
  )
}
