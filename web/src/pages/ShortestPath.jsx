import { useState } from 'react'
import { api } from '../lib/api'
import { Section, Skeleton, Empty, Btn, Mono } from '../components/ui'
import { useToast } from '../lib/toast'

const LABEL_COLOR = {
  Person: '#6366f1', Phone: '#38bdf8', BankAccount: '#10b981', Vehicle: '#f59e0b',
  SocialHandle: '#a855f7', IPAddress: '#f43f5e', Location: '#fb7185', Case: '#38bdf8',
}

const DEPTHS = [2, 3, 5, 7, 10, 15]

function PathNode({ node, rel, isLast }) {
  return (
    <div>
      <div className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 p-4">
        <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: LABEL_COLOR[node.labels?.[0]] || '#94a3b8' }} />
        <div className="flex-1">
          <div className="font-semibold text-mist-100">{node.name || node.id}</div>
          <Mono className="text-mist-500">{node.id} · {node.labels?.join(', ') || 'Entity'}</Mono>
        </div>
      </div>
      {!isLast && (
        <div className="flex items-center justify-center my-1 gap-2">
          <span className="text-alert text-lg">↓</span>
          {rel && <span className="rounded-full bg-ink-700 border border-ink-600 px-2.5 py-0.5 text-[10px] font-mono text-mist-400">{rel.type}</span>}
        </div>
      )}
    </div>
  )
}

function CandidateCard({ candidate, onUseSuspect, onUseVictim }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-700 bg-ink-900 p-4">
      <div>
        <div className="font-semibold text-mist-100">{candidate.name} <Mono className="text-mist-500">({candidate.person_id})</Mono></div>
        <div className="text-xs text-mist-500 mt-0.5">DOB: {candidate.dob || '—'} · Cases: {(candidate.case_ids || []).join(', ')}</div>
      </div>
      <div className="flex gap-2">
        <Btn size="sm" onClick={() => onUseSuspect(candidate.person_id)}>Use as Suspect</Btn>
        <Btn size="sm" onClick={() => onUseVictim(candidate.person_id)}>Use as Victim</Btn>
      </div>
    </div>
  )
}

export default function ShortestPath() {
  const [suspect, setSuspect] = useState('')
  const [victim, setVictim] = useState('')
  const [depth, setDepth] = useState('5')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const doPath = async (sOverride = null, vOverride = null) => {
    const s = sOverride || suspect.trim()
    const v = vOverride || victim.trim()
    if (!s || !v) { toast('Specify both suspect and victim', 'info'); return }

    setLoading(true)
    setResult(null)
    try {
      const sParam = (s.toUpperCase().startsWith('P-') || s.toUpperCase().startsWith('PERSON_'))
        ? { suspect_id: s } : { suspect_name: s }
      const vParam = (v.toUpperCase().startsWith('P-') || v.toUpperCase().startsWith('PERSON_'))
        ? { victim_id: v } : { victim_name: v }
      const res = await api.shortestPath({ ...sParam, ...vParam, max_depth: depth })
      setResult(res)
    } catch (e) {
      toast(e.message, 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-3xl font-light">Shortest Path Analysis</h1>
        <p className="mt-1 text-mist-500 text-sm">Trace shortest association paths between suspect and victim</p>
      </div>

      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="label">Suspect (Name or ID)</label>
            <input className="field" value={suspect} onChange={e => setSuspect(e.target.value)} placeholder="e.g. Devendra Sharma or P-001" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="label">Victim (Name or ID)</label>
            <input className="field" value={victim} onChange={e => setVictim(e.target.value)} placeholder="e.g. Rajesh Kumar or P-002" />
          </div>
          <div className="w-32">
            <label className="label">Max Hops</label>
            <select className="field" value={depth} onChange={e => setDepth(e.target.value)}>
              {DEPTHS.map(d => <option key={d} value={d}>{d} hops</option>)}
            </select>
          </div>
          <Btn variant="primary" onClick={() => doPath()} disabled={loading}>{loading ? 'Tracing…' : 'Trace Path'}</Btn>
        </div>
        <p className="mt-3 text-xs text-mist-500">
          Ambiguity safe: if a name resolves to multiple persons, the system presents candidate keys for disambiguation.
        </p>
      </Section>

      <Section>
        <div className="text-sm font-semibold text-mist-100 mb-4">Path Traversal Result</div>

        {loading ? <Skeleton rows={4} /> : !result ? (
          <Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-9 w-9"><path d="M4 5h12m0 0-3-3m3 3-3 3M4 19h12m0 0-3-3m3 3-3 3M8 8v8"/></svg>}>
            Enter suspect and victim identifiers to compute graph connectivity.
          </Empty>
        ) : result.ambiguous ? (
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold">⚠ Ambiguity Detected — Multiple Entities Matched</div>
            <p className="text-sm text-mist-400">{result.message}</p>
            <div className="text-[10px] uppercase tracking-wider text-mist-500 font-bold mb-2">Matching Candidates:</div>
            {(result.candidates || []).map((c, i) => (
              <CandidateCard key={i} candidate={c}
                onUseSuspect={id => { setSuspect(id); doPath(id, null) }}
                onUseVictim={id => { setVictim(id); doPath(null, id) }}
              />
            ))}
          </div>
        ) : !result.nodes?.length ? (
          <Empty>{result.summary || 'No association path found between entities within depth limit.'}</Empty>
        ) : (
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <span className="rounded-full bg-alert/20 text-alert border border-alert/40 px-3 py-1 text-xs font-bold">{result.path_length} Hop Connection</span>
              <span className="text-xs text-mist-400">{result.summary || ''}</span>
            </div>
            <div className="space-y-0">
              {(result.nodes || []).map((n, i) => (
                <PathNode key={i} node={n} rel={result.relationships?.[i]} isLast={i === result.nodes.length - 1} />
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}
