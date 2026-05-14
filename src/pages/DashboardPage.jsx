import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { DollarSign, Zap, Target, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { portfolioApi } from '../api/portfolio'
import { tradesApi } from '../api/trades'
import { strategiesApi } from '../api/strategies'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EquityChart from '../components/charts/EquityChart'
import { Table, Thead, Tbody, Th, Tr, Td, TableSkeleton, TableEmpty } from '../components/ui/Table'
import clsx from 'clsx'

// Demo equity data to show when API returns empty
const DEMO_EQUITY = Array.from({ length: 30 }, (_, i) => {
  const base = 10000
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  return {
    date: date.toISOString().split('T')[0],
    equity: base + Math.round(Math.sin(i * 0.5) * 800 + i * 120 + Math.random() * 200),
  }
})

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [summary, setSummary]       = useState(null)
  const [signals, setSignals]       = useState([])
  const [strategies, setStrategies] = useState([])
  const [equity, setEquity]         = useState([])
  const [loading, setLoading]       = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [sum, sigs, strats] = await Promise.allSettled([
          portfolioApi.summary(),
          tradesApi.signals(),
          strategiesApi.list(),
        ])
        if (sum.status === 'fulfilled') setSummary(sum.value)
        if (sigs.status === 'fulfilled') setSignals(Array.isArray(sigs.value) ? sigs.value.slice(0, 8) : [])
        if (strats.status === 'fulfilled') setStrategies(Array.isArray(strats.value) ? strats.value.slice(0, 5) : [])

        // Build equity curve from summary or use demo
        if (sum.status === 'fulfilled' && sum.value?.equity_curve?.length) {
          setEquity(sum.value.equity_curve)
        } else {
          setEquity(DEMO_EQUITY)
        }
      } catch {}
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const stats = [
    {
      label: 'Total P&L',
      value: summary?.total_pnl != null
        ? `$${summary.total_pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : loading ? '…' : '$0.00',
      delta: summary?.pnl_change_pct,
      icon: DollarSign,
      deltaLabel: 'vs last month',
    },
    {
      label: 'Active Strategies',
      value: loading ? '…' : (summary?.active_strategies ?? strategies.filter(s => s.is_active).length ?? 0),
      icon: Zap,
    },
    {
      label: 'Avg Win Rate',
      value: loading ? '…' : `${(summary?.avg_win_rate ?? 0).toFixed(1)}%`,
      delta: summary?.win_rate_change,
      icon: Target,
      deltaLabel: 'vs last period',
    },
    {
      label: 'Open Signals',
      value: loading ? '…' : (summary?.open_signals ?? signals.filter(s => s.status === 'open').length ?? signals.length),
      icon: TrendingUp,
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

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
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
                      <Td><span className="font-mono font-medium text-text">{sig.symbol ?? 'EURUSD'}</span></Td>
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
                          <span className="text-xs text-muted">{((sig.confidence ?? 0.7) * 100).toFixed(0)}%</span>
                        </div>
                      </Td>
                      <Td>
                        <Badge variant={
                          sig.status === 'open' ? 'blue' :
                          sig.status === 'closed' ? 'neutral' :
                          sig.status === 'won' ? 'success' : 'danger'
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
                {[1,2,3].map(i => (
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
                  <div key={s.id ?? i} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
                    <div>
                      <p className="text-sm font-medium text-text">{s.name ?? `Strategy ${i+1}`}</p>
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
