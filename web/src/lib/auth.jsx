import { createContext, useContext, useState } from 'react'

/*
  DEMO LOGIN ONLY. The ATLAS backend has no auth yet, so this gate lives in the
  browser and is NOT a security boundary. It is isolated in `login()` so a real
  backend login (JWT) can replace this one function later without touching the UI.
*/
const PASSCODE = import.meta.env.VITE_DEMO_PASSCODE || 'atlas-demo'
const KEY = 'atlas.session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(KEY)) } catch { return null }
  })

  async function login(analystId, passcode) {
    if (!analystId.trim()) throw new Error('Enter your analyst ID.')
    if (passcode !== PASSCODE) throw new Error('Incorrect access code.')
    const session = { analystId: analystId.trim(), at: Date.now() }
    sessionStorage.setItem(KEY, JSON.stringify(session))
    setUser(session)
  }

  function logout() {
    sessionStorage.removeItem(KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
