import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { useToast } from '../lib/toast'
import Logo from './Logo'
import MeshBackground from './MeshBackground'

const NAV = [
  {
    to: '/',
    label: 'Command Center',
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M4 13 9 4l5 9H4Zm6 0 5-8 5 8h-10Z" />
      </svg>
    )
  },
  {
    to: '/graph',
    label: 'Graph Explorer',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M12 3a2 2 0 0 1 2 2c0 .4-.1.8-.3 1.1l3.4 5.4c.3-.1.6-.2.9-.2a2 2 0 1 1 0 4c-.3 0-.6-.1-.9-.2l-3.4 5.4c.2.3.3.7.3 1.1a2 2 0 1 1-3.6-1.1L8.9 15.5c-.3.1-.6.2-.9.2a2 2 0 1 1 0-4c.3 0 .6.1.8.2l3.4-5.4c-.2-.3-.3-.7-.3-1.1a2 2 0 0 1 2-2Z" />
      </svg>
    )
  },
  {
    to: '/search',
    label: 'Entity Search',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35" />
      </svg>
    )
  },
  {
    to: '/path',
    label: 'Shortest Path',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M4 5h12m0 0-3-3m3 3-3 3M4 19h12m0 0-3-3m3 3-3 3M8 8v8" />
      </svg>
    )
  },
  {
    to: '/rankings',
    label: 'Rankings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M3 17l4-4 4 4 5-5 4 4" />
      </svg>
    )
  },
  {
    to: '/insights',
    label: 'Pattern Insights',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M12 3l1.9 5.6L19 10l-5.1 1.9L12 17.5l-1.9-5.6L5 10l5.1-1.4L12 3Z" />
      </svg>
    )
  },
  {
    to: '/ledger',
    label: 'Chain of Custody',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    )
  },
  {
    to: '/cases',
    label: 'Case Registry',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      </svg>
    )
  },
  {
    to: '/ingest',
    label: 'Data Ingestion',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M12 5v14m-7-7h14" />
      </svg>
    )
  },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const handleResetDb = async () => {
    const ok = window.confirm(
      '⚠️ RESET DATABASE WARNING:\n\nThis will permanently wipe ALL cases, suspect entities, transaction links, and forensic records from Neo4j.\n\nAre you sure you want to proceed?'
    )
    if (!ok) return

    setResetting(true)
    try {
      const res = await api.resetDb()
      toast(res.message || 'Neo4j database reset successfully.', 'ok')
      navigate('/')
      window.location.reload()
    } catch (e) {
      toast(`Reset failed: ${e.message}`, 'err')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex bg-ink-950 text-mist-100 overflow-x-hidden">
      <MeshBackground />

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sideways Navigation Bar (Sidebar) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col justify-between border-r border-ink-700/70 bg-ink-950/90 backdrop-blur-2xl transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Header */}
        <div className="p-5 border-b border-ink-700/60">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-mist-400 hover:text-mist-100 text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Middle: Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-mist-500">
            Analytics Modules
          </div>

          <nav className="space-y-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] transition-all duration-150 select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-[0_4px_18px_-2px_rgba(6,182,212,0.45)] border border-cyan-400/30'
                      : 'text-mist-400 hover:text-white hover:bg-white/[0.05] font-medium'
                  }`
                }
              >
                {n.icon}
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom: System Status & Quick Actions */}
        <div className="p-4 border-t border-ink-700/60 bg-ink-950/60 space-y-3">
          <div>
            <div className="text-[11px] font-medium text-mist-300">Case-Graph Intelligence Engine</div>
            <div className="text-[10px] font-mono text-mist-500 mt-0.5">Neo4j GDS · FastAPI</div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={handleResetDb}
              disabled={resetting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-semibold shadow-[0_4px_14px_-2px_rgba(239,68,68,0.45)] hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>{resetting ? 'Resetting…' : 'Reset DB'}</span>
            </button>

            <button
              onClick={logout}
              title={`Logged in as ${user?.analystId || 'Analyst'} · Click to Sign out`}
              className="h-8 px-2.5 rounded-xl border border-ink-700 bg-ink-900/80 hover:bg-ink-800 text-mist-400 hover:text-mist-100 text-xs font-medium transition flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top bar for mobile toggle & analyst indicator */}
        <header className="relative z-10 border-b border-ink-700/40 bg-ink-950/40 backdrop-blur px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-ink-900 border border-ink-700 text-mist-300 hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-mist-400">
              <span className="h-2 w-2 rounded-full bg-ok shadow-[0_0_8px_#34d399]" />
              <span>Atlas Graph Connected</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-mist-400 bg-ink-900/90 border border-ink-700/80 px-2.5 py-1 rounded-lg">
              {user?.analystId || 'analyst.01'}
            </span>
            <button
              onClick={logout}
              className="text-xs text-mist-400 hover:text-alert transition"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Page View Body */}
        <main className="relative z-10 flex-1 px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
