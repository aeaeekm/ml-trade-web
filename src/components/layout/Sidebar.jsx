import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import {
  LayoutDashboard, Zap, FlaskConical, Brain, ArrowLeftRight,
  PieChart, Settings, ChevronLeft, ChevronRight, LogOut, Cpu, Menu, X, Monitor,
  Users, Shield, FileText,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import Badge from '../ui/Badge'

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/portfolio',  icon: PieChart,        label: 'Portfolio' },
    ],
  },
  {
    label: 'Trading',
    items: [
      { to: '/strategies',   icon: Zap,            label: 'Strategies'   },
      { to: '/mt5-accounts', icon: Monitor,         label: 'MT5 Accounts' },
      { to: '/backtest',     icon: FlaskConical,   label: 'Backtest'     },
      { to: '/models',       icon: Brain,          label: 'ML Models'    },
      { to: '/trades',       icon: ArrowLeftRight, label: 'Trades'       },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/users',            icon: Users,    label: 'User Management', permission: 'users.view'       },
      { to: '/role-permissions', icon: Shield,   label: 'Role Permissions', permission: 'roles.view'      },
      { to: '/audit-logs',       icon: FileText, label: 'Audit Logs',       permission: 'audit_logs.view' },
      { to: '/settings',         icon: Settings, label: 'Settings' },
    ],
  },
]

function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 group relative',
          isActive
            ? 'bg-accent/10 text-accent'
            : 'text-muted hover:bg-surface hover:text-text'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="activeNav"
              className="absolute inset-0 rounded-lg bg-accent/10"
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
          )}
          <Icon size={17} className="relative z-10 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 overflow-hidden whitespace-nowrap"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          {collapsed && (
            <div className="absolute left-full ml-3 px-2 py-1 rounded-md bg-text text-bg text-xs whitespace-nowrap
                            opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout, hasPermission } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <div className={clsx(
      'flex flex-col h-full bg-bg border-r border-border transition-all duration-300',
      collapsed ? 'w-[60px]' : 'w-60'
    )}>
      {/* Logo */}
      <div className={clsx('flex items-center h-16 border-b border-border px-4 shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Cpu size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-sm font-bold text-text tracking-tight">ML Trade</p>
              <p className="text-[10px] text-muted">AI Trading Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-semibold text-muted uppercase tracking-widest px-3 mb-2"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {group.items
                .filter((item) => !item.permission || hasPermission(item.permission))
                .map((item) => (
                  <NavItem key={item.to} {...item} collapsed={collapsed} />
                ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className={clsx('shrink-0 border-t border-border px-3 py-4', collapsed ? 'flex justify-center' : '')}>
        {collapsed ? (
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-accent">
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text truncate">{user?.email ?? 'User'}</p>
              <Badge variant={user?.plan === 'pro' ? 'blue' : 'neutral'} className="text-[10px] mt-0.5">
                {user?.plan ?? 'free'}
              </Badge>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-bg border border-border
                   flex items-center justify-center shadow-sm text-muted hover:text-text
                   hover:bg-surface transition-colors z-10"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block relative shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden w-60"
            >
              <div className="relative h-full">
                {sidebarContent}
                <button
                  onClick={onMobileClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-text"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
