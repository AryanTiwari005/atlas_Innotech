import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Section, Skeleton, Empty, Btn, StatusTag, Modal, Mono } from '../components/ui'
import { useToast } from '../lib/toast'

const LABEL_COLOR = {
  Person: '#6366f1', Phone: '#38bdf8', BankAccount: '#10b981', Vehicle: '#f59e0b',
  SocialHandle: '#a855f7', IPAddress: '#f43f5e', Location: '#fb7185', Case: '#38bdf8',
}

function CaseDetailModal({ caseId, cases, onClose, onDeleted, onNavigateGraph }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    api.case(caseId).then(setData).catch(e => toast(e.message, 'err')).finally(() => setLoading(false))
  }, [caseId])

  const doDelete = async () => {
    setDeleting(true)
    try {
      const res = await api.deleteCase(caseId)
      toast(`Case deleted: ${res.nodes_removed} nodes removed, ${res.nodes_detached} shared nodes preserved.`, 'ok')
      onDeleted(caseId)
      onClose()
    } catch (e) {
      toast(`Failed to delete: ${e.message}`, 'err')
    } finally {
      setDeleting(false)
    }
  }

  const m = data?.metadata || {}

  return (
    <Modal open onClose={onClose} maxW="max-w-3xl">
      <button onClick={onClose} className="absolute top-5 right-5 text-mist-500 hover:text-mist-100">✕</button>
      {loading ? (
        <div className="py-10"><Skeleton rows={4} /></div>
      ) : !data ? (
        <Empty>Could not load case details.</Empty>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-mist-100">{m.case_name || caseId}</h2>
            <StatusTag status={m.status} />
          </div>
          <Mono className="text-mist-500 block mb-4">{caseId}</Mono>

          {m.summary && <p className="text-sm text-mist-400 mb-5 leading-relaxed">{m.summary}</p>}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
            {m.case_type && <div className="rounded-lg bg-ink-950 border border-ink-700 p-3"><div className="text-[10px] uppercase text-mist-500 font-bold">Type</div><div className="mt-1 text-sm text-mist-100">{m.case_type}</div></div>}
            {m.jurisdiction && <div className="rounded-lg bg-ink-950 border border-ink-700 p-3"><div className="text-[10px] uppercase text-mist-500 font-bold">Jurisdiction</div><div className="mt-1 text-sm text-mist-100">{m.jurisdiction}</div></div>}
            {m.lead_investigator && <div className="rounded-lg bg-ink-950 border border-ink-700 p-3"><div className="text-[10px] uppercase text-mist-500 font-bold">Lead Investigator</div><div className="mt-1 text-sm text-mist-100">{m.lead_investigator}</div></div>}
            {m.created_date && <div className="rounded-lg bg-ink-950 border border-ink-700 p-3"><div className="text-[10px] uppercase text-mist-500 font-bold">Date Filed</div><div className="mt-1 text-sm text-mist-100">{m.created_date}</div></div>}
            <div className="rounded-lg bg-ink-950 border border-ink-700 p-3"><div className="text-[10px] uppercase text-mist-500 font-bold">Total Entities</div><div className="mt-1 text-sm font-mono font-bold text-mist-100">{data.total_entities}</div></div>
          </div>

          {Object.keys(data.entity_breakdown || {}).length > 0 && (
            <>
              <div className="text-xs font-bold uppercase tracking-wider text-mist-500 mb-2">Entity Breakdown</div>
              <div className="divide-y divide-ink-700 border border-ink-700 rounded-lg mb-5">
                {Object.entries(data.entity_breakdown).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: LABEL_COLOR[k] || '#94a3b8' }} />
                      <span className="text-sm text-mist-100">{k}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-mist-300">{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" size="sm" onClick={() => { onClose(); navigate('/graph') }}>Explore in Graph</Btn>
            <Btn variant="ghost" size="sm" onClick={() => { onClose(); navigate('/insights') }}>View Insights</Btn>
            {!confirmDelete ? (
              <Btn variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>🗑 Delete Case</Btn>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-alert font-semibold">Confirm?</span>
                <Btn variant="danger" size="sm" disabled={deleting} onClick={doDelete}>{deleting ? 'Deleting…' : 'Yes, Delete'}</Btn>
                <Btn size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}

export default function CaseRegistry() {
  const [cases, setCases] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const toast = useToast()
  const navigate = useNavigate()

  const loadCases = async () => {
    setLoading(true)
    try {
      const list = await api.cases()
      setCases(Array.isArray(list) ? list : [])
    } catch (e) {
      toast(`Failed to load cases: ${e.message}`, 'err')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCases() }, [])

  const handleDeleted = (caseId) => {
    setCases(prev => (prev || []).filter(c => c.case_id !== caseId))
  }

  const resetDb = async () => {
    if (!window.confirm('This will permanently wipe ALL cases, persons, and forensic logs from the database. This cannot be undone. Proceed?')) return
    try {
      const res = await api.resetDb()
      toast(res.message || 'Graph database cleared.', 'ok')
      setCases([])
    } catch (e) {
      toast(`Reset failed: ${e.message}`, 'err')
    }
  }

  const filtered = statusFilter
    ? (cases || []).filter(c => (c.status || '').toUpperCase() === statusFilter)
    : (cases || [])

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-3xl font-light">Case Registry</h1>
        <p className="mt-1 text-mist-500 text-sm">Manage cases, entity breakdowns, and case deletion</p>
      </div>

      <Section>
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-3">
            <select className="field w-52" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {['OPEN','UNDER_INVESTIGATION','CHARGED','CLOSED'].map(s => <option key={s}>{s}</option>)}
            </select>
            <Btn size="sm" onClick={loadCases} disabled={loading}>↻ Refresh</Btn>
          </div>
          <div className="flex gap-2">
            <Btn size="sm" onClick={() => navigate('/ingest')}>+ Ingest New Case</Btn>
            <Btn size="sm" variant="danger" onClick={resetDb}>🗑 Reset Database</Btn>
          </div>
        </div>
      </Section>

      <Section>
        {loading ? <Skeleton rows={5} /> : filtered.length === 0 ? (
          <Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-9 w-9"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>}>
            No cases registered matching criteria. <button className="text-alert underline" onClick={() => navigate('/ingest')}>Ingest case data →</button>
          </Empty>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ink-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-950/50">
                  {['Case Identifier','Type','Jurisdiction','Lead Investigator','Entities','Status','AI Insights','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-mist-500 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(x => (
                  <tr key={x.case_id} className="border-b border-ink-700/50 hover:bg-ink-800/40 cursor-pointer transition" onClick={() => setSelectedId(x.case_id)}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-mist-100">{x.case_name || x.case_id}</div>
                      <Mono className="text-mist-500">{x.case_id}</Mono>
                    </td>
                    <td className="px-4 py-3 text-mist-400">{x.case_type || '—'}</td>
                    <td className="px-4 py-3 text-mist-400">{x.jurisdiction || '—'}</td>
                    <td className="px-4 py-3 text-mist-400">{x.lead_investigator || '—'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-mist-100">{x.total_entities}</td>
                    <td className="px-4 py-3"><StatusTag status={x.status} /></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Btn size="sm" variant="accent" onClick={() => navigate('/insights')}>✨ Gemini AI</Btn>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <Btn size="sm" variant="danger" onClick={() => setSelectedId(x.case_id)}>View / Delete</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {selectedId && (
        <CaseDetailModal
          caseId={selectedId}
          cases={cases || []}
          onClose={() => setSelectedId(null)}
          onDeleted={handleDeleted}
          onNavigateGraph={() => navigate('/graph')}
        />
      )}
    </div>
  )
}
