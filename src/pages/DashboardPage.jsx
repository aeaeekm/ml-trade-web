import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  DollarSign, Zap, Target, TrendingUp, Monitor,
  Cpu, Radio, AlertTriangle, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import clsx from 'clsx'
import useAuthStore from '../store/authStore'
import { portfolioApi }  from '../api/portfolio'
import { tradesApi }     from '../api/trades'
import { strategiesApi } from '../api/strategies'
import { mt5AccountsApi} from '../api/mt5accounts'
import { systemApi }     from '../api/system'
import Card              from '../components/ui/Card'
import Badge             from '../components/ui/Badge'
import Skeleton          from '../components/ui/Skeleton'
import StatusDot         from '../components/ui/StatusDot'
import EquityChart       from '../components/charts/EquityChart'
import { Table, Thead, Tbody, Th, Tr, Td, TableSkeleton, TableEmpty } from '../components/ui/Table'

/* ── Demo equity curve ── */
const DEMO_EQUITY = Array.from({ length: 30 }, (_, i) => {
  const base = 10000
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  return {
    date:   date.toISOString().split('T')[0],
    equity: base + Math.round(Math.sin(i * 0.5) * 800 + i * 120 + Math.random() * 200),
  }
})

/* ── Compact KPI card ── */
function KpiCard({ label, value, icon: Icon, delta, deltaLabel, variant, loading }) {
  const colors = {
    default: { icon: 'bg-accent/10 text-accent' },
    success: { icon: 'bg-success/10 text-success' },
    danger:  { icon: 'bg-danger/10  text-danger'  },
    warning: { icon: 'bg-warning/10 text-warning'  },
  }
  const c = colors[variant] ?? colors.default

  return (
    <div className="bg-bg border border-border rounded-xl p-4 shadow-card flex items-center gap-3">
      <div className={clsx('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', c.icon)}>
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted uppercase tracking-wide truncate">{label}</p>
        {loading ? (
          <Skeleton height={20} className="w-20 mt-1" />
        ) : (
          <p className="text-lg font-bold text-text leading-tight">{value ?? '—'}</p>
        )}
        {delta != null && !loading && (
          <p className={clsx('text-[11px] mt-0.5 flex items-center gap-0.5',
            delta >= 0 ? 'text-success' : 'text-danger')}>
            {delta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(delta).toFixed(1)}%
            {deltaLabel && <span className="text-muted ml-0.5">{deltaLabel}</span>}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Server status bar ── */
function toStatus(val) {
  if (val === true  || val === 'online'  || val === 'connected') return 'online'
  if (val === false || val === 'offline' || val === 'down')      return 'offline'
  if (val === 'warning' || val === 'degraded')                   return 'warning'
  return 'unknown'
}

function formatHb(ts) {
  if (!ts) return null
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

function ServerStatusBar({ sysStatus }) {
  const hb = formatHb(sysStatus?.last_heartbeat)
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2 rounded-xl
                    bg-surface border border-border text-xs">
      <StatusDot status={toStatus(sysStatus?.signal_server)}  label="Signal Server"  />
      <StatusDot status={toStatus(sysStatus?.api_server)}     label="API Server"     />
      <StatusDot status={toStatus(sysStatus?.mt5_connector)}  label="MT5 Connector"  />
      {hb && (
        <span className="text-muted">
          Last heartbeat: <span className="text-text font-medium">{hb}</span>
        </span>
      )}
      {sysStatus?.active_eas != null && (
        <span className="text-muted">
          Active EAs: <span className="text-text font-medium">{sysStatus.active_eas}</span>
        </span>
      )}
    </div>
  )
}

/* ─── Page ─── */
export default function DashboardPage() {
  const { user } = useAuthStore()

  const [summary,    setSummary]    = useState(null)
  const [signals,    setSignals]    = useState([])
  const [strategies, setStrategies] = useState([])
  const [accounts,   setAccounts]   = useState([])
  const [sysStatus,  setSysStatus]  = useState(null)
  const [equity,     setEquity]     = useState([])
  const [loading,    setLoading]    = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [sum, sigs, strats, accs, sys] = await Promise.allSettled([
          portfolioApi.summary(),
          tradesApi.signals(),
          strategiesApi.list(),
          mt5AccountsApi.list(),
          systemApi.status(),
        ])
        if (sum.status    === 'fulfilled') setSummary(sum.value)
        if (sigs.status   === 'fulfilled') setSignals(Array.isArray(sigs.value) ? sigs.value.slice(0, 8) : [])
        if (strats.status === 'fulfilled') setStrategies(Array.isArray(strats.value) ? strats.value.slice(0, 5) : [])
        if (accs.status   === 'fulfilled') setAccounts(Array.isArray(accs.value) ? accs.value : [])
        if (sys.status    === 'fulfilled') setSysStatus(sys.value)

        if (sum.status === 'fulfilled' && sum.value?.equity_curve?.length) {
          setEquity(sum.value.equity_curve)
        } else {
          setEquity(DEMO_EQUITY)
        }
      } catch {}
      finally { setLoading(false) }
    }
    fetchAll()
    const id = setInterval(() => systemApi.status().then(setSysStatus), 30_000)
    return () => clearInterval(id)
  }, [])

  // Derived values
  const activeStrategies = summary?.active_strategies
    ?? strategies.filter(s => s.is_active).length
  const openSignals      = summary?.open_signals
    ?? signals.filter(s => s.status === 'open').length
  const mt5Online        = accounts.filter(a => a.enabled && a.ea_status !== 'stopped').length
  const eaRunning        = accounts.filter(a => a.ea_status === 'running').length
  const todaySignals     = summary?.today_signals    ?? signals.length
  const failedExec       = summary?.failed_executions ?? 0

  /* Row 1 */
  const kpiRow1 = [
    {
      label: 'Total P&L',
      value: summary?.total_pnl != null
        ? `$${summary.total_pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : '$0.00',
      delta: summary?.pnl_change_pct,
      deltaLabel: 'vs last month',
      icon: DollarSign,
      variant: summary?.total_pnl >= 0 ? 'success' : 'danger',
    },
    {
      label: 'Win Rate',
      value: `${(summary?.avg_win_rate ?? 0).toFixed(1)}%`,
      delta: summary?.win_rate_change,
      icon: Target,
      variant: 'default',
    },
    {
      label: 'Active Strategies',
      value: activeStrategies,
      icon: Zap,
      variant: 'default',
    },
    {
      label: 'Open Signals',
      value: openSignals,
      icon: Radio,
      variant: openSignals > 0 ? 'success' : 'default',
    },
  ]

  /* Row 2 */
  const kpiRow2 = [
    {
      label: 'MT5 Accounts Online',
      value: `${mt5Online} / ${accounts.length}`,
      icon: Monitor,
      variant: mt5Online > 0 ? 'success' : 'default',
    },
    {
      label: 'EA Running',
      value: eaRunning,
      icon: Cpu,
      variant: eaRunning > 0 ? 'success' : 'default',
    },
    {
      label: "Today's Signals",
      value: todaySignals,
      icon: TrendingUp,
      variant: 'default',
    },
    {
      label: 'Failed Executions',
      value: failedExec,
      icon: AlertTriangle,
      variant: failedExec > 0 ? 'danger' : 'default',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">
          {greeting}, {user?.email?.split('@')[0] ?? 'Trader'}
        </h1>
        <p className="text-sm text-muted mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Server status bar */}
      <ServerStatusBar sysStatus={sysStatus} />

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiRow1.map(k => (
          <KpiCard key={k.label} {...k} loading={loading} />
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiRow2.map(k => (
          <KpiCard key={k.label} {...k} loading={loading} />
        ))}
      </div>

      {/* Equity chart */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-sm font-semibold text-text">Equity Curve</h3>
              <p className="text-xs text-muted mt-0.5">Portfolio value over time</p>
            </div>
            <Badge variant="blue">30d</Badge>
          </div>
        }
        noPadding
      >
        <div className="px-5 pt-2 pb-5">
          <EquityChart data={equity} />
        </div>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent signals */}
        <div className="lg:col-span-3">
          <Card header="Recent Signals" noPadding>
            <Table>
              <Thead>
                <tr>
                  <Th>Symbol</Th>
                  <Th>Direction</Th>
                  <Th>Confidence</Th>
                  <Th>Status</Th>
                  <Th>Time</Th>
                </tr>
              </Thead>
              {loading ? (
                <TableSkeleton cols={5} rows={5} />
              ) : signals.length === 0 ? (
                <TableEmpty message="No signals yet" cols={5} />
              ) : (
                <Tbody>
                  {signals.map((sig, i) => (
                    <Tr key={sig.id ?? i}>
                      <Td>
                        <span className="font-mono font-medium text-text">{sig.symbol ?? 'EURUSD'}</span>
                      </Td>
                      <Td>
                        <div className={clsx('flex items-center gap-1 text-xs font-medium',
                          sig.direction === 'long' ? 'text-success' : 'text-danger')}>
                          {sig.direction === 'long'
                            ? <ArrowUpRight size={13} />
                            : <ArrowDownRight size={13} />}
                          {(sig.direction ?? 'LONG').toUpperCase()}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full"
                              style={{ width: `${(sig.confidence ?? 0.7) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted">
                            {((sig.confidence ?? 0.7) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <Badge variant={
                          sig.status === 'open'   ? 'blue'    :
                          sig.status === 'closed' ? 'neutral' :
                          sig.status === 'won'    ? 'success' : 'danger'
                        }>
                          {sig.status ?? 'open'}
                        </Badge>
                      </Td>
                      <Td muted>
                        {sig.created_at
                          ? format(new Date(sig.created_at), 'MMM d HH:mm')
                          : '—'}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              )}
            </Table>
          </Card>
        </div>

        {/* Active strategies */}
        <div className="lg:col-span-2">
          <Card header="Active Strategies" className="h-full">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-surface rounded-lg animate-skeleton" />
                ))}
              </div>
            ) : strategies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted text-sm gap-2">
                <Zap size={24} className="text-border" />
                <p>No strategies yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {strategies.map((s, i) => (
                  <div
                    key={s.id ?? i}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border"
                  >
                    <div>
                      <p className="text-sm font-medium text-text">{s.name ?? `Strategy ${i + 1}`}</p>
                      <p className="text-xs text-muted mt-0.5">{s.symbol ?? 'EURUSD'} · {s.timeframe ?? 'H1'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={s.is_active ? 'success' : 'neutral'}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {s.last_win_rate != null && (
                        <span className="text-xs text-muted">WR {(s.last_win_rate * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
