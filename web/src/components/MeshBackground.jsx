import { useMemo } from 'react'

/*
  Our own low-poly "network" backdrop: a jittered grid of points joined by
  thin lines, drawn once as SVG. A seeded random generator keeps it identical
  on every render (no flicker), and pointer-events-none keeps it click-through.
*/
function seeded(seed) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export default function MeshBackground() {
  const { lines, dots } = useMemo(() => {
    const rand = seeded(42)
    const cols = 12, rows = 8, w = 1200, h = 800
    const pts = []
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        pts.push({
          x: (c / cols) * w + (rand() - 0.5) * 90,
          y: (r / rows) * h + (rand() - 0.5) * 90,
        })
      }
    }
    const at = (c, r) => pts[r * (cols + 1) + c]
    const lines = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = at(c, r), b = at(c + 1, r), d = at(c, r + 1), e = at(c + 1, r + 1)
        lines.push([a, b], [a, d], [a, e])
      }
    }
    return { lines, dots: pts.filter((_, i) => i % 7 === 0) }
  }, [])

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.55]"
      viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
    >
      <defs>
        <radialGradient id="fade" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="m"><rect width="1200" height="800" fill="url(#fade)" /></mask>
      </defs>
      <g mask="url(#m)" stroke="#4a4358" strokeWidth="1" fill="none">
        {lines.map(([p, q], i) => <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />)}
      </g>
      <g mask="url(#m)" fill="#f23d3d">
        {dots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" opacity="0.8" />)}
      </g>
    </svg>
  )
}
