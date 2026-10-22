import { useEffect, useState, useRef, useCallback } from 'react'
import { Network } from 'vis-network/standalone'
import { api } from '../lib/api'
import { Section, Skeleton, Btn, Mono } from '../components/ui'
import { useToast } from '../lib/toast'

const LABEL_COLOR = {
  Person: '#6366f1', Phone: '#38bdf8', BankAccount: '#10b981', Vehicle: '#f59e0b',
  SocialHandle: '#a855f7', IPAddress: '#f43f5e', Location: '#fb7185', CellTower: '#14b8a6',
  FIR: '#ec4899', PriorCase: '#94a3b8', Case: '#38bdf8', Transaction: '#10b981',
  SourceRecord: '#64748b', Organization: '#3b82f6'
}

function getNodeLevel(labels) {
  if (!labels?.length) return 6
  if (labels.includes('Case')) return 1
  if (labels.includes('FIR') || labels.includes('SourceRecord')) return 2
  if (labels.includes('Person')) return 3
  if (labels.some(l => ['Phone', 'BankAccount', 'Vehicle', 'SocialHandle'].includes(l))) return 4
  return 6
}

export default function GraphExplorer() {
  const [cases, setCases] = useState([])
  const [selectedCase, setSelectedCase] = useState('')
  const [layout, setLayout] = useState('structured')
  const [edgeLabels, setEdgeLabels] = useState('clean')
  const [limit, setLimit] = useState('1200')
  const [hideIsolated, setHideIsolated] = useState(false)
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState('')
  const [selectedNode, setSelectedNode] = useState(null)
  const [aiOpen, setAiOpen] = useState(true)
  const [aiMessages, setAiMessages] = useState([{
    type: 'bot',
    text: "Can't get inferences from this visual topology? Ask me directly to identify key operatives, money flows, or hidden links.",
    chips: true
  }])
  const [aiInput, setAiInput] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [physicsOn, setPhysicsOn] = useState(true)
  const networkRef = useRef(null)
  const containerRef = useRef(null)
  const chatLogRef = useRef(null)
  const toast = useToast()

  useEffect(() => {
    api.cases().then(c => setCases(Array.isArray(c) ? c : [])).catch(() => {})
    // Auto-load initial graph
    loadGraph('')
  }, [])

  const loadGraph = useCallback(async (overrideCase) => {
    setLoading(true)
    const cId = overrideCase !== undefined ? overrideCase : selectedCase
    try {
      const g = await api.graph(cId || null, parseInt(limit))
      setGraphData(g)
      setStats(`${g.total_nodes} nodes · ${g.total_edges} edges`)
    } catch (e) {
      toast(`Failed to load graph: ${e.message}`, 'err')
    } finally {
      setLoading(false)
    }
  }, [selectedCase, limit, toast])

  useEffect(() => {
    if (!graphData || !containerRef.current) return
    renderGraph()
  }, [graphData, layout, edgeLabels, hideIsolated])

  const renderGraph = useCallback(() => {
    if (!containerRef.current || !graphData) return

    if (networkRef.current) { networkRef.current.destroy(); networkRef.current = null }

    const degrees = {}
    ;(graphData.edges || []).forEach(e => {
      degrees[e.source] = (degrees[e.source] || 0) + 1
      degrees[e.target] = (degrees[e.target] || 0) + 1
    })

    const seenN = new Set()
    const nodes = []
    ;(graphData.nodes || []).forEach(n => {
      if (!n?.id || seenN.has(n.id)) return
      if (hideIsolated && (degrees[n.id] || 0) <= 1 && !n.labels?.includes('Case')) return
      seenN.add(n.id)
      const isCase = n.labels?.includes('Case')
      const isPerson = n.labels?.includes('Person')
      nodes.push({
        id: n.id, label: n.name || n.id, level: getNodeLevel(n.labels),
        shape: 'dot', size: isCase ? 22 : (isPerson ? 16 : 12),
        color: { background: LABEL_COLOR[n.labels?.[0]] || '#94a3b8', border: '#100e15', highlight: { background: '#f23d3d', border: '#fff' } },
        font: { color: '#c4bfcd', size: isCase ? 14 : (isPerson ? 12 : 10), face: 'Poppins' },
        title: `${n.labels?.[0] || 'Node'}: ${n.name || n.id}`
      })
    })

    const seenE = new Set()
    const edges = []
    ;(graphData.edges || []).forEach((e, idx) => {
      if (!e?.source || !e?.target) return
      if (!seenN.has(e.source) || !seenN.has(e.target)) return
      let eid = String(e.id || `edge_${e.source}_${e.type}_${e.target}_${idx}`)
      if (seenE.has(eid)) eid = `${eid}_${idx}`
      seenE.add(eid)
      const isCaseLink = e.type === 'INVOLVES'
      let label = edgeLabels === 'none' ? '' : (edgeLabels === 'clean' && isCaseLink ? '' : (e.type || ''))
      edges.push({
        id: eid, from: e.source, to: e.target, label,
        arrows: 'to',
        color: { color: isCaseLink ? 'rgba(56,189,248,0.35)' : 'rgba(148,163,184,0.35)', highlight: '#f23d3d' },
        dashes: isCaseLink,
        font: { color: '#8f899b', size: 9, face: 'Poppins', strokeWidth: 0, background: 'rgba(12,17,30,0.85)' },
        smooth: { enabled: true, type: 'continuous', roundness: 0.35 }
      })
    })

    let physicsOpts = {}
    let layoutOpts = { randomSeed: 42 }
    if (layout === 'hierarchy_ud') {
      layoutOpts.hierarchical = { enabled: true, direction: 'UD', sortMethod: 'directed', levelSeparation: 140, nodeSpacing: 160 }
      physicsOpts = { enabled: physicsOn, solver: 'hierarchicalRepulsion', hierarchicalRepulsion: { nodeDistance: 150, damping: 0.48 }, stabilization: { iterations: 140 } }
    } else if (layout === 'hierarchy_lr') {
      layoutOpts.hierarchical = { enabled: true, direction: 'LR', sortMethod: 'directed', levelSeparation: 170, nodeSpacing: 140 }
      physicsOpts = { enabled: physicsOn, solver: 'hierarchicalRepulsion', hierarchicalRepulsion: { nodeDistance: 140, damping: 0.48 }, stabilization: { iterations: 140 } }
    } else if (layout === 'radial') {
      layoutOpts.improvedLayout = true
      physicsOpts = { enabled: physicsOn, solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -70, centralGravity: 0.04, springLength: 150, springConstant: 0.08, damping: 0.55, avoidOverlap: 0.85 }, stabilization: { iterations: 160 } }
    } else {
      layoutOpts.improvedLayout = true
      physicsOpts = { enabled: physicsOn, solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -55, centralGravity: 0.015, springLength: 160, springConstant: 0.07, damping: 0.52, avoidOverlap: 0.90 }, stabilization: { iterations: 180 } }
    }

    const net = new Network(containerRef.current, { nodes, edges }, {
      layout: layoutOpts, physics: physicsOpts,
      nodes: { borderWidth: 2 }, edges: { width: 1.4 },
      interaction: { hover: true, tooltipDelay: 100, navigationButtons: true, keyboard: true }
    })
    networkRef.current = net
    net.on('click', p => {
      if (p.nodes?.length) {
        const node = graphData.nodes.find(n => n.id === p.nodes[0])
        if (node) setSelectedNode(node)
      }
    })
  }, [graphData, layout, edgeLabels, hideIsolated, physicsOn, toast])

  const togglePhysics = () => {
    if (!networkRef.current) return
    const next = !physicsOn
    setPhysicsOn(next)
    networkRef.current.setOptions({ physics: { enabled: next } })
    toast(next ? 'Physics resumed' : 'Physics locked', 'info')
  }

  const fitGraph = () => networkRef.current?.fit({ animation: { duration: 600 } })

  const sendAiMessage = async (question) => {
    const q = question || aiInput.trim()
    if (!q) return
    setAiInput('')
    setAiMessages(prev => [...prev, { type: 'user', text: q }])
    setAiBusy(true)
    setAiMessages(prev => [...prev, { type: 'loading' }])
    try {
      const res = await api.aiQuery({ question: q, case_id: selectedCase || null, nodes_count: graphData?.nodes?.length || null, edges_count: graphData?.edges?.length || null })
      setAiMessages(prev => [...prev.filter(m => m.type !== 'loading'), { type: 'bot', text: res.answer || 'No inference generated.', model: res.ai_model }])
    } catch (err) {
      setAiMessages(prev => [...prev.filter(m => m.type !== 'loading'), { type: 'error', text: `Error: ${err.message}` }])
    } finally {
      setAiBusy(false)
      setTimeout(() => chatLogRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 100)
    }
  }

  // Legend from data
  const legend = {}
  ;(graphData?.nodes || []).forEach(n => {
    const l = (n.labels?.[0]) || 'Entity'
    legend[l] = (legend[l] || 0) + 1
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-3xl font-light">Graph Explorer</h1>
        <p className="mt-1 text-mist-500 text-sm">Interactive topological network visualization</p>
      </div>

      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="label">Case Filter</label>
            <select className="field" value={selectedCase} onChange={e => { setSelectedCase(e.target.value); loadGraph(e.target.value) }}>
              <option value="">All Ingested Cases</option>
              {cases.map(c => <option key={c.case_id} value={c.case_id}>{c.case_name || c.case_id}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="label">Layout</label>
            <select className="field" value={layout} onChange={e => setLayout(e.target.value)}>
              <option value="structured">🌟 Structured Organic</option>
              <option value="hierarchy_ud">🌳 Hierarchical Top→Bottom</option>
              <option value="hierarchy_lr">🏛️ Pipeline Left→Right</option>
              <option value="radial">🎯 Radial Orbit</option>
            </select>
          </div>
          <div className="w-32">
            <label className="label">Edge Labels</label>
            <select className="field" value={edgeLabels} onChange={e => setEdgeLabels(e.target.value)}>
              <option value="clean">Clean</option>
              <option value="all">Show All</option>
              <option value="none">None</option>
            </select>
          </div>
          <div className="w-24">
            <label className="label">Limit</label>
            <select className="field" value={limit} onChange={e => setLimit(e.target.value)}>
              <option>300</option><option>600</option><option>1200</option><option>2500</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Btn variant="primary" onClick={() => loadGraph()} disabled={loading}>{loading ? 'Rendering…' : 'Render'}</Btn>
            <Btn variant="accent" onClick={() => setAiOpen(o => !o)}>✨ AI Copilot</Btn>
            <Btn onClick={togglePhysics}>{physicsOn ? '⏸ Pause' : '▶ Live'}</Btn>
            <Btn onClick={fitGraph}>⊕ Fit</Btn>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-mist-500 cursor-pointer select-none">
          <input type="checkbox" className="cursor-pointer" checked={hideIsolated} onChange={e => setHideIsolated(e.target.checked)} />
          Hide isolated 1-hop pairs (focus connected core)
        </label>
      </Section>

      {/* Graph canvas + AI panel */}
      <div className="card overflow-hidden" style={{ height: 560 }}>
        <div className="flex h-full">
          {/* Canvas */}
          <div className="relative flex-1">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950/90 z-10">
                <div className="h-4 w-4 rounded-full bg-alert animate-ping" />
                <div className="text-sm text-mist-300">Generating graph layout…</div>
              </div>
            )}
            {!graphData && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-mist-500">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                <div className="text-sm">Click Render to load graph</div>
              </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
          </div>

          {/* AI Copilot Panel */}
          {aiOpen && (
            <div className="w-80 border-l border-ink-700 flex flex-col bg-ink-900 flex-shrink-0">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-ink-700 bg-ink-950">
                <div className="flex items-center gap-2 text-xs font-bold text-mist-100">
                  <span className="text-alert">✨</span> Gemini Copilot
                  <span className="rounded-full bg-alert/20 text-alert border border-alert/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wide">AI</span>
                </div>
                <button onClick={() => setAiOpen(false)} className="text-mist-500 hover:text-mist-100 text-xs">✕</button>
              </div>

              <div ref={chatLogRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 flex flex-col">
                {aiMessages.map((m, i) => (
                  <div key={i} className={`rounded-lg text-xs leading-relaxed max-w-full ${m.type === 'user' ? 'bg-alert/15 border border-alert/30 px-3 py-2 self-end text-mist-100 font-medium' : m.type === 'loading' ? 'bg-ink-800 border border-ink-600 px-3 py-2' : m.type === 'error' ? 'bg-red-900/20 border border-red-500/40 px-3 py-2 text-red-300' : 'bg-ink-800 border border-ink-700 px-3 py-2 text-mist-100'}`}>
                    {m.type === 'loading' ? (
                      <div className="flex items-center gap-2 text-mist-400"><div className="h-2 w-2 rounded-full bg-alert animate-pulse" /> Gemini analyzing topology…</div>
                    ) : m.type === 'bot' ? (
                      <>
                        {m.model && <div className="text-[9px] uppercase tracking-wider text-alert mb-1 font-bold">✨ {m.model}</div>}
                        <div>{m.text}</div>
                        {m.chips && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {['🎯 Who are the main targets?', '💸 Money laundering flow', '🔍 Summarize graph topology', '📱 Burner phone analysis'].map(chip => (
                              <button key={chip} onClick={() => sendAiMessage(chip)} className="rounded px-1.5 py-1 bg-ink-700 border border-ink-600 text-mist-400 hover:text-alert hover:border-alert/40 transition text-[10px]">{chip}</button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : m.text}
                  </div>
                ))}
              </div>

              <div className="border-t border-ink-700 p-2.5 bg-ink-950">
                <form onSubmit={e => { e.preventDefault(); sendAiMessage() }} className="flex gap-1.5">
                  <input value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Ask about this network…" className="flex-1 rounded-lg bg-ink-800 border border-ink-700 px-2.5 py-2 text-xs text-mist-100 placeholder:text-mist-500 outline-none focus:border-alert/50" />
                  <Btn type="submit" variant="primary" size="sm" disabled={aiBusy}>Ask</Btn>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {Object.keys(legend).length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-mist-400 px-1">
          {Object.entries(legend).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: LABEL_COLOR[k] || '#94a3b8' }} />
              <b className="text-mist-300">{k}</b>
              <span className="font-mono">({v})</span>
            </div>
          ))}
        </div>
      )}

      {stats && <div className="text-xs text-mist-500 font-mono px-1">Subnetwork: {stats}</div>}

      {/* Node Detail Panel */}
      {selectedNode && (
        <Section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: LABEL_COLOR[selectedNode.labels?.[0]] || '#94a3b8' }} />
              <div>
                <div className="font-semibold text-mist-100">{selectedNode.name}</div>
                <Mono className="text-mist-500">{selectedNode.id}</Mono>
              </div>
              <span className="rounded-full bg-ink-700 border border-ink-600 px-2 py-0.5 text-[10px] text-mist-400">{selectedNode.labels?.join(', ')}</span>
            </div>
            <Btn size="sm" onClick={() => setSelectedNode(null)}>✕ Close</Btn>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(selectedNode.properties || {}).filter(([k]) => !['case_ids', 'created_at', 'updated_at'].includes(k)).slice(0, 12).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-ink-950 border border-ink-700 p-3">
                <div className="text-[10px] uppercase tracking-wider text-mist-500 font-bold">{k}</div>
                <div className="mt-1 text-xs font-mono text-mist-100 break-all">{String(v)}</div>
              </div>
            ))}
          </div>
          <Btn className="mt-4" variant="accent" size="sm" onClick={() => sendAiMessage(`Analyze the connections and risk profile of entity ${selectedNode.name || selectedNode.id}`)}>✨ Ask Copilot about this entity</Btn>
        </Section>
      )}
    </div>
  )
}
