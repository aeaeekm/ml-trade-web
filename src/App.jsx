import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import useAuthStore from './store/authStore'
import useThemeStore from './store/themeStore'

import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StrategiesPage from './pages/StrategiesPage'
import BacktestPage from './pages/BacktestPage'
import ModelsPage from './pages/ModelsPage'
import TradesPage from './pages/TradesPage'
import PortfolioPage from './pages/PortfolioPage'
import SettingsPage from './pages/SettingsPage'
import MT5AccountsPage from './pages/MT5AccountsPage'
import StrategyDetailPage from './pages/StrategyDetailPage'
import UsersPage from './pages/UsersPage'
import RolePermissionsPage from './pages/RolePermissionsPage'
import AuditLogsPage from './pages/AuditLogsPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  const { initialize } = useAuthStore()
  const { init } = useThemeStore()

  useEffect(() => {
    init()
    initialize()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"  element={<DashboardPage />} />
        <Route path="strategies"   element={<StrategiesPage />}    />
        <Route path="strategies/:strategyId" element={<StrategyDetailPage />} />
        <Route path="mt5-accounts" element={<MT5AccountsPage />}  />
        <Route path="backtest"     element={<BacktestPage />}      />
        <Route path="models"     element={<ModelsPage />} />
        <Route path="trades"     element={<TradesPage />} />
        <Route path="portfolio"        element={<PortfolioPage />} />
        <Route path="settings"         element={<SettingsPage />} />
        <Route path="users"            element={<UsersPage />} />
        <Route path="role-permissions" element={<RolePermissionsPage />} />
        <Route path="audit-logs"       element={<AuditLogsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
