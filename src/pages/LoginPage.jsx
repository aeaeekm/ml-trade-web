import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cpu, AlertCircle, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const { login } = useAuthStore()
  const { isDark, toggle } = useThemeStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid credentials. Please try again.'
      setError(Array.isArray(msg) ? msg.map(m => m.msg).join(', ') : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left panel (decorative - desktop only) */}
      <div className="hidden lg:flex flex-col flex-1 bg-accent/5 border-r border-border p-12 justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center">
            <Cpu size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-text text-base tracking-tight">ML Trade</p>
            <p className="text-xs text-muted">AI Trading Platform</p>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-text leading-tight">
            Trade smarter<br />with machine learning
          </h1>
          <p className="text-muted text-lg leading-relaxed max-w-sm">
            Advanced ML-powered strategies, real-time signals, and institutional-grade backtesting. All in one platform.
          </p>
          <div className="flex gap-8 pt-2">
            {[['98.7%', 'Uptime SLA'], ['< 15ms', 'Signal Latency'], ['Multi-broker', 'MT5 Integration']].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-xl font-bold text-text">{val}</p>
                <p className="text-xs text-muted mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted">
          © 2026 ML Trade. Powered by advanced ML models.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-col flex-1 items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center">
            <Cpu size={18} className="text-white" />
          </div>
          <p className="font-bold text-text text-lg">ML Trade</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-bg border border-border rounded-2xl p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-text">Welcome back</h2>
              <p className="text-sm text-muted mt-1">Sign in to your trading account</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-3.5 mb-4 rounded-lg bg-danger/10 border border-danger/20"
              >
                <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
                <p className="text-sm text-danger">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="pointer-events-auto text-muted hover:text-text transition-colors"
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent/30"
                  />
                  <span className="text-sm text-muted">Remember me</span>
                </label>
                <button type="button" className="text-sm text-accent hover:text-accent-hover transition-colors">
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                Sign in
              </Button>
            </form>

            <p className="text-center text-sm text-muted mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent hover:text-accent-hover font-medium transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="mt-6 text-xs text-muted hover:text-text transition-colors"
        >
          Switch to {isDark ? 'light' : 'dark'} mode
        </button>
      </div>
    </div>
  )
}
