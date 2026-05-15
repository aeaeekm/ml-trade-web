import { useEffect, useState, useCallback, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import {
  ArrowUpRight, ArrowDownRight, RefreshCw, Download,
  Search, X, Radio, ChevronDown, Filter,
} from 'lucide-react'
import clsx from 'clsx'
import { signalsApi } from '../api/signals'
import { strategiesApi } from '../api/strategies'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import { Table, Thead, Tbody, Th, Tr, Td, TableSkeleton } from '../components/ui/Table'
import { useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '',          label: 'All Statuses' },
  { value: 'active',   label: 'Active' },
  { value: 'executed', label: 'Executed' },
  { value: 'expired',  label: 'Expired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled',label: 'Cancelled' },
]

const DIRECTION_OPTIONS = [
  { value: '',     label: 'All Directions' },
  { value: 'BUY',  label: 'BUY' },
  { value: 'SELL', label: 'SELL' },
]

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDt(ts) {
  if (!ts) return '—'
  try {
    const d = typeof ts === 'string' ? parseISO(ts) : new Date(ts)
    return format(d, 'MMM d, HH:mm')
  } catch {
    return ts
  }
}

function formatDtFull(ts) {
  if (!ts) return '—'
  try {
    const d = typeof ts === 'string' ? parseISO(ts) : new Date(ts)
    return format(d, 'yyyy-MM-dd HH:mm')
  } catch {
    return ts
  }
}

function statusBadgeVariant(status) {
  switch (status) {
    case 'active':    return 'blue'
    case 'executed':  return 'success'
    case 'expired':   return 'neutral'
    case 'rejected':  return 'danger'
    case 'cancelled': return 'neutral'
    default:          return 'neutral'
  }
}

function StatusBadge({ status }) {
  const variant = statusBadgeVariant(status)
  const isActive = status === 'active'
  return (
    <Badge variant={variant} className="capitalize gap-1.5">
      {isActive && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
        </span>
      )}
      {status ?? '—'}
    </Badge>
  )
}

function DirectionCell({ direction }) {
  const isBuy = direction === 'BUY'
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 text-xs font-semibold',
      isBuy ? 'text-success' : 'text-danger',
    )}>
      {isBuy ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {direction ?? '—'}
    </span>
  )
}

function ConfidenceCell({ value }) {
  if (value == null) return <span className="text-muted text-xs">—</span>
  const pct = (value * 100).toFixed(1)
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="h-1.5 w-16 bg-border rounded-full overflow-hidden shrink-0">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted whitespace-nowrap">{pct}%</span>
    </div>
  )
}

function RrCell({ value }) {
  if (value == null) return <span className="text-muted text-xs">—</span>
  const isGood = value >= 1.0
  return (
    <span className={clsx('text-xs font-semibold tabular-nums', isGood ? 'text-success' : 'text-danger')}>
      {value.toFixed(1)}x
    </span>
  )
}

// ─────────────────────────────────────────────
// Summary Cards
// ─────────────────────────────────────────────

function SummaryCards({ summary, loading }) {
  if (!summary && !loading) return null

  const cards = [
    { label: 'Total',    value: summary?.total,    variant: 'default' },
    { label: 'Active',   value: summary?.active,   variant: 'blue'    },
    { label: 'Executed', value: summary?.executed, variant: 'success' },
    { label: 'Expired',  value: summary?.expired,  variant: 'neutral' },
  ]

  const variantColors = {
    default: 'bg-accent/10 text-accent',
    blue:    'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    neutral: 'bg-surface text-muted border border-border',
    danger:  'bg-danger/10 text-danger',
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(card => (
        <div
          key={card.label}
          className="bg-bg border border-border rounded-xl p-4 shadow-card"
        >
          <p className="text-[11px] font-medium text-muted uppercase tracking-wide">{card.label}</p>
          {loading ? (
            <div className="h-7 w-16 bg-border rounded animate-pulse mt-1" />
          ) : (
            <p className={clsx(
              'text-2xl font-bold mt-1',
              card.variant === 'blue'    ? 'text-accent'  :
              card.variant === 'success' ? 'text-success' :
              card.variant === 'danger'  ? 'text-danger'  : 'text-text',
            )}>
              {card.value ?? 0}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Signal Detail Drawer
// ─────────────────────────────────────────────

function SignalDrawer({ signal, onClose }) {
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [jsonOpen, setJsonOpen] = useState(false)

  useEffect(() => {
    if (!signal) return
    setDetail(null)
    setDetailLoading(true)
    signalsApi.detail(signal.id)
      .then(d => setDetail(d))
      .catch(() => setDetail(signal))
      .finally(() => setDetailLoading(false))
  }, [signal?.id])

  if (!signal) return null

  const sig = detail ?? signal

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={clsx(
          'fixed inset-y-0 right-0 z-50 flex flex-col',
          'w-full sm:w-[420px] bg-bg border-l border-border shadow-2xl',
          'translate-x-0 transition-transform duration-300',
        )}
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-bold text-text whitespace-nowrap">
              Signal #{sig.id}
            </h2>
            <span className={clsx(
              'inline-flex items-center gap-1 text-xs font-semibold',
              sig.direction === 'BUY' ? 'text-success' : 'text-danger',
            )}>
              {sig.direction === 'BUY'
                ? <ArrowUpRight size={13} />
                : <ArrowDownRight size={13} />}
              {sig.direction} {sig.symbol}
            </span>
            <StatusBadge status={sig.status} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors shrink-0 ml-2"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {detailLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-surface rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Price & Risk */}
              <section>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                  Price & Risk
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Entry',   value: sig.entry_price?.toFixed(2) ?? '—' },
                    { label: 'SL',      value: sig.sl_price?.toFixed(2)    ?? '—' },
                    { label: 'TP',      value: sig.tp_price?.toFixed(2)    ?? '—' },
                  ].map(item => (
                    <div key={item.label} className="bg-surface rounded-lg p-3">
                      <p className="text-[10px] text-muted uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-bold text-text mt-0.5 tabular-nums">{item.value}</p>
                    </div>
                  ))}
                  {[
                    { label: 'Risk',   value: sig.risk_distance != null   ? `${sig.risk_distance.toFixed(2)} pts`   : '—' },
                    { label: 'Reward', value: sig.reward_distance != null ? `${sig.reward_distance.toFixed(2)} pts` : '—' },
                    { label: 'RR',     value: sig.rr_ratio != null        ? `${sig.rr_ratio.toFixed(2)}×`           : '—' },
                  ].map(item => (
                    <div key={item.label} className="bg-surface rounded-lg p-3">
                      <p className="text-[10px] text-muted uppercase tracking-wide">{item.label}</p>
                      <p className={clsx(
                        'text-sm font-bold mt-0.5 tabular-nums',
                        item.label === 'RR'
                          ? (sig.rr_ratio >= 1.0 ? 'text-success' : 'text-danger')
                          : 'text-text',
                      )}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                {sig.confidence != null && (
                  <div className="mt-3 bg-surface rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] text-muted uppercase tracking-wide">Confidence</p>
                      <span className="text-sm font-bold text-accent">
                        {(sig.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${sig.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Strategy */}
              <section>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                  Strategy
                </h3>
                <div className="bg-surface rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted uppercase tracking-wide">Strategy</p>
                    <p className="text-xs font-medium text-text">
                      {sig.display_name ?? sig.strategy_name ?? '—'}
                      {sig.strategy_code && (
                        <span className="text-muted ml-1">({sig.strategy_code})</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted uppercase tracking-wide">Symbol</p>
                    <p className="text-xs font-medium text-text">
                      {sig.symbol ?? '—'}
                      {sig.timeframe && (
                        <span className="text-muted"> · {sig.timeframe}</span>
                      )}
                    </p>
                  </div>
                  {sig.blocked_reason && (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] text-muted uppercase tracking-wide shrink-0">Blocked</p>
                      <p className="text-xs text-danger text-right">{sig.blocked_reason}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Timeline */}
              <section>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                  Timeline
                </h3>
                <div className="bg-surface rounded-lg p-3 space-y-2">
                  {[
                    { label: 'Created', value: formatDtFull(sig.created_at) },
                    { label: 'Expires', value: formatDtFull(sig.expires_at) },
                    { label: 'Status',  value: sig.status },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <p className="text-[10px] text-muted uppercase tracking-wide">{item.label}</p>
                      <p className="text-xs font-medium text-text capitalize">{item.value ?? '—'}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Raw JSON */}
              {(sig.conditions_json || sig.risk_settings_json) && (
                <section>
                  <button
                    type="button"
                    onClick={() => setJsonOpen(o => !o)}
                    className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider hover:text-text transition-colors w-full text-left"
                  >
                    <ChevronDown
                      size={13}
                      className={clsx('transition-transform duration-200', jsonOpen && 'rotate-180')}
                    />
                    Raw JSON
                  </button>
                  {jsonOpen && (
                    <div className="mt-3 space-y-3">
                      {sig.conditions_json && (
                        <div>
                          <p className="text-[10px] text-muted mb-1">conditions_json</p>
                          <pre className="bg-surface rounded-lg p-3 text-[10px] text-text overflow-x-auto leading-relaxed">
                            {JSON.stringify(sig.conditions_json, null, 2)}
                          </pre>
                        </div>
                      )}
                      {sig.risk_settings_json && (
                        <div>
                          <p className="text-[10px] text-muted mb-1">risk_settings_json</p>
                          <pre className="bg-surface rounded-lg p-3 text-[10px] text-text overflow-x-auto leading-relaxed">
                            {JSON.stringify(sig.risk_settings_json, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

// ─────────────────────────────────────────────
// Filter Bar
// ─────────────────────────────────────────────

const inputCls = `
  bg-bg border border-border rounded-lg text-sm text-text px-3 py-2
  placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30
  focus:border-accent transition-colors h-9 w-full
`.trim()

const selectCls = `
  bg-bg border border-border rounded-lg text-sm text-text px-3 py-2
  focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
  transition-colors h-9 w-full appearance-none cursor-pointer
`.trim()

function FilterBar({ filters, onChange, strategies, activeCount, onClear }) {
  return (
    <div className="space-y-2">
      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID…"
            value={filters.search}
            onChange={e => onChange('search', e.target.value)}
            className={clsx(inputCls, 'pl-9')}
          />
        </div>

        {/* Strategy */}
        <div className="relative">
          <select
            value={filters.strategy_ids}
            onChange={e => onChange('strategy_ids', e.target.value)}
            className={selectCls}
          >
            <option value="">All Strategies</option>
            {strategies.map(s => (
              <option key={s.id} value={String(s.id)}>
                {s.display_name ?? s.name}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={filters.statuses}
            onChange={e => onChange('statuses', e.target.value)}
            className={selectCls}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>

        {/* Direction */}
        <div className="relative">
          <select
            value={filters.direction}
            onChange={e => onChange('direction', e.target.value)}
            className={selectCls}
          >
            {DIRECTION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Start date */}
        <input
          type="date"
          value={filters.start_date}
          onChange={e => onChange('start_date', e.target.value)}
          className={inputCls}
          placeholder="Start date"
        />

        {/* End date */}
        <input
          type="date"
          value={filters.end_date}
          onChange={e => onChange('end_date', e.target.value)}
          className={inputCls}
          placeholder="End date"
        />

        {/* Symbol */}
        <input
          type="text"
          placeholder="Symbol (e.g. XAUUSD)"
          value={filters.symbol}
          onChange={e => onChange('symbol', e.target.value.toUpperCase())}
          className={inputCls}
        />

        {/* Clear */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onClear}
          icon={<X size={13} />}
          className="h-9 text-sm"
          disabled={activeCount === 0}
        >
          Clear Filters
          {activeCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────

function EmptyState({ hasFilters, onClear, onRefresh }) {
  const navigate = useNavigate()
  return (
    <tr>
      <td colSpan={12} className="px-4 py-16 text-center">
        <div className="max-w-sm mx-auto space-y-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto">
            <Radio size={22} className="text-accent" />
          </div>
          <h3 className="text-base font-semibold text-text">No signals found</h3>
          <div className="text-sm text-muted text-left bg-surface border border-border rounded-xl p-4 space-y-1">
            <p className="font-medium text-text mb-2">Possible reasons:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>No signal has been generated yet</li>
              {hasFilters && <li>Filters are hiding all results — try clearing filters</li>}
              <li>Signal generator may be offline (check live_runner.py)</li>
              <li>All strategies are disabled</li>
              <li>All signals have expired (normal — signals expire after 15 min)</li>
            </ul>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hasFilters && (
              <Button variant="secondary" size="sm" onClick={onClear} icon={<X size={13} />}>
                Clear Filters
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => navigate('/strategies')}>
              Go to Strategies
            </Button>
            <Button variant="primary" size="sm" onClick={onRefresh} icon={<RefreshCw size={13} />}>
              Refresh
            </Button>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────
// CSV Export
// ─────────────────────────────────────────────

async function exportCsv(filters) {
  const result = await signalsApi.list({ ...filters, page: 1, page_size: 1000, sort_by: 'created_at', sort_order: 'desc' })
  const rows = result.data ?? []
  const headers = ['ID', 'Created', 'Strategy', 'Symbol', 'Timeframe', 'Direction', 'Entry', 'SL', 'TP', 'RR', 'Confidence', 'Status', 'Expires']
  const data = rows.map(s => [
    s.id,
    s.created_at ? format(parseISO(s.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
    s.display_name ?? s.strategy_name ?? '',
    s.symbol ?? '',
    s.timeframe ?? '',
    s.direction ?? '',
    s.entry_price ?? '',
    s.sl_price ?? '',
    s.tp_price ?? '',
    s.rr_ratio ?? '',
    s.confidence != null ? (s.confidence * 100).toFixed(1) + '%' : '',
    s.status ?? '',
    s.expires_at ? format(parseISO(s.expires_at), 'yyyy-MM-dd HH:mm:ss') : '',
  ])
  const csv = [headers, ...data]
    .map(row => row.map(v => `"${v ?? ''}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `signals_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

const DEFAULT_FILTERS = {
  search:      '',
  strategy_ids:'',
  statuses:    '',
  direction:   '',
  start_date:  '',
  end_date:    '',
  symbol:      '',
}

export default function SignalsPage() {
  const [signals,     setSignals]     = useState([])
  const [summary,     setSummary]     = useState(null)
  const [pagination,  setPagination]  = useState({ page: 1, page_size: 25, total: 0, total_pages: 0 })
  const [loading,     setLoading]     = useState(true)
  const [exporting,   setExporting]   = useState(false)
  const [strategies,  setStrategies]  = useState([])
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS)
  const [page,        setPage]        = useState(1)
  const [pageSize,    setPageSize]    = useState(25)
  const [sortBy,      setSortBy]      = useState('created_at')
  const [sortOrder,   setSortOrder]   = useState('desc')
  const [selectedSig, setSelectedSig] = useState(null)

  // Fetch strategies for filter dropdown once
  useEffect(() => {
    strategiesApi.list()
      .then(data => setStrategies(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Build API params from state
  const buildParams = useCallback(() => {
    const params = {
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
    }
    if (filters.search)       params.search       = filters.search
    if (filters.strategy_ids) params.strategy_ids = filters.strategy_ids
    if (filters.statuses)     params.statuses     = filters.statuses
    if (filters.direction)    params.direction    = filters.direction
    if (filters.start_date)   params.start_date   = filters.start_date
    if (filters.end_date)     params.end_date     = filters.end_date
    if (filters.symbol)       params.symbol       = filters.symbol
    return params
  }, [page, pageSize, sortBy, sortOrder, filters])

  const fetchSignals = useCallback(async () => {
    setLoading(true)
    const params = buildParams()

    if (import.meta.env.DEV) {
      console.log('[SignalsPage] Fetching:', params)
    }

    const result = await signalsApi.list(params)

    if (import.meta.env.DEV) {
      console.log('[SignalsPage] Got', result.pagination?.total, 'total signals')
      console.log('[SignalsPage] Summary:', result.summary)
    }

    setSignals(result.data ?? [])
    setPagination(result.pagination ?? { page: 1, page_size: 25, total: 0, total_pages: 0 })
    setSummary(result.summary ?? null)
    setLoading(false)
  }, [buildParams])

  useEffect(() => {
    fetchSignals()
  }, [fetchSignals])

  // Reset to page 1 when filters change
  const prevFilters = useRef(filters)
  useEffect(() => {
    if (prevFilters.current !== filters) {
      prevFilters.current = filters
      setPage(1)
    }
  }, [filters])

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  function handleSort(col) {
    if (sortBy === col) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortOrder('desc')
    }
    setPage(1)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportCsv(buildParams())
    } finally {
      setExporting(false)
    }
  }

  const activeFilterCount = Object.entries(filters).filter(([, v]) => v !== '').length
  const hasFilters = activeFilterCount > 0

  const paginationProps = {
    page: pagination.page,
    totalPages: pagination.total_pages,
    total: pagination.total,
    pageSize: pagination.page_size,
    onPage: setPage,
    onPageSize: (n) => { setPageSize(n); setPage(1) },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Signals</h1>
          <p className="text-sm text-muted mt-0.5">Full signal history from all strategies</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            loading={exporting}
            icon={<Download size={14} />}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchSignals}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards summary={summary} loading={loading && !summary} />

      {/* Filters */}
      <div className="bg-bg border border-border rounded-xl p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-muted" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          strategies={strategies}
          activeCount={activeFilterCount}
          onClear={handleClearFilters}
        />
      </div>

      {/* Table card */}
      <div className="bg-bg border border-border rounded-xl shadow-card overflow-hidden">
        {/* Top pagination */}
        {!loading && pagination.total > 0 && (
          <Pagination {...paginationProps} />
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border sticky top-0 z-10">
              <tr>
                {[
                  { key: 'id',         label: 'ID'       },
                  { key: 'created_at', label: 'Created'  },
                  { key: null,         label: 'Strategy' },
                  { key: 'symbol',     label: 'Symbol'   },
                  { key: 'direction',  label: 'Dir'      },
                  { key: 'entry_price',label: 'Entry'    },
                  { key: 'sl_price',   label: 'SL'       },
                  { key: 'tp_price',   label: 'TP'       },
                  { key: 'rr_ratio',   label: 'RR'       },
                  { key: 'confidence', label: 'Conf'     },
                  { key: 'status',     label: 'Status'   },
                  { key: 'expires_at', label: 'Expires'  },
                ].map(col => (
                  <th
                    key={col.label}
                    onClick={col.key ? () => handleSort(col.key) : undefined}
                    className={clsx(
                      'px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap',
                      col.key && 'cursor-pointer select-none hover:text-text transition-colors',
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.key && sortBy === col.key && (
                        <span className="text-accent">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {loading ? (
              <tbody className="divide-y divide-border">
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div
                          className="h-3.5 bg-border rounded animate-pulse"
                          style={{ width: j === 0 ? '3rem' : j === 2 ? '7rem' : '5rem' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : signals.length === 0 ? (
              <tbody>
                <EmptyState
                  hasFilters={hasFilters}
                  onClear={handleClearFilters}
                  onRefresh={fetchSignals}
                />
              </tbody>
            ) : (
              <tbody className="divide-y divide-border">
                {signals.map(sig => (
                  <tr
                    key={sig.id}
                    onClick={() => setSelectedSig(sig)}
                    className="transition-colors hover:bg-surface/60 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-muted">#{sig.id}</td>
                    <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{formatDt(sig.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-text max-w-[140px] truncate" title={sig.display_name ?? sig.strategy_name}>
                      {sig.display_name ?? sig.strategy_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-medium text-text">{sig.symbol ?? '—'}</td>
                    <td className="px-4 py-3"><DirectionCell direction={sig.direction} /></td>
                    <td className="px-4 py-3 text-sm tabular-nums text-text">{sig.entry_price?.toFixed(2) ?? '—'}</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-danger">{sig.sl_price?.toFixed(2) ?? '—'}</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-success">{sig.tp_price?.toFixed(2) ?? '—'}</td>
                    <td className="px-4 py-3"><RrCell value={sig.rr_ratio} /></td>
                    <td className="px-4 py-3"><ConfidenceCell value={sig.confidence} /></td>
                    <td className="px-4 py-3"><StatusBadge status={sig.status} /></td>
                    <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{formatDt(sig.expires_at)}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* Bottom pagination */}
        {!loading && pagination.total > 0 && (
          <Pagination {...paginationProps} />
        )}
      </div>

      {/* Detail Drawer */}
      {selectedSig && (
        <SignalDrawer signal={selectedSig} onClose={() => setSelectedSig(null)} />
      )}
    </div>
  )
}
