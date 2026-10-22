import { useState, useCallback } from 'react'
import { api } from '../lib/api'
import { Section, Skeleton, Empty, Btn, Modal, Mono } from '../components/ui'
import { useToast } from '../lib/toast'

const LABEL_COLOR = {
  Person: '#6366f1', Phone: '#38bdf8', BankAccount: '#10b981', Vehicle: '#f59e0b',
  SocialHandle: '#a855f7', IPAddress: '#f43f5e', Location: '#fb7185', Case: '#38bdf8',
}

const ENTITY_TYPES = ['Person','Phone','BankAccount','Vehicle','SocialHandle','IPAddress','Location','CellTower','Case','FIR']

function EntityModal({ entity, onClose }) {
  const p = entity.properties || {}
  const keys = Object.keys(p).filter(k => !['case_ids', 'created_at', 'updated_at'].includes(k))
  return (
    <Modal open onClose={onClose} maxW="max-w-2xl">
      <button onClick={onClose} className="absolute top-5 right-5 text-mist-500 hover:text-mist-100">✕</button>
      <h2 className="text-lg font-semibold mb-1">{entity.labels?.[0]} · <Mono>{entity.entity_id}</Mono></h2>
      <div className="flex items-center gap-4 mb-5">
        <div className="rounded-xl bg-ink-950 border border-ink-700 p-4 text-center">
          <div className="text-2xl font-light text-mist-100">{entity.total_connections}</div>
          <div className="text-[10px] uppercase tracking-wider text-mist-500 mt-1">Direct Connections</div>
        </div>
        <div className="text-xs text-mist-400">Full entity record with immediate 1-hop associations across all linked investigation files.</div>
      </div>

      {keys.length > 0 && (
        <>
          <div className="text-xs font-bold uppercase tracking-wider text-mist-500 mb-2">Stored Attributes</div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {keys.map(k => (
              <div key={k} className="rounded-lg bg-ink-950 border border-ink-700 p-3">
                <div className="text-[10px] uppercase tracking-wider text-mist-500 font-bold">{k}</div>
                <div className="mt-1 text-xs font-mono text-mist-100 break-all">{typeof p[k] === 'object' ? JSON.stringify(p[k]) : String(p[k])}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="text-xs font-bold uppercase tracking-wider text-mist-500 mb-3">Connected Entities ({entity.total_connections})</div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {(entity.connections || []).length === 0 ? (
          <Empty>No direct 1-hop connections registered.</Empty>
        ) : (entity.connections || []).map((c, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-ink-950 border border-ink-700 p-3">
            <div>
              <div className="text-sm font-semibold text-mist-100">{c.neighbor_name || c.neighbor_id}</div>
              <div className="text-[11px] text-mist-500">{c.direction === 'OUTGOING' ? '→ OUTGOING' : '← INCOMING'} · <span className="font-mono">{c.relationship}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-ink-700 border border-ink-600 px-2 py-0.5 text-[10px] text-mist-400">{(c.neighbor_labels || []).join(', ')}</span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default function EntitySearch() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [loadingEntity, setLoadingEntity] = useState(false)
  const toast = useToast()

  const doSearch = useCallback(async () => {
    if (!query.trim()) { toast('Please enter a search query', 'info'); return }
    setLoading(true)
    try {
      const res = await api.entitySearch(query.trim(), type)
      setResults(Array.isArray(res) ? res : [])
    } catch (e) {
      toast(e.message, 'err')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, type, toast])

  const openEntity = useCallback(async (id) => {
    setLoadingEntity(true)
    try {
      const e = await api.entity(id)
      setSelected(e)
    } catch (err) {
      toast(`Could not load entity: ${err.message}`, 'err')
    } finally {
      setLoadingEntity(false)
    }
  }, [toast])

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-3xl font-light">Entity Search</h1>
        <p className="mt-1 text-mist-500 text-sm">Fast multi-property search across people, phones, bank accounts, VINs</p>
      </div>

      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="label">Search Query</label>
            <input className="field" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Enter name, phone (+91...), account number, VIN…" />
          </div>
          <div className="w-48">
            <label className="label">Entity Category</label>
            <select className="field" value={type} onChange={e => setType(e.target.value)}>
              <option value="">All Categories</option>
              {ENTITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <Btn variant="primary" onClick={doSearch} disabled={loading}>{loading ? 'Searching…' : 'Search'}</Btn>
        </div>
      </Section>

      <Section>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-mist-100">Search Results</div>
          {results && <span className="rounded-full bg-ink-700 border border-ink-600 px-3 py-0.5 text-xs text-mist-400">{results.length} matches</span>}
        </div>

        {loading ? <Skeleton rows={4} /> : results === null ? (
          <Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-9 w-9"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>}>
            Execute a search query above to inspect entity profiles.
          </Empty>
        ) : results.length === 0 ? (
          <Empty>No entity matches found for "{query}". Try searching by partial name or number.</Empty>
        ) : (
          <div className="space-y-2">
            {results.map(r => (
              <div key={r.entity_id} onClick={() => openEntity(r.entity_id)} className="flex items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 cursor-pointer hover:border-alert/40 hover:bg-ink-800 transition group">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: LABEL_COLOR[r.labels?.[0]] || '#94a3b8' }} />
                    <div className="font-semibold text-mist-100 group-hover:text-alert transition">{r.display_name || r.entity_id}</div>
                  </div>
                  <Mono className="text-mist-500 ml-4">{r.entity_id}</Mono>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-ink-700 border border-ink-600 px-2.5 py-0.5 text-[10px] text-mist-400">{r.labels?.slice(0, 3).join(', ')}</span>
                  <span className="text-alert text-sm">›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {loadingEntity && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="h-6 w-6 border-2 border-alert border-t-transparent rounded-full animate-spin" /></div>}
      {selected && <EntityModal entity={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
