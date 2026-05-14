import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import {
  ArrowLeft, Zap, ArrowUpRight, ArrowDownRight,
  Play, BarChart2, Clock, Info,
} from 'lucide-react'
import clsx from 'clsx'
import { strategiesApi } from '../api/strategies'
import Card            from '../components/ui/Card'
import Badge           from '../components/ui/Badge'
import Button          from '../components/ui/Button'
import Skeleton        from '../components/ui/Skeleton'
import Toggle          from '../components/ui/Toggle'
import EquityChart     from '../components/charts/EquityChart'
import PnLBarChart     from '../components/charts/PnLBarChart'
import TimeRangeSelector, { useTimeRange } from '../components/ui/TimeRangeSelector'
import {
  Table, Thead, Tbody, Th, Tr, Td, TableSkeleton, TableEmpty,
} from '../components/ui/Table'

/* ── Helpers ── */
function fmt(val, prefix = '$') {
  if (val == null) return '—'
  const num = parseFloat(val)
  if (isNaN(num)) return '—'
  return `${prefix}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function pct(val) {
  if (val == null) return '—'
  return `${(parseFloat(val) * 100).toFixed(1)}%`
}
function timeAgo(ts) {
  if (!ts) return null
  try { return formatDistanceToNow(parseISO(ts), { addSuffix: true }) } catch { return null }
}

/* ── KPI stat card (reused from Dashboard pattern) ── */
function KpiCard({ label, value, valueClass, loading }) {
  return (
    <div className="bg-bg border border-border rounded-xl p-4 shadow-card flex flex-col gap-1">
      <p className="text-[11px] font-medium text-muted uppercase tracking-wide">{label}</p>
      {loading
        ? <Skeleton height={22} className="w-20 mt-1" />
        : <p className={clsx('text-lg font-bold text-text leading-tight', valueClass)}>{value ?? '—'}</p>
      }
    </div>
  )
}

/* ── Tab button ── */
function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap',
        active
          ? 'border-accent text-accent'
          : 'border-transparent text-muted hover:text-text hover:border-border'
      )}
    >
      {children}
    </button>
  )
}

/* ── Signal direction cell ── */
function DirectionCell({ direction }) {
  const isBuy = direction?.toUpperCase() === 'BUY'
  return (
    <div className={clsx('flex items-center gap-1 text-xs font-semibold',
      isBuy ? 'text-success' : 'text-danger')}>
      {isBuy ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {isBuy ? 'BUY' : 'SELL'}
    </div>
  )
}

/* ── Signal status badge ── */
function SignalStatusBadge({ status }) {
  const map = {
    active:    'blue',
    executed:  'success',
    expired:   'neutral',
    cancelled: 'danger',
  }
  return <Badge variant={map[status] ?? 'neutral'}>{status ?? '—'}</Badge>
}

/* ── Empty state ── */
function EmptyState({ icon: Icon = Info, title, description }) {
  return (
    <div className="h-56 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center max-w-xs">
        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Icon size={20} className="text-accent" />
        </div>
        <p className="text-sm font-semibold text-text">{title}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
    </div>
  )
}

/* ══════════════ TAB 1: OVERVIEW ══════════════ */
function OverviewTab({ detail, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div key={i} className="bg-bg border border-border rounded-xl p-5 space-y-3">
            <Skeleton height={16} className="w-1/2" />
            <Skeleton height={14} className="w-full" />
            <Skeleton height={14} className="w-3/4" />
            <Skeleton height={14} className="w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (!detail) return <EmptyState title="Failed to load strategy details" />

  const risk    = detail.risk_settings_json ?? {}
  const conds   = detail.conditions_json    ?? {}
  const bt      = detail.last_backtest      ?? {}
  const accts   = detail.assigned_accounts  ?? []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Strategy info */}
      <Card header="Strategy Info">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted">Symbol</p>
              <p className="font-mono font-semibold text-text mt-0.5">{detail.symbol ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Timeframe</p>
              <p className="font-semibold text-text mt-0.5">{detail.timeframe ?? '—'}</p>
            </div>
            {risk.min_confidence != null && (
              <div>
                <p className="text-xs text-muted">Min Confidence</p>
                <p className="font-semibold text-text mt-0.5">{pct(risk.min_confidence)}</p>
              </div>
            )}
            {risk.sl_multiplier != null && (
              <div>
                <p className="text-xs text-muted">SL Multiplier</p>
                <p className="font-semibold text-text mt-0.5">{risk.sl_multiplier}×</p>
              </div>
            )}
            {risk.tp_multiplier != null && (
              <div>
                <p className="text-xs text-muted">TP Multiplier</p>
                <p className="font-semibold text-text mt-0.5">{risk.tp_multiplier}×</p>
              </div>
            )}
            {risk.risk_percent != null && (
              <div>
                <p className="text-xs text-muted">Risk per Trade</p>
                <p className="font-semibold text-text mt-0.5">{risk.risk_percent}%</p>
              </div>
            )}
          </div>

          {/* Conditions summary */}
          {Object.keys(conds).length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Conditions</p>
              <div className="space-y-1">
                {Object.entries(conds).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <span className="text-muted capitalize">{k.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-text">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Right: Backtest + Assigned accounts */}
      <div className="space-y-4">
        {/* Last backtest */}
        <Card header="Last Backtest">
          {Object.keys(bt).length === 0 ? (
            <p className="text-sm text-muted">No backtest data available.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted">Win Rate</p>
                <p className="font-semibold text-success mt-0.5">
                  {bt.win_rate != null ? `${(bt.win_rate * 100).toFixed(1)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Profit Factor</p>
                <p className="font-semibold text-text mt-0.5">{bt.profit_factor?.toFixed(2) ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Max Drawdown</p>
                <p className="font-semibold text-danger mt-0.5">
                  {bt.max_drawdown != null ? `${(bt.max_drawdown * 100).toFixed(1)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Total Trades</p>
                <p className="font-semibold text-text mt-0.5">{bt.total_trades ?? '—'}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Assigned accounts */}
        <Card header="Assigned Accounts">
          {accts.length === 0 ? (
            <p className="text-sm text-muted">No accounts assigned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {accts.map(a => (
                <div
                  key={a.assignment_id}
                  className={clsx(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs',
                    a.enabled
                      ? 'bg-success/5 border-success/20'
                      : 'bg-surface border-border opacity-60'
                  )}
                >
                  <span className="font-medium text-text">{a.account_name}</span>
                  <span className="text-muted">Lot:{a.lot_size}</span>
                  <Badge variant={a.enabled ? 'success' : 'neutral'} className="text-[10px]">
                    {a.enabled ? 'On' : 'Off'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ══════════════ TAB 2: EQUITY ══════════════ */
function EquityTab({ strategyId }) {
  const { range, setRange, startDate, setStartDate, endDate, setEndDate, toQueryParams } = useTimeRange('1m')
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = toQueryParams()
    const result = await strategiesApi.equityCurve(strategyId, params)
    setData(Array.isArray(result) ? result : [])
    setLoading(false)
  }, [strategyId, range, startDate, endDate]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-4">
      <TimeRangeSelector
        value={range}
        onChange={setRange}
        startDate={startDate}
        endDate={endDate}
        onStartDate={setStartDate}
        onEndDate={setEndDate}
      />
      {loading ? (
        <Skeleton height={220} className="w-full rounded-lg" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No equity data yet"
          description="Equity data will appear once live trades are executed."
        />
      ) : (
        <EquityChart data={data} />
      )}
    </div>
  )
}

/* ══════════════ TAB 3: SIGNALS ══════════════ */
function SignalsTab({ strategyId }) {
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    strategiesApi.signals(strategyId, { limit: 100 })
      .then(data => setSignals(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [strategyId])

  return (
    <Table>
      <Thead>
        <tr>
          <Th>Time</Th>
          <Th>Symbol</Th>
          <Th>TF</Th>
          <Th>Direction</Th>
          <Th>Confidence</Th>
          <Th>Entry</Th>
          <Th>SL</Th>
          <Th>TP</Th>
          <Th>Status</Th>
        </tr>
      </Thead>
      {loading ? (
        <TableSkeleton cols={9} rows={6} />
      ) : signals.length === 0 ? (
        <TableEmpty message="No signals generated yet" cols={9} />
      ) : (
        <Tbody>
          {signals.map((sig, i) => (
            <Tr key={sig.id ?? i}>
              <Td muted>
                {sig.created_at
                  ? (() => { try { return format(parseISO(sig.created_at), 'MMM d HH:mm') } catch { return sig.created_at } })()
                  : '—'}
              </Td>
              <Td>
                <span className="font-mono font-medium text-text">{sig.symbol ?? '—'}</span>
              </Td>
              <Td muted>{sig.timeframe ?? '—'}</Td>
              <Td><DirectionCell direction={sig.direction} /></Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-14 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${((sig.confidence ?? 0) * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted">
                    {((sig.confidence ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </Td>
              <Td muted>{sig.entry_price ?? '—'}</Td>
              <Td muted>
                <span className="text-danger">{sig.sl_price ?? '—'}</span>
              </Td>
              <Td muted>
                <span className="text-success">{sig.tp_price ?? '—'}</span>
              </Td>
              <Td><SignalStatusBadge status={sig.status} /></Td>
            </Tr>
          ))}
        </Tbody>
      )}
    </Table>
  )
}

/* ══════════════ TAB 4: P&L ══════════════ */
function PnLTab({ strategyId }) {
  const { range, setRange, startDate, setStartDate, endDate, setEndDate, toQueryParams } = useTimeRange('1m')
  const [summary,   setSummary]   = useState(null)
  const [pnlByDay,  setPnlByDay]  = useState([])
  const [sumLoading,setSumLoading]= useState(true)
  const [dayLoading,setDayLoading]= useState(false)

  useEffect(() => {
    strategiesApi.pnlSummary(strategyId)
      .then(d => setSummary(d))
      .finally(() => setSumLoading(false))
  }, [strategyId])

  const fetchPnlByDay = useCallback(async () => {
    setDayLoading(true)
    const params = toQueryParams()
    const result = await strategiesApi.pnlByDay(strategyId, params.range ?? null)
    setPnlByDay(Array.isArray(result) ? result : [])
    setDayLoading(false)
  }, [strategyId, range, startDate, endDate]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchPnlByDay() }, [fetchPnlByDay])

  const pnlClass = (v) => v == null ? '' : v >= 0 ? 'text-success' : 'text-danger'

  return (
    <div className="space-y-6">
      {/* Top 7-stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        <KpiCard label="Today P&L"     value={fmt(summary?.today_pnl)}  valueClass={pnlClass(summary?.today_pnl)}  loading={sumLoading} />
        <KpiCard label="Week P&L"      value={fmt(summary?.week_pnl)}   valueClass={pnlClass(summary?.week_pnl)}   loading={sumLoading} />
        <KpiCard label="Month P&L"     value={fmt(summary?.month_pnl)}  valueClass={pnlClass(summary?.month_pnl)}  loading={sumLoading} />
        <KpiCard label="Total P&L"     value={fmt(summary?.total_pnl)}  valueClass={pnlClass(summary?.total_pnl)}  loading={sumLoading} />
        <KpiCard label="Win Rate"      value={summary?.win_rate != null ? `${(summary.win_rate * 100).toFixed(1)}%` : '—'} loading={sumLoading} />
        <KpiCard label="Profit Factor" value={summary?.profit_factor?.toFixed(2) ?? '—'} loading={sumLoading} />
        <KpiCard label="Max DD"        value={summary?.max_drawdown != null ? `${(summary.max_drawdown * 100).toFixed(1)}%` : '—'} valueClass="text-danger" loading={sumLoading} />
      </div>

      {/* Daily P&L bar chart */}
      <Card header="Daily P&L">
        <div className="space-y-3">
          <TimeRangeSelector
            value={range}
            onChange={setRange}
            startDate={startDate}
            endDate={endDate}
            onStartDate={setStartDate}
            onEndDate={setEndDate}
          />
          {dayLoading ? (
            <Skeleton height={180} className="w-full rounded-lg" />
          ) : (
            <PnLBarChart data={pnlByDay} />
          )}
        </div>
      </Card>

      {/* Bottom 6-stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Total Trades" value={summary?.total_trades ?? '—'} loading={sumLoading} />
        <KpiCard label="Wins"         value={summary?.win_count   ?? '—'}  loading={sumLoading} />
        <KpiCard label="Losses"       value={summary?.loss_count  ?? '—'}  loading={sumLoading} />
        <KpiCard label="Avg Win"      value={fmt(summary?.avg_win)} valueClass="text-success" loading={sumLoading} />
        <KpiCard label="Avg Loss"     value={fmt(summary?.avg_loss)} valueClass="text-danger" loading={sumLoading} />
        <KpiCard
          label="Best / Worst"
          value={summary?.best_trade != null && summary?.worst_trade != null
            ? `+${summary.best_trade.toFixed(2)} / ${summary.worst_trade.toFixed(2)}`
            : '—'}
          loading={sumLoading}
        />
      </div>
    </div>
  )
}

/* ══════════════ PAGE ══════════════ */
const TABS = ['Overview', 'Equity', 'Signals', 'P&L']

export default function StrategyDetailPage() {
  const { strategyId } = useParams()
  const navigate = useNavigate()

  const [detail,   setDetail]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState(false)
  const [activeTab,setActiveTab]= useState(0)

  useEffect(() => {
    setLoading(true)
    strategiesApi.detail(strategyId)
      .then(d => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [strategyId])

  const handleToggle = async () => {
    if (!detail) return
    setToggling(true)
    try {
      await strategiesApi.toggle(detail.id)
      setDetail(prev => prev ? { ...prev, is_active: !prev.is_active } : prev)
    } catch {
      alert('Failed to toggle strategy.')
    } finally {
      setToggling(false)
    }
  }

  const lastSignalAgo = detail?.last_signal_at ? timeAgo(detail.last_signal_at) : null
  const backtestDate  = detail?.last_backtest?.date
    ?? (detail?.last_backtest ? 'Available' : null)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/strategies')}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Strategies
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={<Toggle checked={!!detail?.is_active} onChange={() => {}} />}
            onClick={handleToggle}
            loading={toggling}
            disabled={loading}
          >
            {detail?.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Play size={13} />}
            disabled={loading}
          >
            Run Backtest
          </Button>
        </div>
      </div>

      {/* ── Strategy title ── */}
      <div>
        {loading ? (
          <>
            <Skeleton height={26} className="w-64 mb-2" />
            <Skeleton height={14} className="w-40" />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-text">{detail?.name ?? `Strategy #${strategyId}`}</h1>
              {detail?.symbol && (
                <span className="font-mono text-sm font-semibold text-muted">{detail.symbol}</span>
              )}
              {detail?.symbol && detail?.timeframe && <span className="text-border">·</span>}
              {detail?.timeframe && (
                <Badge variant="neutral">{detail.timeframe}</Badge>
              )}
              {detail != null && (
                <Badge variant={detail.is_active ? 'success' : 'neutral'}>
                  {detail.is_active ? 'Active' : 'Inactive'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted mt-1.5 flex flex-wrap items-center gap-3">
              {lastSignalAgo && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  Last signal {lastSignalAgo}
                </span>
              )}
              {backtestDate && (
                <span className="flex items-center gap-1">
                  <BarChart2 size={11} />
                  Last backtest: {backtestDate}
                </span>
              )}
            </p>
          </>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {TABS.map((t, i) => (
          <Tab key={t} active={activeTab === i} onClick={() => setActiveTab(i)}>
            {t}
          </Tab>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div>
        {activeTab === 0 && <OverviewTab  detail={detail} loading={loading} />}
        {activeTab === 1 && <EquityTab    strategyId={strategyId} />}
        {activeTab === 2 && <SignalsTab   strategyId={strategyId} />}
        {activeTab === 3 && <PnLTab       strategyId={strategyId} />}
      </div>
    </div>
  )
}
