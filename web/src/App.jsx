import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import GraphExplorer from './pages/GraphExplorer'
import EntitySearch from './pages/EntitySearch'
import ShortestPath from './pages/ShortestPath'
import Rankings from './pages/Rankings'
import PatternInsights from './pages/PatternInsights'
import BlockchainLedger from './pages/BlockchainLedger'
import CaseRegistry from './pages/CaseRegistry'
import DataIngest from './pages/DataIngest'

// Anything inside <Protected> bounces to /login when there is no session.
function Protected({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Overview />} />
        <Route path="graph" element={<GraphExplorer />} />
        <Route path="search" element={<EntitySearch />} />
        <Route path="path" element={<ShortestPath />} />
        <Route path="rankings" element={<Rankings />} />
        <Route path="insights" element={<PatternInsights />} />
        <Route path="ledger" element={<BlockchainLedger />} />
        <Route path="cases" element={<CaseRegistry />} />
        <Route path="ingest" element={<DataIngest />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
