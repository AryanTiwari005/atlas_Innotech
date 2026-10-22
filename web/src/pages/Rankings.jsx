import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Section, Skeleton, Empty, Btn, Mono } from '../components/ui'
import { useToast } from '../lib/toast'

const ENTITY_TYPES = ['Person','Phone','BankAccount','Vehicle','SocialHandle','IPAddress','Location','CellTower']
const METRICS = [
  { value: 'degree', label: 'Degree Centrality' },
  { value: 'weighted_degree', label: 'Weighted Degree' },
  { value: 'cross_case_relevance', label: 'Cross-Case Relevance' },
  { value: 'pagerank', label: 'PageRank' },
  { value: 'betweenness', label: 'Betweenness Centrality' },
]

export default function Rankings() {
  const [cases, setCases] = useState([])
  const [metric, setMetric] = useState('degree')
  const [label, setLabel] = useState('Person')
  const [caseId, setCaseId] = useState('')
  const [limitVal, setLimitVal] = useState('15')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    api.cases().then(c => setCases(Array.isArray(c) ? c : [])).catch(() => {})
    doRankings('degree', 'Person', '', '15')
  }, [])

  const doRankings = async (m = metric, l = label, cId = caseId, lim = limitVal) => {
    setLoading(true)
    setResults(null)
    try {
      const params = { metric: m, label: l, limit: lim }
      if (cId) params.case_id = cId
      const r = await api.rankings(params)
      setResults(r)
    } catch (e) {
      const isGds = e.message?.includes('GDS') || e.message?.includes('Graph Data Science')
      toast(isGds ? 'GDS plugin not available. Using degree fallback.' : e.message, isGds ? 'info' : 'err')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const rankBg = (i) => {
    if (i === 0) return 'bg-alert text-white'
    if (i === 1) return 'bg-purple-500/20 text-purple-200'
    if (i === 2) return 'bg-amber-500/20 text-amber-200'
    return 'bg-ink-700 text-mist-400'
  }

  const maxScore = results?.rankings?.[0]?.score || 1

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-3xl font-light">Centrality Rankings</h1>
        <p className="mt-1 text-mist-500 text-sm">Degree, PageRank, betweenness, and cross-case relevance</p>
      </div>

      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-48">
            <label className="label">Centrality Metric</label>
            <select className="field" value={metric} onChange={e => setMetric(e.target.value)}>
              {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="w-44">
            <label className="label">Entity Category</label>
            <select className="field" value={label} onChange={e => setLabel(e.target.value)}>
              {ENTITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="label">Case Filter</label>
            <select className="field" value={caseId} onChange={e => setCaseId(e.target.value)}>
              <option value="">All Cases (Global)</option>
              {cases.map(c => <option key={c.case_id} value={c.case_id}>{c.case_name || c.case_id}</option>)}
            </select>
          </div>
          <div className="w-20">
            <label className="label">Limit</label>
            <input className="field" type="number" value={limitVal} min="1" max="100" onChange={e => setLimitVal(e.target.value)} />
          </div>
          <Btn variant="primary" onClick={doRankings} disabled={loading}>{loading ? 'Calculating…' : 'Calculate'}</Btn>
        </div>
      </Section>

      <Section>
        <div className="flex items-center justify-between mb-5">
          <div className="text-sm font-semibold text-mist-100">
            {results ? `Rankings: ${metric.replace(/_/g, ' ').toUpperCase()}` : 'Centrality Leaderboard'}
          </div>
          {results && <span className="rounded-full bg-ink-700 border border-ink-600 px-3 py-0.5 text-xs text-mist-400">{results.total_ranked} ranked</span>}
        </div>

        {loading ? <Skeleton rows={6} /> : !results ? (
          <Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-9 w-9"><path d="M3 17l4-4 4 4 5-5 4 4"/></svg>}>
            Select parameters above to evaluate influential network nodes.
          </Empty>
        ) : !results.rankings?.length ? (
          <Empty>No ranking data found. Try a different metric or case.</Empty>
        ) : (
          <div className="divide-y divide-ink-700">
            {results.rankings.map((it, i) => (
              <div key={it.id} className="flex items-center gap-4 py-4">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${rankBg(i)}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-mist-100 truncate">{it.name || it.id}</div>
                  <Mono className="text-mist-500">{it.id} · {(it.case_ids || []).join(', ')}</Mono>
                </div>
                <div className="flex items-center gap-4 min-w-[180px]">
                  <div className="flex-1 h-2 rounded-full bg-ink-950 border border-ink-700 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-alert to-purple-500" style={{ width: `${Math.max(5, (it.score / maxScore) * 100)}%` }} />
                  </div>
                  <Mono className="text-mist-100 font-bold w-12 text-right">{Number(it.score).toFixed(it.score < 10 ? 2 : 0)}</Mono>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
