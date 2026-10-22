import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import Logo from '../components/Logo'
import MeshBackground from '../components/MeshBackground'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [analystId, setAnalystId] = useState('')
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try { await login(analystId, passcode); navigate('/') }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="relative grid min-h-full place-items-center overflow-hidden px-6 py-12">
      <MeshBackground />
      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <section>
            <span className="inline-flex items-center gap-2 rounded-pill border border-alert/50 bg-alert-soft px-4 py-1.5 text-sm text-alert">
              <span className="h-1.5 w-1.5 rounded-full bg-alert" /> Restricted · Authorised analysts only
            </span>
            <h1 className="mt-6 text-4xl font-light leading-tight md:text-5xl">
              See the network<br />behind the case.
            </h1>
            <p className="mt-5 max-w-md text-mist-300">
              Link calls, transfers and sightings into one graph, surface suspicious patterns,
              and keep every piece of evidence verifiable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {['Graph analytics', 'Pattern detection', 'Evidence ledger'].map(t => <span key={t} className="pill">{t}</span>)}
            </div>
          </section>

          <form onSubmit={submit} className="card p-8">
            <Logo size="lg" />
            <h2 className="mt-6 text-xl font-medium">Sign in</h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="id">Analyst ID</label>
                <input id="id" className="field" value={analystId} autoFocus
                  onChange={e => setAnalystId(e.target.value)} placeholder="e.g. analyst.01" />
              </div>
              <div>
                <label className="label" htmlFor="pw">Access code</label>
                <input id="pw" type="password" className="field" value={passcode}
                  onChange={e => setPasscode(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            {error && <p role="alert" className="mt-4 rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert">{error}</p>}
            <button className="btn-red mt-6 w-full" disabled={busy}>{busy ? 'Signing in…' : 'Enter workspace'}</button>
            <p className="mt-4 text-center text-xs text-mist-500">All sessions are logged for review.</p>
          </form>
        </div>
      </div>
    </div>
  )
}
