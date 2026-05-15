import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, Play, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Clock, XCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { backtestApi } from '../api/backtest'
import { strategiesApi } from '../api/strategies'
import { brokersApi } from '../api/brokers'
import { displayName } from '../utils/strategyDisplay'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import { Table, Thead, Tbody, Th, Tr, Td, TableSkeleton, TableEmpty } from '../components/ui/Table'
import EquityChart from '../components/charts/EquityChart'
import clsx from 'clsx'

const TABS = ['Run', 'History', 'Analytics']

const statusIcon    = { completed: CheckCircle, running: Clock, failed: XCircle, pending: Clock }
const statusVariant = { completed: 'success', running: 'blue', failed: 'danger', pending: 'warning' }

/* ── Sortable Th helper ── */
function SortTh({ col, currentCol, dir, onSort, children }) {
  return (
    <Th
      sortable
      sorted={currentCol === col}
      direction={dir}
      onSort={() => onSort(col)}
    >
      {children}
    </Th>
  )
}

/* ══════════════ RUN TAB ══════════════ */
function RunTab({ strategies, accounts }) {
  const [form, setForm] = useState({
    strategy_id: '', broker_account_id: '', start_date: '', end_date: ''
  })
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleRun = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!form.strategy_id || !form.start_date || !form.end_date) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      const res = await backtestApi.run(form)
      setResult(res)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Backtest failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Card header="Configure Backtest">
        <form onSubmit={handleRun} className="space-y-4">
          {error && (
            <div className="flex gap-2 p-3.5 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          <Select
            label="Strategy *"
            value={form.strategy_id}
            onChange={e => set('strategy_id', e.target.value)}
            placeholder="Select strategy"
            options={strategies.map(s => ({ value: s.id, label: displayName(s) }))}
          />
          <Select
            label="Broker Account"
            value={form.broker_account_id}
            onChange={e => set('broker_account_id', e.target.value)}
            placeholder="Select account (optional)"
            options={accounts.map(a => ({ value: a.id, label: `${a.broker_name ?? 'Account'} - ${a.account_type ?? ''}` }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date *" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            <Input label="End Date *"   type="date" value={form.end_date}   onChange={e => set('end_date',   e.target.value)} />
          </div>
          <Button type="submit" variant="primary" loading={loading} icon={<Play size={14} />} className="w-full">
            Run Backtest
          </Button>
        </form>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card header="Backtest Result">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                ['Total Trades',  result.total_trades ?? '—'],
                ['Win Rate',      result.win_rate != null ? `${(result.win_rate * 100).toFixed(1)}%` : '—'],
                ['Profit Factor', result.profit_factor?.toFixed(2) ?? '—'],
                ['Max Drawdown',  result.max_drawdown != null ? `${(result.max_drawdown * 100).toFixed(1)}%` : '—'],
              ].map(([lbl, val]) => (
                <div key={lbl} className="p-3 rounded-lg bg-surface text-center">
                  <p className="text-[10px] text-muted uppercase tracking-wide">{lbl}</p>
                  <p className="text-lg font-bold text-text mt-0.5">{val}</p>
                </div>
              ))}
            </div>
            <Badge variant={result.status === 'completed' ? 'success' : 'warning'}>
              {result.status ?? 'submitted'}
            </Badge>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

/* ══════════════ HISTORY TAB ══════════════ */
function HistoryTab({ strategies }) {
  const [runs,       setRuns]      = useState([])
  const [loading,    setLoading]   = useState(true)
  const [expandedId, setExpanded]  = useState(null)

  // Filters
  const [filterStrategy, setFilterStrategy] = useState('')
  const [sortBy,         setSortBy]         = useState('created_at')
  const [sortOrder,      setSortOrder]      = useState('desc')

  // Pagination
  const [page,       setPage]       = useState(1)
  const [pageSize,   setPageSize]   = useState(25)
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchRuns = useCallback(async (opts = {}) => {
    setLoading(true)
    try {
      const params = {
        page:        opts.page      ?? page,
        page_size:   opts.pageSize  ?? pageSize,
        sort_by:     opts.sortBy    ?? sortBy,
        sort_order:  opts.sortOrder ?? sortOrder,
      }
      const strat = opts.strategy !== undefined ? opts.strategy : filterStrategy
      if (strat) params.strategy_id = strat

      const res = await backtestApi.getRuns(params)

      if (res && res.data && res.pagination) {
        setRuns(res.data)
        setTotal(res.pagination.total)
        setTotalPages(res.pagination.total_pages)
      } else if (Array.isArray(res)) {
        setRuns(res)
        setTotal(res.length)
        setTotalPages(1)
      } else {
        setRuns([])
        setTotal(0)
        setTotalPages(0)
      }
    } catch {
      setRuns([])
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy, sortOrder, filterStrategy])

  useEffect(() => {
    fetchRuns()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortOrder, filterStrategy])

  const handleSort = (col) => {
    const newOrder = sortBy === col && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(col)
    setSortOrder(newOrder)
    setPage(1)
  }

  const handleStrategyFilter = (v) => {
    setFilterStrategy(v)
    setPage(1)
  }

  const handlePage = (p) => setPage(p)

  const handlePageSize = (ps) => {
    setPageSize(ps)
    setPage(1)
  }

  const paginationProps = {
    page,
    totalPages,
    total,
    pageSize,
    onPage:     handlePage,
    onPageSize: handlePageSize,
    pageSizeOptions: [10, 25, 50, 100],
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={filterStrategy}
          onChange={e => handleStrategyFilter(e.target.value)}
          placeholder="All strategies"
          options={strategies.map(s => ({ value: s.id, label: displayName(s) }))}
          className="w-56"
        />
        {filterStrategy && (
          <button
            type="button"
            onClick={() => handleStrategyFilter('')}
            className="text-xs text-muted hover:text-danger transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Top pagination */}
      {total > 0 && <Pagination {...paginationProps} />}

      <Table>
        <Thead>
          <tr>
            <SortTh col="created_at"    currentCol={sortBy} dir={sortOrder} onSort={handleSort}>Date</SortTh>
            <Th>Strategy</Th>
            <Th>Trades</Th>
            <SortTh col="win_rate"      currentCol={sortBy} dir={sortOrder} onSort={handleSort}>Win Rate</SortTh>
            <SortTh col="max_drawdown"  currentCol={sortBy} dir={sortOrder} onSort={handleSort}>Max DD</SortTh>
            <SortTh col="profit_factor" currentCol={sortBy} dir={sortOrder} onSort={handleSort}>Profit Factor</SortTh>
            <SortTh col="total_pnl"     currentCol={sortBy} dir={sortOrder} onSort={handleSort}>Total P&amp;L</SortTh>
            <Th>Status</Th>
            <Th></Th>
          </tr>
        </Thead>
        {loading ? (
          <TableSkeleton cols={9} rows={5} />
        ) : runs.length === 0 ? (
          <TableEmpty
            message="No backtest results yet. Use the Run tab to execute a backtest."
            cols={9}
          />
        ) : (
          <Tbody>
            {runs.map((run) => {
              const isExpanded = expandedId === run.id
              const SIcon = statusIcon[run.status] ?? Clock
              const stratName = run.display_name || run.strategy_nickname || run.strategy_name || run.strategy_id || '—'
              return (
                <>
                  <Tr key={run.id} onClick={() => setExpanded(isExpanded ? null : run.id)}>
                    <Td muted>{run.created_at ? format(new Date(run.created_at), 'MMM d, HH:mm') : '—'}</Td>
                    <Td>
                      <div>
                        <span className="font-medium text-text">{stratName}</span>
                        {run.strategy_code && (
                          <span className="block text-[10px] font-mono text-muted mt-0.5">{run.strategy_code}</span>
                        )}
                      </div>
                    </Td>
                    <Td>{run.total_trades ?? '—'}</Td>
                    <Td>{run.win_rate != null ? `${(run.win_rate * 100).toFixed(1)}%` : '—'}</Td>
                    <Td className={run.max_drawdown > 0.2 ? 'text-danger' : ''}>
                      {run.max_drawdown != null ? `${(run.max_drawdown * 100).toFixed(1)}%` : '—'}
                    </Td>
                    <Td>{run.profit_factor?.toFixed(2) ?? '—'}</Td>
                    <Td>
                      {run.total_pnl != null ? (
                        <span className={clsx('font-semibold', run.total_pnl >= 0 ? 'text-success' : 'text-danger')}>
                          {run.total_pnl >= 0 ? '+' : ''}${Number(run.total_pnl).toFixed(2)}
                        </span>
                      ) : '—'}
                    </Td>
                    <Td>
                      <Badge variant={statusVariant[run.status] ?? 'neutral'}>
                        <SIcon size={10} className="mr-1" />{run.status ?? 'unknown'}
                      </Badge>
                    </Td>
                    <Td>
                      {isExpanded
                        ? <ChevronUp size={14} className="text-muted" />
                        : <ChevronDown size={14} className="text-muted" />}
                    </Td>
                  </Tr>
                  {isExpanded && (
                    <tr key={`${run.id}-detail`}>
                      <td colSpan={9} className="px-4 py-4 bg-surface">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          {run.equity_curve?.length ? (
                            <EquityChart data={run.equity_curve} />
                          ) : (
                            <p className="text-sm text-muted text-center py-4">No equity curve data available for this run.</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            {[
                              ['Net PnL',    run.net_pnl != null ? `$${run.net_pnl.toFixed(2)}` : (run.total_pnl != null ? `$${run.total_pnl.toFixed(2)}` : '—')],
                              ['Sharpe',     run.sharpe_ratio?.toFixed(2) ?? '—'],
                              ['Start Date', run.start_date ?? '—'],
                              ['End Date',   run.end_date ?? '—'],
                            ].map(([lbl, val]) => (
                              <div key={lbl} className="p-3 rounded-lg bg-bg border border-border">
                                <p className="text-[10px] text-muted uppercase tracking-wide">{lbl}</p>
                                <p className="text-sm font-semibold text-text mt-0.5">{val}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </Tbody>
        )}
      </Table>

      {/* Bottom pagination */}
      {total > 0 && <Pagination {...paginationProps} />}
    </div>
  )
}

/* ══════════════ PAGE ══════════════ */
export default function BacktestPage() {
  const [tab,        setTab]        = useState(0)
  const [strategies, setStrategies] = useState([])
  const [accounts,   setAccounts]   = useState([])

  useEffect(() => {
    Promise.allSettled([strategiesApi.list(), brokersApi.mt5Accounts()]).then(([s, a]) => {
      if (s.status === 'fulfilled') setStrategies(Array.isArray(s.value) ? s.value : [])
      if (a.status === 'fulfilled') setAccounts(Array.isArray(a.value) ? a.value : [])
    })
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text">Backtest</h1>
        <p className="text-sm text-muted mt-1">Test your strategies against historical data</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === i ? 'bg-bg text-text shadow-sm border border-border' : 'text-muted hover:text-text'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 0 && <RunTab strategies={strategies} accounts={accounts} />}
          {tab === 1 && <HistoryTab strategies={strategies} />}
          {tab === 2 && (
            <Card header="Analytics">
              <p className="text-sm text-muted text-center py-12">
                Run backtests to see aggregated performance analytics.
              </p>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
