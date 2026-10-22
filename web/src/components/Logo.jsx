export default function Logo({ size = 'md' }) {
  const box = size === 'lg' ? 'h-11 w-11' : 'h-10 w-10'
  return (
    <div className="flex items-center gap-3">
      <div className={`${box} grid place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 shadow-[0_6px_20px_-3px_rgba(6,182,212,0.45)] ring-1 ring-white/20 flex-shrink-0`}>
        {/* Network connection glyph */}
        <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-white" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="17.5" cy="6.5" r="2.5" />
          <circle cx="6.5" cy="12" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
          <line x1="8.8" y1="13.1" x2="15.2" y2="16.4" />
          <line x1="8.8" y1="10.9" x2="15.2" y2="7.6" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-xl font-bold tracking-tight text-mist-100">Atlas</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400/90">Graph Intelligence</div>
      </div>
    </div>
  )
}
