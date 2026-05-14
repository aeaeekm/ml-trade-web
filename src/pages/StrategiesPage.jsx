import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Zap, ChevronDown, ChevronUp, MoreVertical, AlertCircle } from 'lucide-react'
import { strategiesApi } from '../api/strategies'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Toggle from '../components/ui/Toggle'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Skeleton from '../components/ui/Skeleton'

function StrategyCard({ strategy, onToggle, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onToggle(strategy.id)
    } finally {
      setToggling(false)
    }
  }

  return (
    <motion.div
      layout
      className="bg-bg border border-border rounded-xl shadow-card overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-text text-sm">{strategy.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-muted">{strategy.symbol}</span>
              <span className="text-border">·</span>
              <span className="text-xs text-muted">{strategy.timeframe}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={strategy.is_active ? 'success' : 'neutral'}>
              {strategy.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-surface">
            <p className="text-[10px] text-muted uppercase tracking-wide">Min Confidence</p>
            <p className="text-sm font-semibold text-text mt-0.5">
              {strategy.min_confidence != null ? `${(strategy.min_confidence * 100).toFixed(0)}%` : '—'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface">
            <p className="text-[10px] text-muted uppercase tracking-wide">Last WR</p>
            <p className="text-sm font-semibold text-text mt-0.5">
              {strategy.last_win_rate != null ? `${(strategy.last_win_rate * 100).toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Toggle
            checked={!!strategy.is_active}
            onChange={handleToggle}
            disabled={toggling}
            label={`Toggle ${strategy.name}`}
          />
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted hover:text-text transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Less' : 'Details'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-border">
              <div className="pt-4 space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Configuration</p>
                {strategy.conditions ? (
                  <pre className="text-xs text-muted bg-surface rounded-lg p-3 overflow-x-auto">
                    {typeof strategy.conditions === 'string'
                      ? strategy.conditions
                      : JSON.stringify(strategy.conditions, null, 2)}
                  </pre>
                ) : (
                  <div className="space-y-2">
                    {strategy.description && <p className="text-xs text-muted">{strategy.description}</p>}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {strategy.risk_percent != null && (
                        <div>
                          <span className="text-muted">Risk per trade: </span>
                          <span className="text-text font-medium">{strategy.risk_percent}%</span>
                        </div>
                      )}
                      {strategy.max_trades != null && (
                        <div>
                          <span className="text-muted">Max trades: </span>
                          <span className="text-text font-medium">{strategy.max_trades}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function NewStrategyModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', symbol: '', timeframe: 'H1', min_confidence: 0.65,
    description: '', risk_percent: 1, max_trades: 3,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await strategiesApi.create(form)
      onCreated()
      onClose()
      setForm({ name: '', symbol: '', timeframe: 'H1', min_confidence: 0.65, description: '', risk_percent: 1, max_trades: 3 })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create strategy.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Strategy" size="lg"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>Create Strategy</Button>
      </>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Strategy Name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="My Strategy" required className="col-span-2" />
          <Input label="Symbol" value={form.symbol} onChange={e => set('symbol', e.target.value.toUpperCase())} placeholder="EURUSD" required />
          <Select label="Timeframe" value={form.timeframe} onChange={e => set('timeframe', e.target.value)}
            options={['M1','M5','M15','M30','H1','H4','D1'].map(v => ({ value: v, label: v }))} />
          <Input label="Min Confidence" type="number" min={0} max={1} step={0.01}
            value={form.min_confidence} onChange={e => set('min_confidence', parseFloat(e.target.value))} />
          <Input label="Risk per Trade (%)" type="number" min={0.1} max={10} step={0.1}
            value={form.risk_percent} onChange={e => set('risk_percent', parseFloat(e.target.value))} />
          <Input label="Max Open Trades" type="number" min={1} max={50}
            value={form.max_trades} onChange={e => set('max_trades', parseInt(e.target.value))} className="col-span-2" />
        </div>
        <Input label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Briefly describe this strategy..." />
      </form>
    </Modal>
  )
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showNew, setShowNew]       = useState(false)

  const fetchStrategies = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await strategiesApi.list()
      setStrategies(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load strategies.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStrategies() }, [])

  const handleToggle = async (id) => {
    await strategiesApi.toggle(id)
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Strategies</h1>
          <p className="text-sm text-muted mt-1">Manage your ML-powered trading strategies</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setShowNew(true)}>
          New Strategy
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-bg border border-border rounded-xl p-5 space-y-3">
              <Skeleton height={18} className="w-2/3" />
              <Skeleton height={12} className="w-1/3" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton height={52} className="rounded-lg" />
                <Skeleton height={52} className="rounded-lg" />
              </div>
              <Skeleton height={20} className="w-1/4" />
            </div>
          ))}
        </div>
      ) : strategies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <Zap size={28} className="text-accent" />
          </div>
          <h3 className="text-base font-semibold text-text">No strategies yet</h3>
          <p className="text-sm text-muted mt-2 max-w-xs">
            Create your first ML-powered strategy to start generating signals.
          </p>
          <Button variant="primary" className="mt-6" icon={<Plus size={15} />} onClick={() => setShowNew(true)}>
            Create Strategy
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {strategies.map(s => (
            <StrategyCard key={s.id} strategy={s} onToggle={handleToggle} onRefresh={fetchStrategies} />
          ))}
        </div>
      )}

      <NewStrategyModal open={showNew} onClose={() => setShowNew(false)} onCreated={fetchStrategies} />
    </div>
  )
}
