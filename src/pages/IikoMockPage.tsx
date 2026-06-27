import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Database,
  FileJson2,
  Radio,
  RefreshCw,
} from 'lucide-react'
import { API_BASE } from '../api/client'
import { loadIikoMockDocuments } from '../api/iiko'
import type { IikoMockDocument } from '../types'

type StreamState = 'connecting' | 'live' | 'error'

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'KZT',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export function IikoMockPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<IikoMockDocument[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [streamState, setStreamState] = useState<StreamState>('connecting')
  const [error, setError] = useState('')
  const [lastEventAt, setLastEventAt] = useState('')

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedId) ?? documents[0],
    [documents, selectedId],
  )

  useEffect(() => {
    let isMounted = true

    async function loadDocuments() {
      try {
        setError('')
        const result = await loadIikoMockDocuments()
        if (!isMounted) return
        setDocuments(result.documents)
        setSelectedId((current) => current || result.documents[0]?.id || '')
      } catch (requestError) {
        if (!isMounted) return
        setError(requestError instanceof Error ? requestError.message : 'Не удалось загрузить Iiko mock')
      }
    }

    void loadDocuments()

    const stream = new EventSource(`${API_BASE}/iiko/mock-stream`)
    stream.addEventListener('open', () => {
      if (!isMounted) return
      setStreamState('live')
    })
    stream.addEventListener('snapshot', (event) => {
      if (!isMounted) return
      const payload = JSON.parse(event.data) as {
        documents: IikoMockDocument[]
        serverTime: string
      }
      setDocuments(payload.documents)
      setSelectedId((current) => current || payload.documents[0]?.id || '')
      setLastEventAt(payload.serverTime)
      setStreamState('live')
    })
    stream.addEventListener('document.created', (event) => {
      if (!isMounted) return
      const document = JSON.parse(event.data) as IikoMockDocument
      setDocuments((current) => [
        document,
        ...current.filter((item) => item.id !== document.id),
      ])
      setSelectedId(document.id)
      setLastEventAt(new Date().toISOString())
      setStreamState('live')
    })
    stream.addEventListener('error', () => {
      if (!isMounted) return
      setStreamState('error')
    })

    return () => {
      isMounted = false
      stream.close()
    }
  }, [])

  return (
    <main className="iiko-page">
      <button type="button" className="iiko-back" onClick={() => navigate('/')}>
        <ArrowLeft size={18} />
        Назад к заявкам
      </button>

      <section className="iiko-hero">
        <div>
          <div className="iiko-eyebrow">
            <Radio size={18} />
            Mock Iiko live monitor
          </div>
          <h1>Документы списания Iiko</h1>
          <p>
            Страница показывает mock-акт, который создается после подтверждения заявки
            проверяющим в сайте или мобильном приложении.
          </p>
        </div>
        <div className={`iiko-live-card ${streamState}`}>
          <Activity size={22} />
          <span>{streamState === 'live' ? 'Live подключено' : streamState === 'connecting' ? 'Подключение' : 'Переподключение'}</span>
          <strong>{lastEventAt ? dateFormatter.format(new Date(lastEventAt)) : 'ожидаем событие'}</strong>
        </div>
      </section>

      {error ? (
        <div className="inline-alert site-alert">
          {error}
        </div>
      ) : null}

      <section className="iiko-layout">
        <aside className="iiko-doc-list panel">
          <div className="iiko-panel-title">
            <Database size={19} />
            <div>
              <strong>Mock-документы</strong>
              <span>{documents.length} записей</span>
            </div>
          </div>

          <div className="iiko-doc-scroll">
            {documents.map((document) => (
              <button
                key={document.id}
                type="button"
                className={document.id === selectedDocument?.id ? 'iiko-doc-row active' : 'iiko-doc-row'}
                onClick={() => setSelectedId(document.id)}
              >
                <span>{document.id}</span>
                <strong>{document.product.name}</strong>
                <small>{document.outlet.name} · {dateFormatter.format(new Date(document.createdAt))}</small>
              </button>
            ))}

            {documents.length === 0 ? (
              <div className="iiko-empty">
                <RefreshCw size={28} />
                Подтвердите любую заявку, и здесь появится mock-документ.
              </div>
            ) : null}
          </div>
        </aside>

        <section className="iiko-document panel">
          {selectedDocument ? (
            <>
              <div className="iiko-document-head">
                <div>
                  <span>WRITEOFF_DOCUMENT</span>
                  <h2>{selectedDocument.id}</h2>
                </div>
                <div className="iiko-status">
                  <CheckCircle2 size={18} />
                  created
                </div>
              </div>

              <div className="iiko-facts">
                <IikoFact label="Заявка" value={`#${selectedDocument.requestId}`} />
                <IikoFact label="Точка" value={selectedDocument.outlet.name} />
                <IikoFact label="Iiko storeId" value={selectedDocument.outlet.iikoStoreId} />
                <IikoFact label="Продукт" value={selectedDocument.product.name} />
                <IikoFact
                  label="Количество"
                  value={`${selectedDocument.product.quantity} ${selectedDocument.product.unit}`}
                />
                <IikoFact
                  label="Сумма"
                  value={moneyFormatter.format(selectedDocument.product.amount)}
                />
                <IikoFact label="Причина" value={selectedDocument.reason.name} />
                <IikoFact label="Проверяющий" value={selectedDocument.reviewer.name} />
              </div>

              <div className="iiko-comment">
                <strong>Комментарий</strong>
                <p>{selectedDocument.comment}</p>
              </div>

              <div className="iiko-payload">
                <div className="iiko-panel-title">
                  <FileJson2 size={19} />
                  <div>
                    <strong>Payload в Iiko mock</strong>
                    <span>то, что отправили бы в реальный API</span>
                  </div>
                </div>
                <pre>{JSON.stringify(selectedDocument.payload, null, 2)}</pre>
              </div>
            </>
          ) : (
            <div className="iiko-empty big">
              <RefreshCw size={32} />
              Пока нет созданных mock-документов.
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function IikoFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="iiko-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
