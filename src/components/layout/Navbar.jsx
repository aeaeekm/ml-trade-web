import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Sun, Moon, Bell, ChevronRight } from 'lucide-react'
import useThemeStore from '../../store/themeStore'
import useAuthStore from '../../store/authStore'

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/portfolio':  'Portfolio',
  '/strategies': 'Strategies',
  '/backtest':   'Backtest',
  '/models':     'ML Models',
  '/trades':     'Trades',
  '/settings':   'Settings',
}

export default function Navbar({ onMobileMenuToggle }) {
  const location = useLocation()
  const { isDark, toggle } = useThemeStore()
  const { user } = useAuthStore()
  const [notifOpen, setNotifOpen] = useState(false)

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'ML Trade'

  return (
    <header className="h-16 border-b border-border bg-bg/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted hidden sm:block">ML Trade</span>
          <ChevronRight size={14} className="text-border hidden sm:block" />
          <span className="font-semibold text-text">{pageTitle}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Sun size={18} />
              </motion.span>
            ) : (
              <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Moon size={18} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />
          </button>
          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-bg border border-border rounded-xl shadow-lg z-20"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-text">Notifications</p>
                  </div>
                  <div className="p-4 text-sm text-muted text-center py-8">
                    No new notifications
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
          <span className="text-xs font-semibold text-accent">
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </span>
        </div>
      </div>
    </header>
  )
}
