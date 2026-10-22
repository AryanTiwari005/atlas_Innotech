import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { StatCard, Section, StatusTag, Skeleton, Empty, Btn } from '../components/ui'
import { useToast } from '../lib/toast'

export default function Overview() {
  const [health, setHealth] = useState(null)
  const [cases, setCases] = useState(null)
  const [insights, setInsights] = useState([])
  const [error, setError] = useState('')
  const chartRef = useRef(null)
  const sevRef = useRef(null)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.allSettled([api.health(), api.cases()]).then(([h, c]) => {
      if (h.status === 'fulfilled') setHealth(h.value)
      if (c.status === 'fulfilled') {
        const caseList = c.value
        setCases(Array.isArray(caseList) ? caseList : [])
        // Load insights for chart
        if (Array.isArray(caseList) && caseList.length) {
          Promise.all(caseList.slice(0, 4).map(cx =>
            api.caseInsights(cx.case_id).catch(() => [])
          )).then(results => {
            const flat = results.flat()
            const seen = new Set()
            setInsights(flat.filter(i => {
              if (!i.insight_id || seen.has(i.insight_id)) return false
              seen.add(i.insight_id)
              return true
            }))
          })
        }
      }
      if (h.status === 'rejected' || c.status === 'rejected') {
        setError('Could not connect to backend. Ensure docker compose is running.')
      }
    })
  }, [])

  useEffect(() => {
    if (!cases) return
    drawCharts()
  }, [cases, insights])

  async function drawCharts() {
    if (typeof window === 'undefined') return
    const Chart = (await import('chart.js/auto')).default
    // Entity distribution
    try {
      const g = await api.graph(null, 500)
      const counts = {}
      ;(g.nodes || []).forEach(n => {
        const l = (n.labels && n.labels[0]) || 'Entity'
        counts[l] = (counts[l] || 0) + 1
      })
      if (chartRef.current) {
        if (chartRef.current._chartInstance) chartRef.current._chartInstance.destroy()
        const ch = new Chart(chartRef.current, {
          type: 'bar',
          data: {
            labels: Object.keys(counts),
            datasets: [{ data: Object.values(counts), backgroundColor: ['#38bdf8','#6366f1','#10b981','#f59e0b','#f43f5e','#a855f7','#ec4899','#14b8a6'], borderRadius: 6 }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8f899b' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#8f899b' }, grid: { color: 'rgba(255,255,255,0.04)' } } } }
        })
        chartRef.current._chartInstance = ch
      }
    } catch (e) {}

    // Severity doughnut
    const sev = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    insights.forEach(i => { if (sev[i.severity] !== undefined) sev[i.severity]++ })
    if (sevRef.current) {
      if (sevRef.current._chartInstance) sevRef.current._chartInstance.destroy()
      const ch2 = new Chart(sevRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(sev),
          datasets: [{ data: Object.values(sev), backgroundColor: ['#f43f5e','#f59e0b','#38bdf8','#10b981'], borderWidth: 2, borderColor: '#16131c' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#8f899b', boxWidth: 12 } } } }
      })
      sevRef.current._chartInstance = ch2
    }
  }

  const online = health?.status === 'healthy'
  const totalEntities = (cases || []).reduce((n, c) => n + (c.total_entities || 0), 0)
  const open = (cases || []).filter(c => !(c.status || '').toUpperCase().includes('CLOSE')).length
  const critCount = insights.filter(i => i.severity === 'CRITICAL').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light">Command Center</h1>
          <p className="mt-1 text-mist-500 text-sm">Crime & Case Graph Intelligence · Live Neo4j Sync</p>
        </div>
        <div className={`pill ${online ? 'border-ok/50 text-ok' : 'border-alert/50 text-alert'}`}>
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-ok shadow-[0_0_8px_#34d399]' : 'bg-alert'}`} />
          {online ? `Graph Online · Neo4j ${health.version} · ${Math.round(health.latency_ms)}ms` : 'Graph Offline'}
        </div>
      </div>

      {error && <div className="rounded-xl border border-alert/40 bg-alert/10 p-4 text-sm text-alert">{error}</div>}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Cases in Database" value={cases ? cases.length : '—'} sub={`${open} active / open`} accent="cyan" />
        <StatCard label="Total Entities" value={cases ? totalEntities.toLocaleString() : '—'} sub="indexed in graph" accent="purple" />
        <StatCard label="Forensic Insights" value={insights.length} sub={`${critCount} critical threats`} accent="amber" />
        <StatCard label="Database State" value={online ? 'Connected' : 'Offline'} sub={online ? `Neo4j ${health?.version || ''} · ${Math.round(health?.latency_ms || 0)}ms` : 'Reconnecting…'} accent={online ? 'green' : 'red'} />
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Section>
          <div className="mb-4 text-sm font-semibold text-mist-300">Entity Distribution by Type</div>
          <div className="relative h-64"><canvas ref={chartRef} /></div>
        </Section>
        <Section>
          <div className="mb-4 text-sm font-semibold text-mist-300">Threat Severity Mix</div>
          <div className="relative h-64"><canvas ref={sevRef} /></div>
        </Section>
      </div>

      {/* Active investigations table */}
      <Section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-base font-semibold text-mist-100">Active Investigations</div>
            <div className="text-xs text-mist-500 mt-0.5">Direct live stream from connected Neo4j knowledge graph</div>
          </div>
          <Btn size="sm" onClick={() => navigate('/cases')}>View all cases →</Btn>
        </div>

        {!cases ? <Skeleton rows={4} /> : cases.length === 0 ? (
          <Empty>No cases registered yet. <button className="text-alert underline" onClick={() => navigate('/ingest')}>Ingest case data to get started →</button></Empty>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ink-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-950/50">
                  {['Case Name / ID', 'Type', 'Entities', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-mist-500 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.slice(0, 6).map(x => (
                  <tr key={x.case_id} className="border-b border-ink-700/50 hover:bg-ink-800/50 cursor-pointer transition" onClick={() => navigate('/cases')}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-mist-100">{x.case_name || x.case_id}</div>
                      <div className="font-mono text-[11px] text-mist-500">{x.case_id}</div>
                    </td>
                    <td className="px-4 py-3 text-mist-300">{x.case_type || '—'}</td>
                    <td className="px-4 py-3 font-mono text-mist-100 font-bold">{x.total_entities}</td>
                    <td className="px-4 py-3"><StatusTag status={x.status} /></td>
                    <td className="px-4 py-3 text-right text-alert">›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}
