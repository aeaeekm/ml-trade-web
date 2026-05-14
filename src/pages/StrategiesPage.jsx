import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Zap, AlertCircle, MoreVertical, Edit2, Trash2,
  Users, BarChart2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { strategiesApi } from '../api/strategies'
import { mt5AccountsApi } from '../api/mt5accounts'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Toggle from '../components/ui/Toggle'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Skeleton from '../components/ui/Skeleton'
import AssignmentPanel from '../components/features/AssignmentPanel'
import clsx from 'clsx'

/* ─── Confidence bar ─── */
function ConfidenceBar({ value }) {
  const pct = Math.round((value ?? 0) * 100)
  const color = pct >= 70 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-text w-8 text-right">{pct}%</span>
    </div>
  )
}

/* ─── Mini stat ─── */
function MiniStat({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-medium text-muted uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-text">{value ?? '—'}</p>
    </div>
  )
}

/* ─── Dot menu ─── */
function DotMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
        aria-label="More options"
      >
        <MoreVertical size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full mt-1 w-36 bg-bg border border-border rounded-xl shadow-lg z-20 overflow-hidden"
          >
            <button
              onClick={() => { onEdit(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text hover:bg-surface transition-colors"
            >
              <Edit2 size={13} /> Edit
            </button>
            <button
              onClick={() => { onDelete(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 size={13} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Strategy Card ─── */
function StrategyCard({ strategy, accounts, onToggle, onEdit, onDelete, onNavigate }) {
  const [toggling,    setToggling]    = useState(false)
  const [assignOpen,  setAssignOpen]  = useState(false)
  const [expanded,    setExpanded]    = useState(false)

  const handleToggle = async (e) => {
    e?.stopPropagation()
    setToggling(true)
    try { await onToggle(strategy.id) }
    finally { setToggling(false) }
  }

  const handleDelete = (e) => {
    e?.stopPropagation()
    if (window.confirm(`Delete strategy "${strategy.name}"? This cannot be undone.`)) {
      onDelete(strategy.id)
    }
  }

  const handleCardClick = () => {
    onNavigate(strategy.id)
  }

  // WR stored as 0-1 in BacktestRun; max_drawdown as negative fraction e.g. -0.122
  const wr   = strategy.last_win_rate != null
    ? `${(parseFloat(strategy.last_win_rate) * 100).toFixed(1)}%`
    : 'No data'
  const pf   = strategy.profit_factor != null
    ? parseFloat(strategy.profit_factor).toFixed(2)
    : 'No data'
  const dd   = strategy.max_drawdown != null
    ? `${Math.abs(parseFloat(strategy.max_drawdown) * 100).toFixed(1)}%`
    : 'No data'
  const assignments = strategy.assigned_accounts ?? 0

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        onClick={handleCardClick}
        className="bg-bg border border-border rounded-xl shadow-card overflow-hidden flex flex-col cursor-pointer hover:border-accent/40 transition-colors"
      >
        <div className="p-5 flex flex-col gap-4 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-text text-sm truncate">{strategy.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {strategy.strategy_type && (
                  <Badge variant="blue">{strategy.strategy_type}</Badge>
                )}
                <span className="text-xs font-mono text-muted">{strategy.symbol ?? '—'}</span>
                {strategy.timeframe && (
                  <>
                    <span className="text-border">·</span>
                    <Badge variant="neutral">{strategy.timeframe}</Badge>
                  </>
                )}
              </div>
            </div>
            <div onClick={e => e.stopPropagation()}>
              <DotMenu onEdit={() => onEdit(strategy)} onDelete={handleDelete} />
            </div>
          </div>

          {/* Confidence meter */}
          <div>
            <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5">
              Min Confidence
            </p>
            <ConfidenceBar value={strategy.min_confidence} />
          </div>

          {/* SL/TP multipliers */}
          {(strategy.sl_multiplier != null || strategy.tp_multiplier != null) && (
            <div className="flex items-center gap-3 text-xs">
              {strategy.sl_multiplier != null && (
                <span className="text-muted">
                  SL: <span className="text-text font-medium">{strategy.sl_multiplier}×</span>
                </span>
              )}
              {strategy.tp_multiplier != null && (
                <span className="text-muted">
                  TP: <span className="text-text font-medium">{strategy.tp_multiplier}×</span>
                </span>
              )}
            </div>
          )}

          {/* Backtest stats */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-surface">
            <MiniStat label="WR%"    value={wr} />
            <MiniStat label="PF"     value={pf} />
            <MiniStat label="Max DD" value={dd} />
          </div>

          {/* Assigned accounts badge */}
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-muted" />
            <span className="text-xs text-muted">
              <span className="font-medium text-text">{assignments}</span>{' '}
              {assignments === 1 ? 'account' : 'accounts'} assigned
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t border-border flex items-center gap-2"
          onClick={e => e.stopPropagation()}
        >
          <Toggle
            checked={!!strategy.is_active}
            onChange={handleToggle}
            disabled={toggling}
            label={`Toggle ${strategy.name}`}
          />
          <span className="text-xs text-muted flex-1">
            {strategy.is_active ? 'Active' : 'Inactive'}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={<Users size={13} />}
            onClick={() => setAssignOpen(true)}
          >
            Assign Accounts
          </Button>
        </div>
      </motion.div>

      {/* Assignment panel */}
      <AssignmentPanel
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        strategy={strategy}
        accounts={accounts}
      />
    </>
  )
}

/* ─── Strategy Form Modal (create/edit) ─── */
const EMPTY_FORM = {
  name: '', symbol: '', timeframe: 'H1', strategy_type: '',
  min_confidence: 0.65, sl_multiplier: 1.5, tp_multiplier: 2.0,
  description: '', risk_percent: 1, max_trades: 3,
}

function StrategyFormModal({ open, onClose, strategy, onSaved }) {
  const isEdit = !!strategy
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (open) {
      setForm(strategy ? {
        name:           strategy.name           ?? '',
        symbol:         strategy.symbol         ?? '',
        timeframe:      strategy.timeframe       ?? 'H1',
        strategy_type:  strategy.strategy_type  ?? '',
        min_confidence: strategy.min_confidence ?? 0.65,
        sl_multiplier:  strategy.sl_multiplier  ?? 1.5,
        tp_multiplier:  strategy.tp_multiplier  ?? 2.0,
        description:    strategy.description    ?? '',
        risk_percent:   strategy.risk_percent   ?? 1,
        max_trades:     strategy.max_trades     ?? 3,
      } : EMPTY_FORM)
      setError('')
    }
  }, [open, strategy])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!form.name.trim() || !form.symbol.trim()) {
      setError('Name and symbol are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (isEdit) {
        await strategiesApi.update(strategy.id, form)
      } else {
        await strategiesApi.create(form)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save strategy.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${strategy?.name}` : 'New Strategy'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary"   onClick={handleSubmit} loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Strategy'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Strategy Name"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="My Strategy"
            className="col-span-2"
          />
          <Input
            label="Symbol"
            value={form.symbol}
            onChange={e => set('symbol', e.target.value.toUpperCase())}
            placeholder="EURUSD"
          />
          <Select
            label="Timeframe"
            value={form.timeframe}
            onChange={e => set('timeframe', e.target.value)}
            options={['M1','M5','M15','M30','H1','H4','D1'].map(v => ({ value: v, label: v }))}
          />
          <Input
            label="Strategy Type"
            value={form.strategy_type}
            onChange={e => set('strategy_type', e.target.value)}
            placeholder="Trend / Mean-Revert"
          />
          <Input
            label="Min Confidence (0–1)"
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={form.min_confidence}
            onChange={e => set('min_confidence', parseFloat(e.target.value))}
          />
          <Input
            label="SL Multiplier"
            type="number"
            min={0.1}
            step={0.1}
            value={form.sl_multiplier}
            onChange={e => set('sl_multiplier', parseFloat(e.target.value))}
          />
          <Input
            label="TP Multiplier"
            type="number"
            min={0.1}
            step={0.1}
            value={form.tp_multiplier}
            onChange={e => set('tp_multiplier', parseFloat(e.target.value))}
          />
          <Input
            label="Risk per Trade (%)"
            type="number"
            min={0.1}
            max={10}
            step={0.1}
            value={form.risk_percent}
            onChange={e => set('risk_percent', parseFloat(e.target.value))}
          />
          <Input
            label="Max Open Trades"
            type="number"
            min={1}
            max={50}
            value={form.max_trades}
            onChange={e => set('max_trades', parseInt(e.target.value))}
          />
        </div>
        <Input
          label="Description"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Briefly describe this strategy..."
        />
      </form>
    </Modal>
  )
}

/* ─── Page ─── */
export default function StrategiesPage() {
  const navigate = useNavigate()
  const [strategies, setStrategies] = useState([])
  const [accounts,   setAccounts]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [strats, accs] = await Promise.allSettled([
        strategiesApi.list(),
        mt5AccountsApi.list(),
      ])
      if (strats.status === 'fulfilled') {
        const data = strats.value
        setStrategies(Array.isArray(data) ? data : [])
      } else {
        setError('Failed to load strategies. Please retry.')
        setStrategies([])
      }
      if (accs.status === 'fulfilled') setAccounts(Array.isArray(accs.value) ? accs.value : [])
    } catch (e) {
      console.error('StrategiesPage fetchAll error:', e)
      setError('Unexpected error loading strategies.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleToggle = async (id) => {
    try {
      await strategiesApi.toggle(id)
      setStrategies(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s))
    } catch {
      alert('Failed to toggle strategy.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await strategiesApi.delete(id)
      setStrategies(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Failed to delete strategy.')
    }
  }

  const openCreate   = ()  => { setEditTarget(null); setModalOpen(true) }
  const openEdit     = (s) => { setEditTarget(s);  setModalOpen(true) }
  const closeModal   = ()  => { setModalOpen(false); setEditTarget(null) }
  const handleNavigate = (id) => navigate(`/strategies/${id}`)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Strategies</h1>
          <p className="text-sm text-muted mt-0.5">Manage ML-powered trading strategies and account assignments</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={openCreate}>
          New Strategy
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchAll}>Retry</Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-bg border border-border rounded-xl p-5 space-y-4">
              <Skeleton height={16} className="w-2/3" />
              <Skeleton height={12} className="w-1/3" />
              <Skeleton height={6}  className="w-full rounded-full" />
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-surface">
                <Skeleton height={34} />
                <Skeleton height={34} />
                <Skeleton height={34} />
              </div>
              <Skeleton height={12} className="w-1/4" />
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <Skeleton height={20} className="w-20" />
                <Skeleton height={30} className="w-32 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && strategies.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <Zap size={28} className="text-accent" />
          </div>
          <h3 className="text-base font-semibold text-text">No strategies yet</h3>
          <p className="text-sm text-muted mt-2 max-w-xs">
            Create your first ML-powered strategy to start generating signals.
          </p>
          <Button variant="primary" className="mt-6" icon={<Plus size={15} />} onClick={openCreate}>
            Create Strategy
          </Button>
        </div>
      )}

      {/* Strategy cards */}
      {!loading && strategies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {strategies.map(s => (
              <StrategyCard
                key={s.id}
                strategy={s}
                accounts={accounts}
                onToggle={handleToggle}
                onEdit={openEdit}
                onDelete={handleDelete}
                onNavigate={handleNavigate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit modal */}
      <StrategyFormModal
        open={modalOpen}
        onClose={closeModal}
        strategy={editTarget}
        onSaved={fetchAll}
      />
    </div>
  )
}
