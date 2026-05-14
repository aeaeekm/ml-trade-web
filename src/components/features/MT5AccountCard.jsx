import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, Server, Clock, Layers } from 'lucide-react'
import clsx from 'clsx'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Toggle from '../ui/Toggle'
import Button from '../ui/Button'
import StatusDot from '../ui/StatusDot'

function MiniStat({ label, value, className }) {
  return (
    <div className={clsx('flex flex-col gap-0.5 min-w-0', className)}>
      <p className="text-[10px] font-medium text-muted uppercase tracking-wide truncate">{label}</p>
      <p className="text-sm font-semibold text-text truncate">{value ?? '—'}</p>
    </div>
  )
}

function formatCurrency(val, currency = 'USD') {
  if (val == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(val)
}

function formatHeartbeat(ts) {
  if (!ts) return null
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function MT5AccountCard({ account, onEdit, onDelete, onToggle }) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try { await onToggle(account.id, !account.enabled) }
    finally { setToggling(false) }
  }

  const handleDelete = () => {
    if (window.confirm(`Delete account "${account.name}"? This cannot be undone.`)) {
      onDelete(account.id)
    }
  }

  const eaRunning       = account.ea_status === 'running'
  const signalConnected = account.signal_server_connected === true
  const heartbeat       = formatHeartbeat(account.last_heartbeat)
  const cur             = account.currency ?? 'USD'

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-text text-sm truncate">{account.name}</h3>
            <p className="text-xs text-muted mt-0.5 truncate">{account.broker_name}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
            <Badge variant={account.account_type === 'real' ? 'success' : 'blue'}>
              {account.account_type === 'real' ? 'Real' : 'Demo'}
            </Badge>
            <Badge variant="neutral">{cur}</Badge>
          </div>
        </div>

        {/* Account number + server */}
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="font-mono font-medium text-text">{account.login_number ?? '—'}</span>
          <span className="text-border">·</span>
          <span className="truncate">{account.server_name ?? '—'}</span>
        </div>

        {/* Balance / Equity / Margin */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-surface">
          <MiniStat label="Balance"     value={formatCurrency(account.balance, cur)} />
          <MiniStat label="Equity"      value={formatCurrency(account.equity, cur)} />
          <MiniStat label="Free Margin" value={formatCurrency(account.free_margin, cur)} />
        </div>

        {/* Status row */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
          {/* EA status */}
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'h-1.5 w-1.5 rounded-full shrink-0',
                eaRunning ? 'bg-success' : 'bg-danger'
              )}
            />
            <span className={clsx('font-medium', eaRunning ? 'text-success' : 'text-danger')}>
              EA {eaRunning ? 'Running' : 'Stopped'}
            </span>
          </div>

          {/* Open positions */}
          <div className="flex items-center gap-1.5 text-muted">
            <Layers size={12} className="shrink-0" />
            <span>{account.open_positions ?? 0} positions</span>
          </div>

          {/* Signal server */}
          <div className="flex items-center gap-2">
            <StatusDot
              status={signalConnected ? 'online' : 'offline'}
              label={signalConnected ? 'Connected' : 'Disconnected'}
              size="xs"
            />
          </div>

          {/* Heartbeat */}
          <div className="flex items-center gap-1.5 text-muted">
            <Clock size={12} className="shrink-0" />
            <span>{heartbeat ?? 'No data'}</span>
          </div>
        </div>

        {/* Assigned strategies */}
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Server size={12} className="shrink-0" />
          <span>
            <span className="font-medium text-text">{account.assigned_strategies ?? 0}</span>{' '}
            {account.assigned_strategies === 1 ? 'strategy' : 'strategies'} assigned
          </span>
        </div>

        {/* Footer: toggle + actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-2">
            <Toggle
              checked={!!account.enabled}
              onChange={handleToggle}
              disabled={toggling}
              label={`${account.enabled ? 'Disable' : 'Enable'} ${account.name}`}
            />
            <span className="text-xs text-muted">{account.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit2 size={13} />}
              onClick={() => onEdit(account)}
              title="Edit account"
            />
            <Button
              variant="ghost"
              size="sm"
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
