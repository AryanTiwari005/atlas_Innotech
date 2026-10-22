// Reusable severity badge
export function SeverityBadge({ severity }) {
  const s = (severity || 'LOW').toUpperCase()
  const cls = {
    CRITICAL: 'bg-red-500/20 text-red-300 border border-red-500/40',
    HIGH:     'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    MEDIUM:   'bg-sky-500/20 text-sky-300 border border-sky-500/40',
    LOW:      'bg-ok/20 text-ok border border-ok/40',
  }[s] || 'bg-ink-700 text-mist-300 border border-ink-600'
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${cls}`}>{s}</span>
}

// Status tag for case open/closed
export function StatusTag({ status }) {
  const s = (status || 'OPEN').toUpperCase()
  const isClose = s.includes('CLOSE')
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${isClose ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-alert/20 text-alert border border-alert/40'}`}>
      {s}
    </span>
  )
}

// Empty state placeholder
export function Empty({ icon, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-mist-500 text-sm">
      {icon && <div className="opacity-50">{icon}</div>}
      {children}
    </div>
  )
}

// Skeleton shimmer row
export function Skeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-ink-800 animate-pulse" />
      ))}
    </div>
  )
}

// Stat card
export function StatCard({ label, value, sub, accent = 'cyan' }) {
  const glowMap = {
    cyan:   'after:bg-sky-400/20',
    purple: 'after:bg-purple-400/20',
    amber:  'after:bg-amber-400/20',
    green:  'after:bg-ok/20',
    red:    'after:bg-alert/20',
  }
  return (
    <div className={`relative card p-6 overflow-hidden after:content-[''] after:absolute after:top-[-40px] after:right-[-40px] after:w-[120px] after:h-[120px] after:rounded-full ${glowMap[accent] || glowMap.cyan} hover:-translate-y-0.5 transition-transform`}>
      <div className="text-[11px] uppercase tracking-widest text-mist-500 font-bold">{label}</div>
      <div className="mt-2 text-4xl font-light tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-mist-500">{sub}</div>}
    </div>
  )
}

// Modal
export function Modal({ open, onClose, children, maxW = 'max-w-2xl' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`card w-full ${maxW} max-h-[88vh] overflow-y-auto p-7 relative`}>
        {children}
      </div>
    </div>
  )
}

// Mono text
export function Mono({ children, className = '' }) {
  return <span className={`font-mono text-xs ${className}`}>{children}</span>
}

// Section card wrapper
export function Section({ children, className = '' }) {
  return <div className={`card p-6 mb-5 ${className}`}>{children}</div>
}

// Button variants
export function Btn({ children, onClick, variant = 'ghost', size = 'md', disabled, className = '', type = 'button' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-sm' }
  const variants = {
    primary: 'bg-alert text-white hover:bg-alert-dark shadow-glow',
    ghost:   'border border-ink-600 bg-ink-800 text-mist-100 hover:border-mist-500',
    danger:  'bg-red-600 text-white hover:bg-red-700',
    accent:  'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30',
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}
