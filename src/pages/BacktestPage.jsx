import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, Play, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { backtestApi } from '../api/backtest'
import { strategiesApi } from '../api/strategies'
import { brokersApi } from '../api/brokers'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { Table, Thead, Tbody, Th, Tr, Td, TableSkeleton, TableEmpty } from '../components/ui/Table'
import EquityChart from '../components/charts/EquityChart'

const TABS = ['Run', 'History', 'Analytics']

const statusIcon = { completed: CheckCircle, running: Clock, failed: XCircle, pending: Clock }
const statusVariant = { completed: 'success', running: 'blue', failed: 'danger', pending: 'warning' }

function RunTab({ strategies, accounts }) {
  const [form, setForm] = useState({
    strategy_id: '', broker_account_id: '', start_date: '', end_date: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')

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
            options={strategies.map(s => ({ value: s.id, label: s.name }))}
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
                ['Total Trades', result.total_trades ?? '—'],
                ['Win Rate',     result.win_rate != null ? `${(result.win_rate * 100).toFixed(1)}%` : '—'],
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

function HistoryTab({ strategies }) {
  const [runs, setRuns]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [expandedId, setExpanded] = useState(null)
  const [filterStrat, setFilter]  = useState('')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await backtestApi.getRuns(filterStrat || undefined)
        setRuns(Array.isArray(data) ? data : [])
      } catch {}
      finally { setLoading(false) }
    }
    fetch()
  }, [filterStrat])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={filterStrat}
          onChange={e => setFilter(e.target.value)}
          placeholder="All strategies"
          options={strategies.map(s => ({ value: s.id, label: s.name }))}
          className="w-56"
        />
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Date</Th>
            <Th>Strategy</Th>
            <Th>Trades</Th>
            <Th>Win Rate</Th>
            <Th>Max DD</Th>
            <Th>Profit Factor</Th>
            <Th>Status</Th>
            <Th></Th>
          </tr>
        </Thead>
        {loading ? (
          <TableSkeleton cols={8} rows={5} />
        ) : runs.length === 0 ? (
          <TableEmpty message="No backtest runs yet" cols={8} />
        ) : (
          <Tbody>
            {runs.map((run) => {
              const isExpanded = expandedId === run.id
              const SIcon = statusIcon[run.status] ?? Clock
              return (
                <>
                  <Tr key={run.id} onClick={() => setExpanded(isExpanded ? null : run.id)}>
                    <Td muted>{run.created_at ? format(new Date(run.created_at), 'MMM d, HH:mm') : '—'}</Td>
                    <Td><span className="font-medium text-text">{run.strategy_name ?? run.strategy_id ?? '—'}</span></Td>
                    <Td>{run.total_trades ?? '—'}</Td>
                    <Td>{run.win_rate != null ? `${(run.win_rate * 100).toFixed(1)}%` : '—'}</Td>
                    <Td className={run.max_drawdown > 0.2 ? 'text-danger' : ''}>
                      {run.max_drawdown != null ? `${(run.max_drawdown * 100).toFixed(1)}%` : '—'}
                    </Td>
                    <Td>{run.profit_factor?.toFixed(2) ?? '—'}</Td>
                    <Td>
                      <Badge variant={statusVariant[run.status] ?? 'neutral'}>
                        <SIcon size={10} className="mr-1" />{run.status ?? 'unknown'}
                      </Badge>
                    </Td>
                    <Td>{isExpanded ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}</Td>
                  </Tr>
                  {isExpanded && (
                    <tr key={`${run.id}-detail`}>
                      <td colSpan={8} className="px-4 py-4 bg-surface">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          {run.equity_curve?.length ? (
                            <EquityChart data={run.equity_curve} />
                          ) : (
                            <p className="text-sm text-muted text-center py-4">No equity curve data available for this run.</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            {[
                              ['Net PnL', run.net_pnl != null ? `$${run.net_pnl.toFixed(2)}` : '—'],
                              ['Sharpe', run.sharpe_ratio?.toFixed(2) ?? '—'],
                              ['Start Date', run.start_date ?? '—'],
                              ['End Date', run.end_date ?? '—'],
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
    </div>
  )
}

export default function BacktestPage() {
  const [tab, setTab]             = useState(0)
  const [strategies, setStrategies] = useState([])
  const [accounts, setAccounts]   = useState([])

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
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
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
