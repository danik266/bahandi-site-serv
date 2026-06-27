import type { ChangeEvent, FormEvent } from 'react'
import { ClipboardList, Send } from 'lucide-react'
import { HistoryView, SmartSidePanel, WriteOffForm } from '../components/writeoff'
import type {
  BootstrapPayload,
  Employee,
  FormState,
  Lookups,
  WebView,
  WriteOffRequest,
} from '../types'

export function EmployeePage({
  data,
  currentUser,
  form,
  formError,
  isSaving,
  isAnalyzing,
  filteredRequests,
  webView,
  lookups,
  searchTerm,
  onWebViewChange,
  onSubmit,
  onFieldChange,
  onPhotoChange,
  onDemoPhoto,
  onSearch,
  aiHint,
  onHintChange,
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
  filteredRequests: WriteOffRequest[]
  webView: WebView
  lookups: Lookups
  searchTerm: string
  onWebViewChange: (view: WebView) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFieldChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDemoPhoto: () => void
  onSearch: (value: string) => void
  aiHint: string
  onHintChange: (value: string) => void
  formMode: 'initial' | 'filling'
  onFormModeChange: (mode: 'initial' | 'filling') => void
  onAnalyze: () => void
}) {
  return (
    <main className="web-dashboard">
      <nav className="web-tabs two">
        <button
          type="button"
          className={webView === 'create' ? 'active' : ''}
          onClick={() => onWebViewChange('create')}
        >
          <Send size={18} />
          Новая заявка
        </button>
        <button
          type="button"
          className={webView === 'mine' ? 'active' : ''}
          onClick={() => onWebViewChange('mine')}
        >
          <ClipboardList size={18} />
          Мои заявки
        </button>
      </nav>

      {webView === 'create' ? (
        <section className="workspace create-grid">
          <WriteOffForm
            data={data}
            currentUser={currentUser}
            form={form}
            formError={formError}
            isSaving={isSaving}
            isAnalyzing={isAnalyzing}
            lookups={lookups}
            onSubmit={onSubmit}
            onFieldChange={onFieldChange}
            onPhotoChange={onPhotoChange}
            onDemoPhoto={onDemoPhoto}
            aiHint={aiHint}
            onHintChange={onHintChange}
            formMode={formMode}
            onFormModeChange={onFormModeChange}
            onAnalyze={onAnalyze}
          />
          <aside className="side-rail">
            <SmartSidePanel form={form} lookups={lookups} />
          </aside>
        </section>
      ) : (
        <HistoryView
          requests={filteredRequests}
          title="Мои заявки"
          searchTerm={searchTerm}
          lookups={lookups}
          onSearch={onSearch}
        />
      )}
    </main>
  )
}

