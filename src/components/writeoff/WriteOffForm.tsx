import type { ChangeEvent, FormEvent } from 'react'
import {
  AlertTriangle,
  Camera,
  Hash,
  ImagePlus,
  Sparkles,
  RefreshCw,
  Send,
  Upload,
} from 'lucide-react'
import { PanelTitle } from '../ui'
import { CostSummary, FormProgressBar } from './'
import type { BootstrapPayload, Employee, FormState, Lookups } from '../../types'

export function WriteOffForm({
  data,
  currentUser,
  form,
  formError,
  isSaving,
  isAnalyzing,
  aiHint,
  onHintChange,
  lookups,
  onSubmit,
  onFieldChange,
  onPhotoChange,
  onDemoPhoto,
  formMode,
  onFormModeChange,
  onAnalyze,
}: {
  data: BootstrapPayload
  currentUser: Employee
  form: FormState
  formError: string
  isSaving: boolean
  isAnalyzing: boolean
  lookups: Lookups
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFieldChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDemoPhoto: () => void
  aiHint: string
  onHintChange: (value: string) => void
  formMode: 'initial' | 'filling'
  onFormModeChange: (mode: 'initial' | 'filling') => void
  onAnalyze: () => void
}) {
  const selectedProduct = lookups.product(form.productId)
  const accessDetail =
    data.outlets.length === 1
      ? lookups.outlet(currentUser.outletId).name
      : `${data.outlets.length} доступные точки`

  const quantity = Number(form.quantity)

  // Calculate progress
  let completedFields = 0
  let totalFields = 5 // photo, outlet, product, quantity, reason
  if (form.photoUrl) completedFields++
  if (form.outletId) completedFields++
  if (form.productId) completedFields++
  if (Number.isFinite(quantity) && quantity > 0) completedFields++
  if (form.reasonId) completedFields++

  if (form.type === 'with_deduction') {
    totalFields += 2 // employee, reason
    if (form.deductionEmployeeId) completedFields++
    if (form.deductionReason) completedFields++
  }
  
  const reason = lookups.reason(form.reasonId)
  if (reason.name.toLowerCase().includes('просрочка')) {
    totalFields += 2
    if (form.productionDate) completedFields++
    if (form.expiryDate) completedFields++
  }
  if (reason.name.toLowerCase().includes('повреждение')) {
    totalFields += 2 // damageType, damageDiscoveredAt
    if (form.damageType) completedFields++
    if (form.damageDiscoveredAt) completedFields++
  }

  totalFields++ // comment
  if (form.comment.trim().length >= 10) completedFields++

  const percent = Math.round((completedFields / totalFields) * 100)

  return (
    <form className="panel writeoff-form" onSubmit={onSubmit}>
      <FormProgressBar percent={percent} />

      <PanelTitle
        icon={Camera}
        title="Новая заявка на списание"
        detail={`${currentUser.name} · ${accessDetail}`}
      />

      <div className="ai-hint-row">
        <label className="ai-hint-label">
          <span>Что случилось?</span>
          <input
            type="text"
            className="ai-hint-input"
            placeholder="Кратко опишите проблему (например: помялось, истекло, упало)..."
            value={aiHint}
            onChange={(e) => onHintChange(e.target.value)}
          />
        </label>
      </div>

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
            Загрузить
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPhotoChange}
            />
          </label>
          <button type="button" className="button orange-soft" onClick={onDemoPhoto}>
            <RefreshCw size={17} />
            Сделать
          </button>
        </div>
        {form.photoHash && (
          <div className="photo-meta">
            <Hash size={14} />
            {form.photoHash}
          </div>
        )}
      </div>

      {formMode === 'initial' ? (
        <div className="wizard-actions">
          <button 
            type="button" 
            className="button green wizard-ai-btn" 
            onClick={onAnalyze}
            disabled={isAnalyzing || !form.photoUrl}
          >
            {isAnalyzing ? 'Анализируем...' : 'Сгенерировать с ИИ'}
          </button>
          
          {formError && (
            <div className="inline-alert" style={{ marginTop: '12px' }}>
              <AlertTriangle size={17} />
              {formError}
            </div>
          )}
          
          <button 
            type="button" 
            className="button plain wizard-manual-btn"
            onClick={() => onFormModeChange('filling')}
          >
            Заполнить вручную
          </button>
        </div>
      ) : (
        <>


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

      <div className="form-row">
        <label>
          <span>Количество</span>
          <input
            min="1"
            step="1"
            type="number"
            value={form.quantity}
            onChange={(event) => onFieldChange('quantity', event.target.value)}
          />
          {(!Number.isFinite(quantity) || quantity <= 0) && (
            <small className="field-error">Укажите количество {'>'} 0</small>
          )}
        </label>
      </div>

      <CostSummary
        unitCost={selectedProduct.cost}
        quantity={quantity}
      />

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

      {/* Dynamic Fields based on Reason */}
      {reason.name.toLowerCase().includes('просрочка') && (
        <div className="form-row">
          <label>
            <span>Дата производства</span>
            <input
              type="date"
              value={form.productionDate}
              onChange={(e) => onFieldChange('productionDate', e.target.value)}
            />
          </label>
          <label>
            <span>Годен до</span>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => onFieldChange('expiryDate', e.target.value)}
            />
          </label>
        </div>
      )}

      {reason.name.toLowerCase().includes('повреждение') && (
        <div className="form-row">
          <label>
            <span>Вид повреждения</span>
            <select
              value={form.damageType}
              onChange={(e) => onFieldChange('damageType', e.target.value)}
            >
              <option value="">Выберите вид повреждения</option>
              <option value="Помято">Помято</option>
              <option value="Упало">Упало</option>
              <option value="Порвана упаковка">Порвана упаковка</option>
              <option value="Прочее">Прочее</option>
            </select>
          </label>
          <label>
            <span>Когда обнаружено</span>
            <select
              value={form.damageDiscoveredAt}
              onChange={(e) => onFieldChange('damageDiscoveredAt', e.target.value)}
            >
              <option value="">Выберите этап</option>
              <option value="При приемке">При приемке</option>
              <option value="При хранении">При хранении</option>
              <option value="В процессе готовки">В процессе готовки</option>
              <option value="Прочее">Прочее</option>
            </select>
          </label>
        </div>
      )}

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
        <>
          <div className="form-row">
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
              {!form.deductionEmployeeId && (
                <small className="field-error">Обязательно выберите сотрудника</small>
              )}
            </label>
            <label>
              <span>Причина удержания</span>
              <input
                type="text"
                placeholder="Например: Халатность"
                value={form.deductionReason}
                onChange={(e) => onFieldChange('deductionReason', e.target.value)}
              />
              {!form.deductionReason && (
                <small className="field-error">Укажите причину</small>
              )}
            </label>
          </div>
          <label>
            <span>Комментарий руководителя (опционально)</span>
            <input
              type="text"
              placeholder="Дополнительные примечания к удержанию"
              value={form.managerComment}
              onChange={(e) => onFieldChange('managerComment', e.target.value)}
            />
          </label>
        </>
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
        <small className={`field-hint ${form.comment.trim().length < 10 ? 'error' : 'ok'}`}>
          {form.comment.trim().length}/10 символов минимум
        </small>
      </label>

      {formError && (
        <div className="inline-alert">
          <AlertTriangle size={17} />
          {formError}
        </div>
      )}

      <button type="submit" className="button green submit-button" disabled={isSaving || percent < 100}>
        Отправить на проверку
        <Send size={18} />
      </button>
      </>
      )}
    </form>
  )
}
