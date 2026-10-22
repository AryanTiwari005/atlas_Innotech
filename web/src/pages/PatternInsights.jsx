import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Section, Skeleton, Empty, Btn, SeverityBadge, Modal, Mono } from '../components/ui'
import { useToast } from '../lib/toast'

function InsightModal({ insight, onClose }) {
  const i = insight
  const sevCls = { crit: 'text-red-300', high: 'text-amber-300', medium: 'text-sky-300', low: 'text-ok' }
  return (
    <Modal open onClose={onClose} maxW="max-w-2xl">
      <button onClick={onClose} className="absolute top-5 right-5 text-mist-500 hover:text-mist-100">✕</button>
      <div className="flex items-center gap-2 mb-3">
        <SeverityBadge severity={i.severity} />
        <span className="rounded-full bg-ink-700 border border-ink-600 px-2.5 py-0.5 text-[10px] font-mono text-mist-400">{i.insight_type} · {i.insight_id}</span>
      </div>
      <h2 className="text-lg font-semibold mb-3 text-mist-100">{i.title}</h2>
      <div className="text-sm text-mist-300 mb-5 leading-relaxed">{i.derived_interpretation}</div>

      <div className="text-xs font-bold uppercase tracking-wider text-mist-500 mb-2">Observed Graph Facts</div>
      {(i.observed_facts || []).length === 0 ? <Empty>No specific facts recorded.</Empty> : (
        <div className="space-y-2 mb-5">
          {i.observed_facts.map((f, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-mist-300">
              <span className="text-alert mt-0.5 flex-shrink-0">➔</span> {f}
            </div>
          ))}
        </div>
      )}

      {(i.alternative_explanations || []).length > 0 && (
        <>
          <div className="text-xs font-bold uppercase tracking-wider text-mist-500 mb-2">Alternative Explanations</div>
          <div className="space-y-1 mb-5">
            {i.alternative_explanations.map((a, idx) => (
              <div key={idx} className="text-xs text-mist-500">· {a}</div>
            ))}
          </div>
        </>
      )}

      <div className="rounded-lg bg-ink-950 border border-ink-700 p-3 text-xs text-mist-500">
        {i.disclaimer || 'Intelligence alert generated automatically from graph topology.'}
      </div>
    </Modal>
  )
}

function AiDossierModal({ caseId, caseName, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.caseAiInsights(caseId)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [caseId])

  const riskColor = data?.risk_level === 'CRITICAL' ? '#f43f5e' : data?.risk_level === 'HIGH' ? '#f59e0b' : '#10b981'

  return (
    <Modal open onClose={onClose} maxW="max-w-2xl">
      <button onClick={onClose} className="absolute top-5 right-5 text-mist-500 hover:text-mist-100">✕</button>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-semibold text-mist-100">✨ AI Case Intelligence Dossier</h2>
        <span className="rounded-full bg-alert/20 text-alert border border-alert/40 px-2.5 py-0.5 text-[9px] uppercase tracking-wide font-bold">Google Gemini</span>
      </div>
      <div className="text-xs text-mist-500 mb-5">{caseName || caseId} (<Mono>{caseId}</Mono>)</div>

      {loading ? <div className="flex flex-col items-center gap-3 py-16"><div className="h-5 w-5 border-2 border-alert border-t-transparent rounded-full animate-spin"/><div className="text-sm text-mist-400">Synthesizing forensic intelligence…</div></div>
      : error ? <div className="text-center text-sm text-alert py-8">{error}</div>
      : data && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-ink-950 border border-ink-700 p-3">
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${riskColor}22`, color: riskColor, border: `1px solid ${riskColor}44` }}>
              RISK LEVEL: {data.risk_level}
            </span>
            <div className="ml-auto text-xs text-mist-500">Analyzed by <b className="text-mist-300">{data.ai_model}</b></div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-mist-500 mb-2">Executive Forensic Summary</div>
            <div className="rounded-lg bg-ink-950 border border-ink-700 p-4 text-sm text-mist-100 leading-relaxed">{data.executive_summary}</div>
          </div>

          {data.modus_operandi && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-mist-500 mb-2">Modus Operandi & Syndicate Structure</div>
              <div className="rounded-lg bg-ink-950 border border-ink-700 p-4 text-sm text-mist-400 leading-relaxed">{data.modus_operandi}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-ink-950 border border-ink-700 p-4">
              <div className="text-xs font-bold text-alert mb-2">Key Suspects & Roles</div>
              <ul className="list-disc list-inside text-xs text-mist-400 space-y-1">
                {(data.key_suspects || ['No individual suspects flagged.']).map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="rounded-lg bg-ink-950 border border-ink-700 p-4">
              <div className="text-xs font-bold text-amber-300 mb-2">Critical Graph Red Flags</div>
              <ul className="list-disc list-inside text-xs text-mist-400 space-y-1">
                {(data.critical_anomalies || ['No critical graph anomalies detected.']).map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-mist-500 mb-2">Actionable Law Enforcement Next Steps</div>
            <div className="rounded-lg bg-alert/5 border border-alert/20 p-4">
              <ol className="list-decimal list-inside text-xs text-mist-100 space-y-2">
                {(data.investigative_leads || ['Continue routine evidentiary collection.']).map((l, i) => <li key={i}>{l}</li>)}
              </ol>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function PatternInsights() {
  const [cases, setCases] = useState([])
  const [selectedCase, setSelectedCase] = useState('')
  const [severity, setSeverity] = useState('')
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(false)
  const [openInsight, setOpenInsight] = useState(null)
  const [aiDossier, setAiDossier] = useState(null)
  const toast = useToast()

  useEffect(() => {
    api.cases().then(async c => {
      const caseList = Array.isArray(c) ? c : []
      setCases(caseList)
      if (caseList.length) await loadInsights(caseList, '')
    }).catch(() => {})
  }, [])

  const loadInsights = async (caseList, caseVal) => {
    setLoading(true)
    try {
      let list = []
      if (caseVal === '__DELTA__') {
        list = await api.deltaInsights()
      } else if (caseVal) {
        list = await api.caseInsights(caseVal)
      } else {
        const all = await Promise.all(caseList.map(cx => api.caseInsights(cx.case_id).catch(() => [])))
        list = all.flat()
        const seen = new Set()
        list = list.filter(i => { if (!i.insight_id || seen.has(i.insight_id)) return false; seen.add(i.insight_id); return true })
      }
      setInsights(Array.isArray(list) ? list : [])
    } catch (e) {
      toast(e.message, 'err')
    } finally {
      setLoading(false)
    }
  }

  const onCaseChange = async (val) => {
    setSelectedCase(val)
    await loadInsights(cases, val)
  }

  const openAiDossier = () => {
    const cId = selectedCase && selectedCase !== '__DELTA__' ? selectedCase : cases[0]?.case_id
    if (!cId) { toast('Select a case to generate AI Dossier', 'info'); return }
    const cObj = cases.find(c => c.case_id === cId)
    setAiDossier({ caseId: cId, caseName: cObj?.case_name || cId })
  }

  const filtered = severity ? insights.filter(i => (i.severity || '').toUpperCase() === severity) : insights

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-3xl font-light">Pattern Insights</h1>
        <p className="mt-1 text-mist-500 text-sm">Automated forensic graph intelligence and anomaly detection</p>
      </div>

      <Section>
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <select className="field w-56" value={selectedCase} onChange={e => onCaseChange(e.target.value)}>
              <option value="">All Ingested Cases</option>
              <option value="__DELTA__">Cross-Case Delta Insights Only</option>
              {cases.map(c => <option key={c.case_id} value={c.case_id}>Case: {c.case_name || c.case_id}</option>)}
            </select>
            <select className="field w-40" value={severity} onChange={e => setSeverity(e.target.value)}>
              <option value="">All Severities</option>
              {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Btn variant="primary" onClick={openAiDossier}>✨ Gemini AI Dossier</Btn>
        </div>
      </Section>

      {loading ? <Skeleton rows={6} /> : filtered.length === 0 ? (
        <Section>
          <Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-9 w-9"><path d="M12 3l1.9 5.6L19 10l-5.1 1.9L12 17.5l-1.9-5.6L5 10l5.1-1.4L12 3Z"/></svg>}>
            No pattern insights match the selected filter. Ingest additional cases to trigger detection.
          </Empty>
        </Section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ins, idx) => {
            const sev = (ins.severity || 'MEDIUM').toUpperCase()
            return (
              <div key={ins.insight_id || idx} className="card p-5 flex flex-col hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <SeverityBadge severity={sev} />
                  <Mono className="text-mist-500 text-[10px]">{ins.insight_type}</Mono>
                </div>
                <div className="font-semibold text-mist-100 mb-2 leading-snug">{ins.title}</div>
                <div className="text-xs text-mist-400 mb-3 flex-1 leading-relaxed">{ins.derived_interpretation}</div>
                {(ins.observed_facts || []).slice(0, 2).map((f, fi) => (
                  <div key={fi} className="flex items-start gap-1.5 text-[11px] text-mist-500 mb-1">
                    <span className="text-alert mt-0.5 flex-shrink-0">●</span> {f}
                  </div>
                ))}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(ins.case_ids || []).map(c => (
                    <span key={c} className="rounded-full bg-ink-700 border border-ink-600 px-2 py-0.5 text-[10px] font-mono text-mist-400">{c}</span>
                  ))}
                </div>
                <Btn className="mt-4 w-full" size="sm" onClick={() => setOpenInsight(ins)}>Examine Evidence</Btn>
              </div>
            )
          })}
        </div>
      )}

      {openInsight && <InsightModal insight={openInsight} onClose={() => setOpenInsight(null)} />}
      {aiDossier && <AiDossierModal caseId={aiDossier.caseId} caseName={aiDossier.caseName} onClose={() => setAiDossier(null)} />}
    </div>
  )
}
