import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import {
  ArrowUpRight, ArrowDownRight, RefreshCw, Download, Search,
  ChevronDown, ChevronLeft, ChevronRight, AlertTriangle,
  Filter, X, CheckSquare, Square, ExternalLink,
  TrendingUp, TrendingDown, Activity,
} from 'lucide-react'
import clsx from 'clsx'
import { tradesApi } from '../api/trades'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Select from '../components/ui/Select'
import Pagination from '../components/ui/Pagination'
import { Table, Thead, Tbody, Th, Tr, Td, TableSkeleton } from '../components/ui/Table'

// ─────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return format(typeof ts === 'string' ? parseISO(ts) : new Date(ts), 'MMM d, HH:mm')
  } catch {
    return ts
  }
}

function timeAgoShort(ts) {
  if (!ts) return null
  try {
    return formatDistanceToNow(
      typeof ts === 'string' ? parseISO(ts) : new Date(ts),
      { addSuffix: true }
    )
  } catch {
    return null
  }
}

function exportCsv(trades) {
  const headers = [
    'Time', 'Account', 'Symbol', 'Direction', 'Volume',
    'Open Price', 'Close Price', 'P&L', 'Net P&L',
    'Status', 'Ticket', 'Comment',
  ]
  const rows = trades.map(t => [
    t.open_time, t.account_name, t.symbol, t.direction, t.volume,
    t.open_price, t.close_price, t.profit, t.net_profit,
    t.status, t.ticket, t.comment,
  ])
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${v ?? ''}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trades_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function DirectionBadge({ direction }) {
  const isBuy = direction === 'BUY'
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
      isBuy ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
    )}>
      {isBuy ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {direction ?? '—'}
    </span>
  )
}

function PnLCell({ value }) {
  if (value == null) return <span className="text-muted text-xs">—</span>
  const isPos = value >= 0
  return (
    <span className={clsx('font-semibold text-sm', isPos ? 'text-success' : 'text-danger')}>
      {isPos ? '+' : ''}{Number(value).toFixed(2)}
    </span>
  )
}

function StatusBadge({ status }) {
  if (status === 'open') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        Open
      </span>
    )
  }
  return <Badge variant="neutral">Closed</Badge>
}

// ─────────────────────────────────────────────
// Unrealized P&L Summary Panel
// ─────────────────────────────────────────────

function UnrealizedPnLPanel({ accountIds, symbol, direction }) {
  const [summary,     setSummary]     = useState(null)
  const [fetching,    setFetching]    = useState(false)
  const [fetchError,  setFetchError]  = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [secondsAgo,  setSecondsAgo]  = useState(0)
  const pollingRef    = useRef(null)
  const tickerRef     = useRef(null)

  const fetchSummary = useCallback(async () => {
    setFetching(true)
    setFetchError(false)
    try {
      const params = {}
      if (accountIds?.length) params.mt5_account_ids = accountIds.join(',')
      if (symbol)             params.symbol    = symbol
      if (direction)          params.direction = direction

      const data = await tradesApi.positionsSummary(params)
      setSummary(data)
      setLastUpdated(new Date())
      setSecondsAgo(0)
    } catch {
      setFetchError(true)
    } finally {
      setFetching(false)
    }
  }, [accountIds, symbol, direction])

  // Start polling every 10 s
  useEffect(() => {
    fetchSummary()
    pollingRef.current = setInterval(fetchSummary, 10000)
    return () => {
      clearInterval(pollingRef.current)
      clearInterval(tickerRef.current)
    }
  }, [fetchSummary])

  // Tick up seconds-ago counter every second
  useEffect(() => {
    tickerRef.current = setInterval(() => {
      if (lastUpdated) {
        setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
      }
    }, 1000)
    return () => clearInterval(tickerRef.current)
  }, [lastUpdated])

  // Status indicator
  const statusBadge = fetchError ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-danger font-medium">
      <AlertTriangle size={11} />
      Error updating
    </span>
  ) : fetching ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-accent font-medium">
      <RefreshCw size={11} className="animate-spin" />
      Updating…
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] text-success font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
      Live · {secondsAgo}s ago
    </span>
  )

  const noPositions = !summary || summary.open_positions_count === 0

  return (
    <div className="bg-bg border border-border rounded-xl shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-accent" />
          <h3 className="text-sm font-semibold text-text">Unrealized P&amp;L</h3>
        </div>
        <div className="flex items-center gap-3">
          {statusBadge}
          <button
            type="button"
            onClick={fetchSummary}
            disabled={fetching}
            className="p-1 rounded text-muted hover:text-text transition-colors disabled:opacity-50"
            aria-label="Refresh positions"
          >
            <RefreshCw size={13} className={fetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {noPositions ? (
        <p className="text-sm text-muted text-center py-4">No open positions</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
          {/* Open positions */}
          <div className="bg-surface rounded-lg p-3">
            <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Open Positions</p>
            <p className="text-xl font-bold text-text">{summary.open_positions_count ?? 0}</p>
            {summary.total_volume != null && (
              <p className="text-[10px] text-muted mt-1">Vol: {Number(summary.total_volume).toFixed(2)}</p>
            )}
          </div>

          {/* Floating P&L */}
          <div className="bg-surface rounded-lg p-3">
            <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Floating P&amp;L</p>
            <p className={clsx(
              'text-xl font-bold',
              summary.total_unrealized_pnl >= 0 ? 'text-success' : 'text-danger',
            )}>
              {summary.total_unrealized_pnl >= 0 ? '+' : ''}
              ${Number(summary.total_unrealized_pnl ?? 0).toFixed(2)}
            </p>
          </div>

          {/* Float Profit */}
          <div className="bg-surface rounded-lg p-3">
            <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Float Profit</p>
            <p className="text-xl font-bold text-success">
              +${Number(summary.floating_profit ?? 0).toFixed(2)}
            </p>
          </div>

          {/* Float Loss */}
          <div className="bg-surface rounded-lg p-3">
            <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Float Loss</p>
            <p className="text-xl font-bold text-danger">
              -${Math.abs(Number(summary.floating_loss ?? 0)).toFixed(2)}
            </p>
          </div>

          {/* By Account (show first 2) */}
          {summary.by_account?.length > 0 && (
            <div className="bg-surface rounded-lg p-3 sm:col-span-2">
              <p className="text-[10px] text-muted uppercase tracking-wide mb-1">By Account</p>
              <div className="space-y-1">
                {summary.by_account.slice(0, 3).map(acc => (
                  <div key={acc.account_id} className="flex items-center justify-between text-xs">
                    <span className="text-muted truncate max-w-[100px]" title={acc.account_name}>
                      {acc.account_name}
                    </span>
                    <span className={clsx(
                      'font-semibold',
                      acc.floating_pnl >= 0 ? 'text-success' : 'text-danger',
                    )}>
                      {acc.floating_pnl >= 0 ? '+' : ''}${Number(acc.floating_pnl ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// MultiSelect dropdown
// ─────────────────────────────────────────────

function MultiSelect({ label, options, value, onChange, getLabel = o => o.name, getValue = o => o.id }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(id) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  let triggerLabel
  if (value.length === 0) {
    triggerLabel = `All ${label}`
  } else if (value.length <= 2) {
    triggerLabel = options.filter(o => value.includes(getValue(o))).map(o => getLabel(o)).join(', ')
  } else {
    const first = options.find(o => value.includes(getValue(o)))
    triggerLabel = `${first ? getLabel(first) : ''} +${value.length - 1} more`
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={clsx(
          'inline-flex items-center gap-2 pl-3.5 pr-3 py-2.5 rounded-lg text-sm transition-colors',
          'bg-bg border focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
          open ? 'border-accent' : 'border-border',
          value.length > 0 ? 'text-text font-medium' : 'text-muted',
        )}
      >
        <span className="truncate max-w-[160px]">{triggerLabel}</span>
        {value.length > 0 && (
          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-accent text-white text-[10px] font-bold shrink-0">
            {value.length}
          </span>
        )}
        <ChevronDown size={14} className={clsx('shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-56 bg-bg border border-border rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto">
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-1.5 text-xs text-accent hover:bg-surface transition-colors"
            >
              Clear selection
            </button>
          )}
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted">No options</div>
          )}
          {options.map(opt => {
            const id = getValue(opt)
            const checked = value.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text hover:bg-surface transition-colors"
              >
                {checked
                  ? <CheckSquare size={14} className="text-accent shrink-0" />
                  : <Square size={14} className="text-muted shrink-0" />
                }
                <span className="truncate">{getLabel(opt)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Sync dropdown button
// ─────────────────────────────────────────────

function SyncDropdown({ accounts, onSync, syncing }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative inline-flex">
      <Button
        variant="secondary"
        size="sm"
        loading={syncing}
        icon={!syncing ? <RefreshCw size={14} /> : undefined}
        onClick={() => onSync(null)}
      >
        Sync Now
      </Button>
      <button
        type="button"
        disabled={syncing}
        onClick={() => setOpen(p => !p)}
        className={clsx(
          'ml-0.5 px-1.5 py-1.5 rounded-lg border border-border bg-surface text-muted hover:text-text hover:bg-border transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        aria-label="More sync options"
      >
        <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-52 bg-bg border border-border rounded-xl shadow-lg py-1">
          <button
            type="button"
            onClick={() => { onSync(null); setOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface transition-colors font-medium"
          >
            Sync All Accounts
          </button>
          {accounts.map(acc => (
            <button
              key={acc.id}
              type="button"
              onClick={() => { onSync(acc.id); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface transition-colors"
            >
              <span className="block">{acc.name}</span>
              <span className="block text-xs text-muted">{acc.broker} · {acc.login}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────

function EmptyState({ syncStatus, onSync, onClearFilters, syncing, hasActiveFilters }) {
  return (
    <div className="bg-bg border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-text">No trade data found</p>
          <p className="text-sm text-muted mt-0.5">
            {hasActiveFilters
              ? 'No trades match your current filters. Try adjusting your date range or clearing filters.'
              : 'Trade sync may not have run yet, or there is no data for this period.'}
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Possible reasons</p>
        <ul className="space-y-1.5 text-sm text-muted">
          <li className="flex items-center gap-2"><span className="text-muted">•</span> Trade sync has not run yet</li>
          <li className="flex items-center gap-2"><span className="text-muted">•</span> EA / MT5 terminal is offline</li>
          <li className="flex items-center gap-2"><span className="text-muted">•</span> Date range filter has no trades in this period</li>
          <li className="flex items-center gap-2"><span className="text-muted">•</span> No MT5 accounts with terminal access configured</li>
        </ul>
      </div>

      {syncStatus.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Sync Status</p>
          <div className="space-y-2">
            {syncStatus.map(s => (
              <div key={s.account_id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-text">{s.account_name}</span>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>Open: <span className="text-text font-medium">{s.open_positions ?? 0}</span></span>
                  <span>Closed: <span className="text-text font-medium">{s.closed_trades ?? 0}</span></span>
                  <span>
                    Last sync:{' '}
                    <span className={clsx('font-medium', s.last_sync_at ? 'text-text' : 'text-danger')}>
                      {s.last_sync_at ? formatTime(s.last_sync_at) : 'never'}
                    </span>
                  </span>
                  <span className={clsx(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                    s.has_terminal ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                  )}>
                    {s.has_terminal ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          variant="primary"
          size="sm"
          loading={syncing}
          icon={!syncing ? <RefreshCw size={14} /> : undefined}
          onClick={() => onSync(null)}
        >
          Sync Now
        </Button>
        {hasActiveFilters && (
          <Button variant="secondary" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          icon={<ExternalLink size={13} />}
          onClick={() => window.location.href = '/mt5-accounts'}
        >
          Go to MT5 Accounts
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Toast notification
// ─────────────────────────────────────────────

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium',
      'animate-fade-in max-w-sm',
      type === 'error'
        ? 'bg-danger/10 border-danger/30 text-danger'
        : 'bg-accent/10 border-accent/30 text-accent',
    )}>
      {type !== 'error' && <RefreshCw size={14} />}
      {type === 'error' && <AlertTriangle size={14} />}
      <span>{message}</span>
      <button type="button" onClick={onClose} className="ml-auto text-muted hover:text-text">
        <X size={14} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main TradesPage
// ─────────────────────────────────────────────

export default function TradesPage() {
  // ── Data state ─────────────────────────────
  const [trades,       setTrades]       = useState([])
  const [total,        setTotal]        = useState(0)
  const [openCount,    setOpenCount]    = useState(0)
  const [closedCount,  setClosedCount]  = useState(0)
  const [stats,        setStats]        = useState(null)
  const [filterOptions,setFilterOptions]= useState({ accounts: [], symbols: [] })
  const [syncStatus,   setSyncStatus]   = useState([])

  // ── Loading / UI state ─────────────────────
  const [loading,   setLoading]  = useState(true)
  const [syncing,   setSyncing]  = useState(false)
  const [toast,     setToast]    = useState(null)
  const autoRefreshTimer         = useRef(null)

  // ── Filters ────────────────────────────────
  const [search,           setSearch]           = useState('')
  const [status,           setStatus]           = useState('')
  const [direction,        setDirection]        = useState('')
  const [profitType,       setProfitType]       = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [selectedSymbols,  setSelectedSymbols]  = useState([])
  const [startDate,        setStartDate]        = useState('')
  const [endDate,          setEndDate]          = useState('')

  // ── Sorting ────────────────────────────────
  const [sortCol, setSortCol] = useState('open_time')
  const [sortDir, setSortDir] = useState('desc')

  // ── Pagination ─────────────────────────────
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // ── Active filter count ────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (search)                  count++
    if (status)                  count++
    if (direction)               count++
    if (profitType)              count++
    if (selectedAccounts.length) count++
    if (selectedSymbols.length)  count++
    if (startDate)               count++
    if (endDate)                 count++
    return count
  }, [search, status, direction, profitType, selectedAccounts, selectedSymbols, startDate, endDate])

  // ── Build API params ───────────────────────
  function buildParams(pageOverride, pageSizeOverride) {
    const params = {
      page:      pageOverride      ?? page,
      page_size: pageSizeOverride  ?? pageSize,
    }
    if (status)                   params.status      = status
    if (direction)                params.direction   = direction
    if (profitType)               params.profit_type = profitType
    if (search)                   params.search      = search
    if (startDate)                params.start_date  = startDate
    if (endDate)                  params.end_date    = endDate
    if (selectedAccounts.length)  params.mt5_account_ids = selectedAccounts.join(',')
    if (selectedSymbols.length)   params.symbol      = selectedSymbols.join(',')
    return params
  }

  // ── Fetch trades ───────────────────────────
  const fetchTrades = useCallback(async (pageOverride, pageSizeOverride) => {
    setLoading(true)
    const params = buildParams(pageOverride, pageSizeOverride)

    if (import.meta.env.DEV) {
      console.log('[TradesPage] Fetching with params:', params)
    }

    const result = await tradesApi.list(params)
    setTrades(Array.isArray(result.trades) ? result.trades : [])
    setTotal(result.total ?? 0)
    setOpenCount(result.open_count ?? 0)
    setClosedCount(result.closed_count ?? 0)
    if (result.stats) setStats(result.stats)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, direction, profitType, selectedAccounts, selectedSymbols, startDate, endDate, page, pageSize])

  // ── Fetch filter options + sync status ──
  useEffect(() => {
    async function init() {
      const [opts, syncSt] = await Promise.all([
        tradesApi.filters(),
        tradesApi.syncStatus(),
      ])
      setFilterOptions(opts)
      setSyncStatus(Array.isArray(syncSt) ? syncSt : [])
    }
    init()
  }, [])

  // ── Re-fetch when filters change ──
  useEffect(() => {
    setPage(1)
    fetchTrades(1, pageSize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, direction, profitType, selectedAccounts, selectedSymbols, startDate, endDate])

  // ── Re-fetch when page or pageSize changes ──
  useEffect(() => {
    fetchTrades(page, pageSize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  // ── Cleanup ──
  useEffect(() => () => clearTimeout(autoRefreshTimer.current), [])

  // ── Sort current page ─────────────────────
  const sortedTrades = useMemo(() => {
    const copy = [...trades]
    copy.sort((a, b) => {
      const av = a[sortCol] ?? ''
      const bv = b[sortCol] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [trades, sortCol, sortDir])

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  // ── Pagination handlers ────────────────────
  const handlePage = (p) => setPage(p)

  const handlePageSize = (ps) => {
    setPageSize(ps)
    setPage(1)
  }

  // ── Clear all filters ──────────────────────
  function clearFilters() {
    setSearch('')
    setStatus('')
    setDirection('')
    setProfitType('')
    setSelectedAccounts([])
    setSelectedSymbols([])
    setStartDate('')
    setEndDate('')
  }

  // ── Sync handler ───────────────────────────
  async function handleSync(accountId) {
    setSyncing(true)
    setToast(null)
    const res = await tradesApi.sync(accountId, 90)
    setSyncing(false)

    if (res?.error) {
      setToast({ message: `Sync failed: ${res.error}`, type: 'error' })
    } else {
      setToast({ message: 'Sync started — data will appear in 10–30 seconds', type: 'info' })
      autoRefreshTimer.current = setTimeout(() => {
        fetchTrades(page, pageSize)
        tradesApi.syncStatus().then(s => setSyncStatus(Array.isArray(s) ? s : []))
      }, 15000)
    }
  }

  // ── Export CSV ─────────────────────────────
  async function handleExportCsv() {
    const params = buildParams(1)
    params.page_size = total || 1000
    const result = await tradesApi.list(params)
    exportCsv(Array.isArray(result.trades) ? result.trades : [])
  }

  // ── Summary stat values ────────────────────
  const winRate  = stats?.win_rate  != null ? `${Number(stats.win_rate).toFixed(1)}%` : null
  const totalPnl = stats?.total_pnl != null ? stats.total_pnl : null

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const paginationProps = {
    page,
    totalPages,
    total,
    pageSize,
    onPage:     handlePage,
    onPageSize: handlePageSize,
    pageSizeOptions: [25, 50, 100, 200],
  }

  // ────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Trades</h1>
          <p className="text-sm text-muted mt-0.5">Full history of executed trades</p>
        </div>
        <div className="flex items-center gap-2">
          <SyncDropdown
            accounts={filterOptions.accounts}
            onSync={handleSync}
            syncing={syncing}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleExportCsv}
            disabled={total === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Unrealized P&L Panel ── */}
      <UnrealizedPnLPanel
        accountIds={selectedAccounts}
        symbol={selectedSymbols.join(',')}
        direction={direction}
      />

      {/* ── Summary stat cards ── */}
      {(total > 0 || stats?.has_data) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Trades',   value: total,      key: 'total' },
            { label: 'Open Positions', value: openCount,  key: 'open' },
            { label: 'Closed Trades',  value: closedCount, key: 'closed' },
            {
              label: 'Total P&L',
              value: totalPnl != null
                ? `${totalPnl >= 0 ? '+' : ''}$${Number(totalPnl).toFixed(2)}`
                : '—',
              key: 'pnl',
              colored: totalPnl != null,
              positive: totalPnl != null && totalPnl >= 0,
            },
            { label: 'Win Rate', value: winRate ?? '—', key: 'winrate' },
          ].map(({ label, value, key, colored, positive }) => (
            <div key={key} className="bg-bg border border-border rounded-xl p-4 shadow-card">
              <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
              <p className={clsx(
                'text-xl font-bold mt-1 tracking-tight',
                colored ? (positive ? 'text-success' : 'text-danger') : 'text-text',
              )}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="bg-bg border border-border rounded-xl p-4 shadow-card space-y-3">
        {/* Row 1 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-sm relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Search ticket / comment / magic…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={clsx(
                'w-full bg-bg border border-border rounded-lg text-sm text-text placeholder:text-muted',
                'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors',
                'pl-9 pr-3.5 py-2.5',
              )}
            />
          </div>

          <Select
            placeholder="All Statuses"
            value={status}
            onChange={e => setStatus(e.target.value)}
            options={[
              { value: 'all',    label: 'All' },
              { value: 'open',   label: 'Open' },
              { value: 'closed', label: 'Closed' },
            ]}
            className="w-36"
          />

          <Select
            placeholder="All Directions"
            value={direction}
            onChange={e => setDirection(e.target.value)}
            options={[
              { value: 'BUY',  label: 'BUY' },
              { value: 'SELL', label: 'SELL' },
            ]}
            className="w-36"
          />

          {activeFilterCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
              <Filter size={11} />
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </span>
          )}
        </div>

        {/* Row 2 */}
        <div className="flex flex-wrap items-center gap-3">
          <MultiSelect
            label="Accounts"
            options={filterOptions.accounts}
            value={selectedAccounts}
            onChange={setSelectedAccounts}
            getLabel={o => o.name}
            getValue={o => o.id}
          />

          <MultiSelect
            label="Symbols"
            options={filterOptions.symbols.map(s => ({ id: s, name: s }))}
            value={selectedSymbols}
            onChange={setSelectedSymbols}
            getLabel={o => o.name}
            getValue={o => o.id}
          />

          <Select
            placeholder="All P&L Types"
            value={profitType}
            onChange={e => setProfitType(e.target.value)}
            options={[
              { value: 'profit', label: 'Profitable' },
              { value: 'loss',   label: 'Loss' },
            ]}
            className="w-36"
          />

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className={clsx(
                'bg-bg border border-border rounded-lg text-sm text-text',
                'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors',
                'px-3 py-2.5',
              )}
            />
            <span className="text-muted text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className={clsx(
                'bg-bg border border-border rounded-lg text-sm text-text',
                'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors',
                'px-3 py-2.5',
              )}
            />
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-danger hover:bg-danger/5 border border-border transition-colors"
              >
                <X size={13} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!loading && trades.length === 0 && (
        <EmptyState
          syncStatus={syncStatus}
          onSync={handleSync}
          onClearFilters={clearFilters}
          syncing={syncing}
          hasActiveFilters={activeFilterCount > 0}
        />
      )}

      {/* ── Trade table (show when loading OR has trades) ── */}
      {(loading || trades.length > 0) && (
        <div className="bg-bg border border-border rounded-xl shadow-card overflow-hidden">
          {/* Top pagination */}
          {total > 0 && <Pagination {...paginationProps} />}

          <Table className="border-0 rounded-none">
            <Thead>
              <tr>
                <Th sortable sorted={sortCol === 'open_time'}  direction={sortDir} onSort={() => handleSort('open_time')}>
                  Time
                </Th>
                <Th>Account</Th>
                <Th sortable sorted={sortCol === 'symbol'} direction={sortDir} onSort={() => handleSort('symbol')}>
                  Symbol
                </Th>
                <Th>Dir</Th>
                <Th>Vol</Th>
                <Th>Open</Th>
                <Th>Close</Th>
                <Th sortable sorted={sortCol === 'net_profit'} direction={sortDir} onSort={() => handleSort('net_profit')}>
                  P&amp;L
                </Th>
                <Th>Status</Th>
                <Th>Ticket</Th>
              </tr>
            </Thead>

            {loading ? (
              <TableSkeleton cols={10} rows={8} />
            ) : (
              <Tbody>
                {sortedTrades.map((t, i) => (
                  <Tr key={t.id ?? t.ticket ?? i}>
                    <Td muted>
                      <div className="whitespace-nowrap">{formatTime(t.open_time)}</div>
                    </Td>
                    <Td>
                      <div className="text-sm font-medium text-text leading-tight">{t.account_name ?? '—'}</div>
                      <div className="text-xs text-muted leading-tight mt-0.5">{t.broker_name ?? ''}</div>
                    </Td>
                    <Td>
                      <span className="font-mono font-bold text-text">{t.symbol ?? '—'}</span>
                    </Td>
                    <Td>
                      <DirectionBadge direction={t.direction} />
                    </Td>
                    <Td muted>{t.volume ?? '—'}</Td>
                    <Td muted>
                      <span className="font-mono text-xs">
                        {t.open_price != null ? Number(t.open_price).toFixed(5) : '—'}
                      </span>
                    </Td>
                    <Td muted>
                      {t.status === 'open'
                        ? <span className="text-xs text-accent font-medium">Open</span>
                        : <span className="font-mono text-xs">
                            {t.close_price != null ? Number(t.close_price).toFixed(5) : '—'}
                          </span>
                      }
                    </Td>
                    <Td>
                      <PnLCell value={t.net_profit} />
                    </Td>
                    <Td>
                      <StatusBadge status={t.status} />
                    </Td>
                    <Td muted>
                      <span className="font-mono text-xs">{t.ticket ?? '—'}</span>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            )}
          </Table>

          {/* Bottom pagination */}
          <Pagination {...paginationProps} />
        </div>
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
