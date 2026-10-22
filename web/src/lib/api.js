// Centralized API wrapper — all paths are relative, Vite proxies /api → FastAPI :8002
const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const isForm = options.body instanceof FormData
  const headers = isForm ? {} : { 'Content-Type': 'application/json' }
  const controller = new AbortController()
  const timeoutMs = options.timeout || 45000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { ...headers, ...(options.headers || {}) },
      signal: options.signal || controller.signal,
      ...options,
    })
    if (!res.ok) {
      let detail = res.statusText
      try {
        const body = await res.json()
        if (typeof body.detail === 'string') detail = body.detail
        else if (Array.isArray(body.detail)) detail = body.detail.map(e => e.msg).join('; ')
        else detail = body.message || detail
      } catch { /* not JSON */ }
      const err = new Error(detail || `HTTP ${res.status}`)
      err.status = res.status
      throw err
    }
    return res.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The backend server was waking up from cold storage. Please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export const api = {
  health: () => request('/api/health'),
  cases: (limit = 200) => request(`/api/cases?limit=${limit}`),
  case: (id) => request(`/api/cases/${encodeURIComponent(id)}`),
  deleteCase: (id) => request(`/api/cases/${encodeURIComponent(id)}?confirm=true`, { method: 'DELETE' }),
  resetDb: () => request('/api/cases/reset?confirm=true', { method: 'DELETE' }),
  ingestCase: (body) => request('/api/cases/ingest', { method: 'POST', body: JSON.stringify(body) }),
  ingestFiles: (formData) => request('/api/v1/ingest', { method: 'POST', body: formData }),
  ingestText: (text) => request('/api/v1/ingest/text', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: text,
  }),

  graph: (caseId, limit = 1200) => {
    const q = new URLSearchParams({ limit })
    if (caseId) q.set('case_id', caseId)
    return request(`/api/graph?${q}`)
  },

  entitySearch: (q, type, limit = 50) => {
    const qs = new URLSearchParams({ q, limit })
    if (type) qs.set('entity_type', type)
    return request(`/api/entities/search?${qs}`)
  },
  entity: (id) => request(`/api/entities/${encodeURIComponent(id)}`),

  shortestPath: (params) => request(`/api/cases/shortest-path?${new URLSearchParams(params)}`),

  rankings: (params) => request(`/api/cases/rankings?${new URLSearchParams(params)}`),

  caseInsights: (caseId) => request(`/api/cases/${encodeURIComponent(caseId)}/insights`),
  deltaInsights: () => request('/api/insights/delta'),
  caseAiInsights: (caseId) => request(`/api/cases/${encodeURIComponent(caseId)}/ai-insights`),
  aiQuery: (body) => request('/api/graph/ai-query', { method: 'POST', body: JSON.stringify(body) }),

  blockchainLedger: () => request('/api/v1/blockchain/ledger'),
  blockchainVerify: () => request('/api/v1/blockchain/verify-chain'),
}
