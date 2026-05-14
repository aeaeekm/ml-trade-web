import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, Server, Clock, Layers, Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Toggle from '../ui/Toggle'
import Button from '../ui/Button'
import { resolveEAStatus, lastSeenText } from '../../api/eaStatus'

function MiniStat({ label, value, className }) {
  return (
    <div className={clsx('flex flex-col gap-0.5 min-w-0', className)}>
      <p className="text-[10px] font-medium text-muted uppercase tracking-wide truncate">{label}</p>
      <p className="text-sm font-semibold text-text truncate">{value ?? '—'}</p>
    </div>
  )
}

function fmt(val, cur = 'USD') {
  if (val == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: cur,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(val)
}

// Color map for EA status
const EA_COLOR = {
  success: 'text-success bg-success/10 border-success/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  danger:  'text-danger  bg-danger/10  border-danger/20',
  neutral: 'text-muted   bg-surface    border-border',
}

export default function MT5AccountCard({ account, onEdit, onDelete, onToggle }) {
  const [toggling, setToggling] = useState(false)

  // Real EA heartbeat data (may be null if EA never connected)
  const ea = account._ea || null

  // Resolve status from heartbeat
  const { label: eaLabel, color: eaColor, warn } = resolveEAStatus(
    ea
      ? { status: ea.status, seconds_since_heartbeat: ea.seconds_since_heartbeat,
          trade_allowed: ea.trade_allowed, algo_trading_allowed: ea.algo_trading_allowed,
          terminal_connected: ea.terminal_connected }
      : { status: 'UNKNOWN' }
  )

  const cur         = ea?.account_currency || account.currency_type || 'USD'
  const balance     = ea?.balance
  const equity      = ea?.equity
  const freeMargin  = ea?.free_margin
  const openPos     = ea?.open_positions_count ?? 0
  const lastSeen    = ea ? lastSeenText(ea.seconds_since_heartbeat) : null
  const eaVersion   = ea?.ea_version ? `v${ea.ea_version}` : null
  const termConnected = ea?.terminal_connected ?? null
  const algoOk      = ea?.algo_trading_allowed ?? null
  const lastError   = ea?.last_error || 0

  const handleToggle = async () => {
    setToggling(true)
    try { await onToggle(account.id, !account.is_active) }
    finally { setToggling(false) }
  }

  const handleDelete = () => {
    if (window.confirm(`Delete account "${account.name}"? This cannot be undone.`)) {
      onDelete(account.id)
    }
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="flex flex-col gap-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-text text-sm truncate">{account.name}</h3>
            <p className="text-xs text-muted mt-0.5 truncate">{account.broker}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
            <Badge variant={account.account_type === 'real' ? 'success' : 'blue'}>
              {account.account_type === 'real' ? 'Real' : 'Demo'}
            </Badge>
            <Badge variant="neutral">{cur}</Badge>
          </div>
        </div>

        {/* ── Login + Server ── */}
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-mono font-semibold text-text">{account.mt5_login ?? '—'}</span>
          <span className="text-border">·</span>
          <span className="truncate">{account.mt5_server ?? '—'}</span>
        </div>

        {/* ── Balance / Equity / Free Margin ── */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-surface">
          <MiniStat label="Balance"     value={fmt(balance, cur)} />
          <MiniStat label="Equity"      value={fmt(equity, cur)} />
          <MiniStat label="Free Margin" value={fmt(freeMargin, cur)} />
        </div>

        {/* ── EA Status Badge ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
            EA_COLOR[eaColor] || EA_COLOR.neutral
          )}>
            <span className={clsx(
              'h-1.5 w-1.5 rounded-full shrink-0',
              eaColor === 'success' && 'bg-success animate-pulse',
              eaColor === 'warning' && 'bg-warning',
              eaColor === 'danger'  && 'bg-danger',
              eaColor === 'neutral' && 'bg-muted',
            )} />
            EA {eaLabel}
          </span>
          {eaVersion && <span className="text-xs text-muted">{eaVersion}</span>}
          {warn && <AlertTriangle size={13} className="text-warning" />}
        </div>

        {/* ── Status Grid ── */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted">

          {/* Terminal connected */}
          <div className="flex items-center gap-1.5">
            {termConnected === null ? (
              <WifiOff size={12} className="shrink-0 text-muted" />
            ) : termConnected ? (
              <Wifi size={12} className="shrink-0 text-success" />
            ) : (
              <WifiOff size={12} className="shrink-0 text-danger" />
            )}
            <span className={termConnected === false ? 'text-danger' : ''}>
              {termConnected === null ? 'No data' : termConnected ? 'Terminal OK' : 'Disconnected'}
            </span>
          </div>

          {/* Open positions */}
          <div className="flex items-center gap-1.5">
            <Layers size={12} className="shrink-0" />
            <span>{openPos} position{openPos !== 1 ? 's' : ''}</span>
          </div>

          {/* Algo trading */}
          <div className="flex items-center gap-1.5">
            <span className={clsx(
              'h-1.5 w-1.5 rounded-full shrink-0',
              algoOk === null ? 'bg-muted' : algoOk ? 'bg-success' : 'bg-danger'
            )} />
            <span className={algoOk === false ? 'text-danger' : ''}>
              {algoOk === null ? 'Algo?' : algoOk ? 'Algo ON' : 'Algo OFF'}
            </span>
          </div>

          {/* Last heartbeat */}
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="shrink-0" />
            <span>{lastSeen ?? 'Never'}</span>
          </div>

          {/* Last error */}
          {lastError !== 0 && (
            <div className="flex items-center gap-1.5 text-danger col-span-2">
              <AlertTriangle size={12} className="shrink-0" />
              <span>Error #{lastError}</span>
            </div>
          )}
        </div>

        {/* ── EA details (bot name / strategy) ── */}
        {(ea?.bot_name || ea?.strategy_id) && (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Server size={12} className="shrink-0" />
            <span className="truncate">
              {ea.bot_name && <span className="font-medium text-text">{ea.bot_name}</span>}
              {ea.bot_name && ea.strategy_id && ' · '}
              {ea.strategy_id && <span>{ea.strategy_id}</span>}
            </span>
          </div>
        )}

        {/* ── Footer: toggle + actions ── */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Toggle
              checked={!!account.is_active}
              onChange={handleToggle}
              disabled={toggling}
            />
            <span className="text-xs text-muted">{account.is_active ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="sm"
              icon={<Edit2 size={13} />}
              onClick={() => onEdit(account)}
              title="Edit account"
            />
            <Button
              variant="ghost" size="sm"
              icon={<Trash2 size={13} />}
              onClick={handleDelete}
              title="Delete account"
              className="text-danger hover:bg-danger/10"
            />
          </div>
        </div>

      </Card>
    </motion.div>
  )
}
