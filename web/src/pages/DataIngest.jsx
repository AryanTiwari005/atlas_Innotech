import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Section, Skeleton, Btn, Mono } from '../components/ui'
import { useToast } from '../lib/toast'

export default function DataIngest() {
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'json' | 'text' | 'presets'
  const [files, setFiles] = useState([])
  const [jsonText, setJsonText] = useState('')
  const [narrativeText, setNarrativeText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const toast = useToast()
  const navigate = useNavigate()

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) {
      setFiles(Array.from(e.dataTransfer.files))
    }
  }

  // Upload Files via /api/v1/ingest
  const uploadFiles = async () => {
    if (!files.length) {
      toast('Please select at least one file to upload', 'info')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    toast(`Uploading ${files.length} file(s)…`, 'info')

    try {
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))
      const res = await api.ingestFiles(fd)
      setResult(res)
      toast('Files ingested successfully into Neo4j graph!', 'ok')
      setFiles([])
    } catch (e) {
      setError(e.message)
      toast(`Ingestion failed: ${e.message}`, 'err')
    } finally {
      setBusy(false)
    }
  }

  // Ingest Structured JSON via /api/cases/ingest
  const ingestJsonPayload = async () => {
    if (!jsonText.trim()) {
      toast('Please paste structured Case JSON', 'info')
      return
    }
    let raw = jsonText.trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    }
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      toast(`Invalid JSON format: ${e.message}`, 'err')
      return
    }

    setBusy(true)
    setError('')
    setResult(null)
    toast('Ingesting structured case payload…', 'info')

    try {
      const res = await api.ingestCase(parsed)
      setResult(res)
      toast(`Case ${res.case_id || 'ingested'} successfully registered!`, 'ok')
    } catch (e) {
      setError(e.message)
      toast(`Ingestion failed: ${e.message}`, 'err')
    } finally {
      setBusy(false)
    }
  }

  // Ingest Raw Narrative Text via /api/v1/ingest/text
  const ingestNarrative = async () => {
    if (!narrativeText.trim()) {
      toast('Please enter case narrative or FIR report text', 'info')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    toast('Parsing entities from narrative text…', 'info')

    try {
      const res = await api.ingestText(narrativeText.trim())
      setResult(res)
      toast('Narrative parsed and ingested into knowledge graph!', 'ok')
    } catch (e) {
      setError(e.message)
      toast(`Ingestion failed: ${e.message}`, 'err')
    } finally {
      setBusy(false)
    }
  }

  // Preset sample loader
  const loadPreset = async (fileName) => {
    setBusy(true)
    setError('')
    setResult(null)
    toast(`Loading dataset/${fileName}…`, 'info')

    try {
      const data = await api.ingestCase(SAMPLE_CASES[fileName])
      setResult(data)
      toast(`Sample ${fileName} ingested successfully!`, 'ok')
    } catch (e) {
      setError(e.message)
      toast(`Sample load failed: ${e.message}`, 'err')
    } finally {
      setBusy(false)
    }
  }

  const created = result?.created || {}

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-3xl font-light">Data Ingestion</h1>
        <p className="mt-1 text-mist-500 text-sm">
          Ingest structured forensic case JSON, CDR logs, bank statements, or raw FIR narrative reports
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-ink-700/70 pb-3">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pill ${activeTab === 'upload' ? 'pill-active' : 'hover:text-mist-100'}`}
        >
          📂 File Upload (JSON / CSV / TXT)
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`pill ${activeTab === 'json' ? 'pill-active' : 'hover:text-mist-100'}`}
        >
          📝 Direct Case JSON
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`pill ${activeTab === 'text' ? 'pill-active' : 'hover:text-mist-100'}`}
        >
          📜 Narrative / FIR Text
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`pill ${activeTab === 'presets' ? 'pill-active' : 'hover:text-mist-100'}`}
        >
          ⚡ Dataset Presets
        </button>
      </div>

      {/* Tab 1: File Upload */}
      {activeTab === 'upload' && (
        <Section>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink-600 bg-ink-950/60 p-10 text-center hover:border-alert/60 transition cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="rounded-full bg-alert/10 p-4 text-alert">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14m-7-7h14" />
                <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
              </svg>
            </div>
            <div>
              <div className="text-base font-medium text-mist-100">
                Drag & Drop investigation files here, or <span className="text-alert underline">Browse</span>
              </div>
              <div className="text-xs text-mist-500 mt-1">
                Supports Case JSON payloads, Telecom CDR CSVs, Bank statement CSVs, and text narratives
              </div>
            </div>
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4 rounded-xl border border-ink-700 bg-ink-950 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-mist-400 mb-2">
                Selected Files ({files.length})
              </div>
              <div className="space-y-1 mb-4">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-mist-200">
                    <span>📄 {f.name}</span>
                    <Mono className="text-mist-500">{(f.size / 1024).toFixed(1)} KB</Mono>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Btn variant="primary" disabled={busy} onClick={uploadFiles}>
                  {busy ? 'Ingesting Files…' : `Ingest ${files.length} File(s)`}
                </Btn>
                <Btn onClick={() => setFiles([])} disabled={busy}>Clear</Btn>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Tab 2: Case JSON */}
      {activeTab === 'json' && (
        <Section>
          <div className="flex items-center justify-between mb-3">
            <label className="label">Paste Structured Case JSON</label>
            <span className="text-xs text-mist-500">Endpoints: POST /api/cases/ingest</span>
          </div>
          <textarea
            className="field font-mono text-xs leading-relaxed"
            rows="12"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`{\n  "case_metadata": {\n    "case_id": "CASE-2024-001",\n    "case_name": "Sample Operation",\n    "case_type": "FRAUD",\n    "status": "UNDER_INVESTIGATION"\n  },\n  "fir_records": [],\n  "entities": { "people": [] }\n}`}
          />
          <div className="mt-4 flex gap-2">
            <Btn variant="primary" disabled={busy} onClick={ingestJsonPayload}>
              {busy ? 'Ingesting JSON…' : 'Ingest Case JSON'}
            </Btn>
            <Btn onClick={() => setJsonText('')} disabled={busy}>Clear</Btn>
          </div>
        </Section>
      )}

      {/* Tab 3: Narrative Text */}
      {activeTab === 'text' && (
        <Section>
          <div className="flex items-center justify-between mb-3">
            <label className="label">Direct Narrative / FIR Report Text</label>
            <span className="text-xs text-mist-500">AI & Heuristic extraction via POST /api/v1/ingest/text</span>
          </div>
          <textarea
            className="field text-xs leading-relaxed"
            rows="10"
            value={narrativeText}
            onChange={(e) => setNarrativeText(e.target.value)}
            placeholder="Paste raw unformatted case narrative, FIR description, phone numbers, or suspect statements here. Atlas will extract entities and resolve connections automatically…"
          />
          <div className="mt-4 flex gap-2">
            <Btn variant="primary" disabled={busy} onClick={ingestNarrative}>
              {busy ? 'Parsing & Ingesting…' : 'Ingest Narrative Text'}
            </Btn>
            <Btn onClick={() => setNarrativeText('')} disabled={busy}>Clear</Btn>
          </div>
        </Section>
      )}

      {/* Tab 4: Dataset Presets */}
      {activeTab === 'presets' && (
        <Section>
          <div className="text-sm font-semibold text-mist-100 mb-2">Available Benchmark Cases</div>
          <div className="text-xs text-mist-500 mb-4">
            Pre-configured benchmark datasets located in the <Mono>dataset/</Mono> folder. Click any case below to ingest directly into Neo4j:
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-ink-700 bg-ink-950 p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-alert uppercase tracking-wide">HOMICIDE</div>
                <div className="font-semibold text-mist-100 mt-1">Operation Nightfall</div>
                <div className="text-xs text-mist-500 mt-1">
                  CASE-2024-001 · Contract killing with phone taps, bank kickbacks & shooter network.
                </div>
              </div>
              <Btn size="sm" variant="primary" className="mt-4" disabled={busy} onClick={() => loadPreset('case_001_homicide.json')}>
                Ingest Case 001 →
              </Btn>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-950 p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-ok uppercase tracking-wide">FRAUD</div>
                <div className="font-semibold text-mist-100 mt-1">Hawala & Mule Ring</div>
                <div className="text-xs text-mist-500 mt-1">
                  CASE-2024-002 · High-volume shell accounts, multi-layered mule laundering.
                </div>
              </div>
              <Btn size="sm" variant="primary" className="mt-4" disabled={busy} onClick={() => loadPreset('case_002_fraud.json')}>
                Ingest Case 002 →
              </Btn>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-950 p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wide">CARGO DIVERSION</div>
                <div className="font-semibold text-mist-100 mt-1">Fictional Cargo Diversion</div>
                <div className="text-xs text-mist-500 mt-1">
                  CASE-2024-003 · Multi-jurisdictional freight diversion, logistics nexus & cell tracking.
                </div>
              </div>
              <Btn size="sm" variant="primary" className="mt-4" disabled={busy} onClick={() => loadPreset('case_003_fictional_cargo_diversion.json')}>
                Ingest Case 003 →
              </Btn>
            </div>
          </div>
        </Section>
      )}

      {/* Error display */}
      {error && (
        <div className="rounded-xl border border-alert/40 bg-alert/10 p-4 text-sm text-alert">
          {error}
        </div>
      )}

      {/* Ingestion Results Display */}
      {result && (
        <Section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-base font-semibold text-mist-100">Ingestion Succeeded</div>
              <div className="text-xs text-mist-500">
                Case Identifier: <Mono className="text-alert">{result.case_id || result.metadata?.case_id || 'REGISTERED'}</Mono>
              </div>
            </div>
            <div className="flex gap-2">
              <Btn size="sm" variant="accent" onClick={() => navigate('/graph')}>Explore in Graph →</Btn>
              <Btn size="sm" onClick={() => navigate('/cases')}>View Case Registry →</Btn>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-ink-950 border border-ink-700 p-3">
              <div className="text-[10px] uppercase text-mist-500 font-bold">Nodes Created</div>
              <div className="mt-1 text-xl font-mono font-bold text-mist-100">
                {created.nodes ?? result.nodes_created ?? result.total_entities ?? 0}
              </div>
            </div>
            <div className="rounded-lg bg-ink-950 border border-ink-700 p-3">
              <div className="text-[10px] uppercase text-mist-500 font-bold">Relationships</div>
              <div className="mt-1 text-xl font-mono font-bold text-mist-100">
                {created.relationships ?? result.relationships_created ?? 0}
              </div>
            </div>
            <div className="rounded-lg bg-ink-950 border border-ink-700 p-3">
              <div className="text-[10px] uppercase text-mist-500 font-bold">Source Records</div>
              <div className="mt-1 text-xl font-mono font-bold text-mist-100">
                {created.source_records ?? result.documents_indexed ?? 1}
              </div>
            </div>
            <div className="rounded-lg bg-ink-950 border border-ink-700 p-3">
              <div className="text-[10px] uppercase text-mist-500 font-bold">New Insights</div>
              <div className="mt-1 text-xl font-mono font-bold text-alert">
                {result.new_insights ?? result.patterns_detected ?? 0}
              </div>
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}

// Built-in presets for instant ingestion in UI
const SAMPLE_CASES = {
  'case_001_homicide.json': {
    case_metadata: {
      case_id: 'CASE-2024-001',
      case_name: 'Operation Nightfall Homicide Investigation',
      case_type: 'HOMICIDE',
      status: 'UNDER_INVESTIGATION',
      jurisdiction: 'Metro Central Police Division',
      lead_investigator: 'Inspector Vikram Malhotra',
      created_date: '2024-10-15',
      summary: 'Investigation into targeted homicide of businessman Rajiv Sen at Grand Park Hotel, involving coordinated surveillance and financial kickbacks.',
      tags: ['Homicide', 'Contract_Killing', 'High_Priority']
    },
    fir_records: [
      {
        fir_id: 'FIR-2024-1092',
        fir_number: '1092/2024',
        police_station: 'Central Station',
        date: '2024-10-15',
        sections: ['IPC 302', 'IPC 120B'],
        complainant: 'Amit Sen',
        summary: 'Armed assault resulting in death of Rajiv Sen.',
        accused_person_ids: ['P-001', 'P-002']
      }
    ],
    entities: {
      people: [
        { person_id: 'P-001', name: 'Devendra Sharma', aliases: ['Deva'], dob: '1982-06-14', roles: ['Suspect', 'Organizer'], risk_level: 'CRITICAL' },
        { person_id: 'P-002', name: 'Karan Singhania', aliases: ['Karan Shooter'], dob: '1990-11-03', roles: ['Suspect', 'Shooter'], risk_level: 'CRITICAL' },
        { person_id: 'P-003', name: 'Rajiv Sen', aliases: ['Target'], dob: '1975-01-22', roles: ['Victim'], risk_level: 'LOW' }
      ],
      phones: [
        { phone_number: '+919811002233', imei: '864201041122334', registered_owner_id: 'P-001', is_burner: true },
        { phone_number: '+919822334455', imei: '864201049988776', registered_owner_id: 'P-002', is_burner: true }
      ],
      bank_accounts: [
        { account_number: 'HDFC-8899001122', bank_name: 'HDFC Bank', account_holder_id: 'P-001', branch: 'Connaught Place' }
      ],
      vehicles: [
        { license_plate: 'DL-01-AB-1234', vehicle_type: 'Sedan', owner_id: 'P-002' }
      ]
    },
    relationships: {
      calls: [
        { caller_phone: '+919811002233', receiver_phone: '+919822334455', call_count: 14, total_duration_seconds: 3200 }
      ],
      transfers: [
        { from_account: 'HDFC-8899001122', to_account: 'HDFC-8899001122', amount: 500000, currency: 'INR', transaction_count: 2 }
      ]
    }
  },
  'case_002_fraud.json': {
    case_metadata: {
      case_id: 'CASE-2024-002',
      case_name: 'Operation Golden Shell Hawala Syndicate',
      case_type: 'FINANCIAL_FRAUD',
      status: 'UNDER_INVESTIGATION',
      jurisdiction: 'Economic Offences Wing, Mumbai',
      lead_investigator: 'ACP Neha Deshmukh',
      created_date: '2024-11-01',
      summary: 'Cross-border multi-layered money laundering and Hawala network utilizing fake import invoices and mule accounts.',
      tags: ['Hawala', 'Money_Laundering', 'EOW']
    },
    fir_records: [
      {
        fir_id: 'FIR-2024-0418',
        fir_number: '0418/2024',
        police_station: 'Cyber & Financial Crime Cell',
        date: '2024-11-01',
        sections: ['IPC 420', 'IPC 467', 'PMLA Sec 3'],
        complainant: 'Financial Intelligence Unit',
        summary: 'Suspicious transactions across 12 layered accounts totaling 45 Crores.',
        accused_person_ids: ['P-101', 'P-102']
      }
    ],
    entities: {
      people: [
        { person_id: 'P-101', name: 'Ramesh Chawla', aliases: ['RC Operator'], dob: '1970-03-12', roles: ['Kingpin', 'Hawala_Dealer'], risk_level: 'CRITICAL' },
        { person_id: 'P-102', name: 'Sunil Verma', aliases: ['Mule Manager'], dob: '1985-08-25', roles: ['Recruiter'], risk_level: 'HIGH' }
      ],
      phones: [
        { phone_number: '+919876543210', imei: '358901051234567', registered_owner_id: 'P-101', is_burner: false }
      ],
      bank_accounts: [
        { account_number: 'ICICI-9988776655', bank_name: 'ICICI Bank', account_holder_id: 'P-101', branch: 'Nariman Point' },
        { account_number: 'AXIS-1122334455', bank_name: 'Axis Bank', account_holder_id: 'P-102', branch: 'Andheri East' }
      ]
    },
    relationships: {
      transfers: [
        { from_account: 'ICICI-9988776655', to_account: 'AXIS-1122334455', amount: 2500000, currency: 'INR', transaction_count: 8 }
      ]
    }
  },
  'case_003_fictional_cargo_diversion.json': {
    case_metadata: {
      case_id: 'CASE-2024-003',
      case_name: 'Highway Freight Diversion Syndicate',
      case_type: 'CARGO_THEFT',
      status: 'OPEN',
      jurisdiction: 'Highway Patrol & Crime Branch',
      lead_investigator: 'Inspector Rajesh Rathore',
      created_date: '2024-11-15',
      summary: 'Syndicate intercepting high-value electronics freight between logistics hubs with GPS jammer deployment.',
      tags: ['Cargo_Theft', 'Interstate_Gang']
    },
    fir_records: [
      {
        fir_id: 'FIR-2024-0899',
        fir_number: '0899/2024',
        police_station: 'Highway Police Post NH-48',
        date: '2024-11-15',
        sections: ['IPC 379', 'IPC 411'],
        complainant: 'Global Logistics Express',
        summary: 'Theft of freight container containing mobile shipments worth 3.2 Crores.',
        accused_person_ids: ['P-201', 'P-202']
      }
    ],
    entities: {
      people: [
        { person_id: 'P-201', name: 'Suraj Bhan', aliases: ['Bhan Driver'], dob: '1988-04-19', roles: ['Driver', 'Insider'], risk_level: 'HIGH' },
        { person_id: 'P-202', name: 'Manish Tyagi', aliases: ['Fencing Boss'], dob: '1979-09-30', roles: ['Receiver', 'Distributor'], risk_level: 'CRITICAL' }
      ],
      phones: [
        { phone_number: '+919911223344', imei: '867543029182736', registered_owner_id: 'P-201', is_burner: true },
        { phone_number: '+919822114477', imei: '867543029988112', registered_owner_id: 'P-202', is_burner: true }
      ],
      vehicles: [
        { license_plate: 'HR-55-XY-9900', vehicle_type: 'Heavy Truck', owner_id: 'P-201' }
      ],
      bank_accounts: [
        { account_number: 'SBI-4455667788', bank_name: 'State Bank of India', account_holder_id: 'P-202', branch: 'Gurugram' }
      ]
    },
    relationships: {
      calls: [
        { caller_phone: '+919911223344', receiver_phone: '+919822114477', call_count: 22, total_duration_seconds: 5400 }
      ]
    }
  }
}
