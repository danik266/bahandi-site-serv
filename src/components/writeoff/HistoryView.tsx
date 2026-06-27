import { History, Search } from 'lucide-react'
import { PanelTitle } from '../ui'
import { HistoryRow } from './HistoryRow'
import type { Lookups, WriteOffRequest } from '../../types'

export function HistoryView({
  requests,
  title,
  searchTerm,
  lookups,
  onSearch,
}: {
  requests: WriteOffRequest[]
  title: string
  searchTerm: string
  lookups: Lookups
  onSearch: (value: string) => void
}) {
  return (
    <section className="workspace single-column">
      <div className="panel">
        <PanelTitle icon={History} title={title} detail={`${requests.length} записей`} />
        <label className="search-field">
          <Search size={17} />
          <input
            type="search"
            value={searchTerm}
            placeholder="Поиск по ID, точке или продукту"
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
        <div className="history-table">
          {requests.map((request) => (
            <HistoryRow key={request.id} request={request} lookups={lookups} />
          ))}
        </div>
      </div>
    </section>
  )
}
