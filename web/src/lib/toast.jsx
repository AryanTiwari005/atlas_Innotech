import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), type === 'err' ? 6500 : 3800)
  }, [])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto min-w-[280px] max-w-[400px] rounded-xl border border-ink-700 bg-ink-900/95 backdrop-blur px-4 py-3 text-sm font-medium shadow-xl animate-slide-in border-l-4 ${t.type === 'ok' ? 'border-l-ok' : t.type === 'err' ? 'border-l-alert' : 'border-l-sky-400'}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
