import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Section, Skeleton, Empty, Btn, Mono } from '../components/ui'
import { useToast } from '../lib/toast'

const DOC_ICON = { FIR: '📜', CDR_LOG: '📞', BANK_STATEMENT: '💳', SURVEILLANCE_LOG: '📹', INTEL_REPORT: '📄', CASE_MASTER: '📂' }

export default function BlockchainLedger() {
  const [blocks, setBlocks] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(new Set())
  const toast = useToast()

  useEffect(() => {
    Promise.all([api.cases().catch(() => []), api.blockchainLedger()]).then(([caseList, ledger]) => {
      setCases(Array.isArray(caseList) ? caseList : [])
      setBlocks(ledger.blocks || [])
    }).catch(e => toast(e.message, 'err')).finally(() => setLoading(false))
  }, [])

  const toggleCase = (caseId) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(caseId) ? next.delete(caseId) : next.add(caseId)
      return next
    })
  }

  const expandAll = (val) => {
    if (val) {
      const ids = [...new Set(blocks.map(b => b.case_id))]
      setExpanded(new Set(ids))
    } else {
      setExpanded(new Set())
    }
  }

  const verifyChain = async () => {
    try {
      const res = await api.blockchainVerify()
      if (res.valid) toast(`✅ All ${res.total_blocks} blocks verified — 100% untampered!`, 'ok')
      else toast(`🔴 TAMPERED! ${(res.violations || []).join('; ')}`, 'err')
    } catch (e) {
      toast(`Verification failed: ${e.message}`, 'err')
    }
  }

  // Group blocks by case, excluding genesis
  const caseMap = {}
  blocks.forEach(b => {
    const cid = b.case_id || 'UNKNOWN'
    if (cid === 'SYSTEM_GENESIS' || b.document_type === 'SYSTEM_GENESIS') return
    if (!caseMap[cid]) caseMap[cid] = []
    caseMap[cid].push(b)
  })

  const registryCaseIds = cases.map(c => c.case_id)
  const ledgerCaseIds = Object.keys(caseMap)
  const allCaseIds = [...new Set([...registryCaseIds, ...ledgerCaseIds])].sort()

  const q = search.toLowerCase().trim()
  const filteredCaseIds = allCaseIds.filter(cid => {
    if (!q) return true
    const cObj = cases.find(c => c.case_id === cid)
    if (cid.toLowerCase().includes(q) || (cObj?.case_name || '').toLowerCase().includes(q)) return true
    return (caseMap[cid] || []).some(b =>
      (b.document_name || '').toLowerCase().includes(q) ||
      (b.evidence_hash || '').toLowerCase().includes(q)
    )
  })

  const totalTampered = blocks.filter(b => b.is_valid === false).length
  const nonGenesisBlocks = blocks.filter(b => b.case_id !== 'SYSTEM_GENESIS' && b.document_type !== 'SYSTEM_GENESIS')

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-3xl font-light">Chain of Custody Ledger</h1>
        <p className="mt-1 text-mist-500 text-sm">Cryptographic SHA-256 Merkle block proof & anti-tampering evidence verification</p>
      </div>

      {/* Header stats */}
      <Section>
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${totalTampered > 0 ? 'border-alert/40 bg-alert/10 text-alert' : 'border-ok/40 bg-ok/10 text-ok'}`}>
              {totalTampered > 0 ? `🔴 ${totalTampered} TAMPERED BLOCK(S)` : '🟢 100% VERIFIED'}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-950 px-4 py-2.5 text-sm text-mist-300">
              🔐 SHA-256 Merkle Proof
            </div>
          </div>
          <Btn variant="primary" onClick={verifyChain}>🔍 Run Verification Audit</Btn>
        </div>
        <div className="flex gap-3 items-center">
          <input className="field flex-1 max-w-sm" placeholder="Search case ID or document…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Section>

      {/* Cases grid */}
      <Section>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-mist-100">Investigation Cases & Evidence Verification</div>
          <div className="flex items-center gap-2">
            <Btn size="sm" onClick={() => expandAll(true)}>Expand All</Btn>
            <Btn size="sm" onClick={() => expandAll(false)}>Collapse All</Btn>
            <span className="rounded-full bg-ink-700 border border-ink-600 px-3 py-0.5 text-xs text-mist-400">{filteredCaseIds.length} Cases</span>
          </div>
        </div>

        {loading ? <Skeleton rows={4} /> : filteredCaseIds.length === 0 ? (
          <Empty>{q ? `No cases match "${q}".` : 'No blockchain cases recorded. Ingest case data to populate evidence blocks.'}</Empty>
        ) : (
          <div className="space-y-3">
            {filteredCaseIds.map(cid => {
              const caseBlocks = caseMap[cid] || []
              const cObj = cases.find(c => c.case_id === cid)
              const isTampered = caseBlocks.some(b => b.is_valid === false)
              const isExpanded = expanded.has(cid)

              return (
                <div key={cid} className={`card p-5 border ${isTampered ? 'border-alert/40' : 'border-ink-700'}`}>
                  <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => toggleCase(cid)}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl text-alert">📁</span>
                      <div>
                        <div className="font-semibold text-mist-100">{cObj?.case_name || cid}</div>
                        <Mono className="text-mist-500">Case ID: {cid} · {caseBlocks.length} Document Blocks</Mono>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${isTampered ? 'bg-alert/20 text-alert border-alert/40' : 'bg-ok/15 text-ok border-ok/40'}`}>
                        {isTampered ? '🔴 TAMPERED' : '🟢 VERIFIED'}
                      </span>
                      <span className="text-xs text-alert font-semibold">{isExpanded ? '▲ Hide' : '▼ View'} Documents</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-ink-700 border-dashed">
                      {caseBlocks.length === 0 ? (
                        <Empty>No document evidence blocks logged yet for this case.</Empty>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {caseBlocks.map(b => {
                            const isValid = b.is_valid !== false
                            const icon = DOC_ICON[b.document_type] || '📁'
                            return (
                              <div key={b.index} className={`rounded-xl border p-4 bg-ink-950 ${isValid ? 'border-ink-700' : 'border-alert/40'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-2xl">{icon}</span>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${isValid ? 'bg-ok/15 text-ok border-ok/40' : 'bg-alert/20 text-alert border-alert/40'}`}>
                                    {isValid ? 'VERIFIED' : 'TAMPERED'}
                                  </span>
                                </div>
                                <div className="font-semibold text-sm text-mist-100 mb-1">{b.document_name || b.document_type}</div>
                                <Mono className="text-mist-500 block mb-2">ID: {b.document_id} · Block #{b.index}</Mono>
                                <div className="text-[11px] text-mist-500 mb-1">Evidence Hash:</div>
                                <div className={`font-mono text-[10px] break-all rounded-lg p-2 border border-ink-700 bg-ink-900 ${isValid ? 'text-sky-300' : 'text-alert'}`}>
                                  {b.evidence_hash}
                                </div>
                                <div className="text-[10px] text-mist-500 mt-2 text-right">{b.formatted_time}</div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* History Table */}
      <Section>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-mist-100">Immutable Block History Ledger</div>
          <span className="rounded-full bg-ink-700 border border-ink-600 px-3 py-0.5 text-xs text-mist-400">{nonGenesisBlocks.length} Blocks</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-ink-700">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink-700 bg-ink-950/50">
                {['Block #', 'Case ID', 'Document / Type', 'Timestamp', 'Hash (SHA-256)', 'Merkle Root', 'Status'].map(h => (
                  <th key={h} className="px-3 py-3 text-left uppercase tracking-wider text-mist-500 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nonGenesisBlocks.length === 0 ? (
                <tr><td colSpan="7"><Empty>No blockchain blocks recorded.</Empty></td></tr>
              ) : nonGenesisBlocks.map(b => {
                const isValid = b.is_valid !== false
                return (
                  <tr key={b.index} className={`border-b border-ink-700/50 hover:bg-ink-800/30 transition ${!isValid ? 'bg-alert/5' : ''}`}>
                    <td className="px-3 py-3 font-mono font-bold text-mist-100">#{b.index}</td>
                    <td className="px-3 py-3">
                      <span className="cursor-pointer rounded-full bg-alert/15 text-alert border border-alert/40 px-2 py-0.5 text-[10px] font-mono" onClick={() => toggleCase(b.case_id)}>
                        {b.case_id}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-mist-100">{b.document_name || b.document_type || 'CASE_MASTER'}</div>
                      <Mono className="text-mist-500">({b.document_type})</Mono>
                    </td>
                    <td className="px-3 py-3 text-mist-400">{b.formatted_time}</td>
                    <td className="px-3 py-3 font-mono text-sky-300" title={b.evidence_hash}>{(b.evidence_hash || '').substring(0, 16)}…</td>
                    <td className="px-3 py-3 font-mono text-mist-500" title={b.merkle_root}>{(b.merkle_root || '').substring(0, 16)}…</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${isValid ? 'bg-ok/15 text-ok border-ok/40' : 'bg-alert/20 text-alert border-alert/40'}`}>
                        {isValid ? 'VERIFIED' : 'TAMPERED'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
