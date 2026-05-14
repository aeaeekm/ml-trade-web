import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ArrowUpRight, ArrowDownRight, Filter, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { tradesApi } from '../api/trades'
import { strategiesApi } from '../api/strategies'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { Table, Thead, Tbody, Th, Tr, Td, TableSkeleton, TableEmpty } from '../components/ui/Table'

export default function TradesPage() {
  const [trades, setTrades]         = useState([])
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // Filters
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [filterStrat, setFilterS] = useState('')
  const [filterDir, setFilterDir] = useState('')

  // Sort
  const [sortCol, setSortCol]     = useState('entry_time')
  const [sortDir, setSortDir]     = useState('desc')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError('')
      try {
        const [t, s] = await Promise.allSettled([tradesApi.list(), strategiesApi.list()])
        if (t.status === 'fulfilled') setTrades(Array.isArray(t.value) ? t.value : [])
        if (s.status === 'fulfilled') setStrategies(Array.isArray(s.value) ? s.value : [])
      } catch {
        setError('Failed to load trades.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    let t = [...trades]
    if (dateFrom) t = t.filter(x => x.entry_time >= dateFrom)
    if (dateTo)   t = t.filter(x => x.entry_time <= dateTo + 'T23:59:59')
    if (filterStrat) t = t.filter(x => x.strategy_id === filterStrat || x.strategy_name === filterStrat)
    if (filterDir)   t = t.filter(x => x.direction === filterDir)
    t.sort((a, b) => {
      const av = a[sortCol] ?? ''
      const bv = b[sortCol] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    return t
  }, [trades, dateFrom, dateTo, filterStrat, filterDir, sortCol, sortDir])

  const summary = useMemo(() => {
    if (!filtered.length) return null
    const wins = filtered.filter(t => t.pnl > 0).length
    const totalPnl = filtered.reduce((s, t) => s + (t.pnl ?? 0), 0)
    const totalPips = filtered.reduce((s, t) => s + (t.pips ?? 0), 0)
    return {
      total: filtered.length,
      winRate: (wins / filtered.length * 100).toFixed(1),
      totalPnl: totalPnl.toFixed(2),
      totalPips: totalPips.toFixed(1),
    }
  }, [filtered])

  const COLS = [
    { key: 'entry_time', label: 'Entry Time' },
    { key: 'symbol',     label: 'Symbol' },
    { key: 'direction',  label: 'Direction' },
    { key: 'entry_price',label: 'Entry' },
    { key: 'exit_price', label: 'Exit' },
    { key: 'pips',       label: 'Pips' },
    { key: 'pnl',        label: 'P&L' },
    { key: 'status',     label: 'Status' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text">Trades</h1>
        <p className="text-sm text-muted mt-1">Full history of executed trades</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-surface border border-border rounded-xl">
        <Filter size={15} className="text-muted mt-auto mb-2.5" />
        <Input label="From Date" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
        <Input label="To Date"   type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className="w-36" />
        <Select label="Strategy" value={filterStrat} onChange={e => setFilterS(e.target.value)}
          placeholder="All strategies"
          options={strategies.map(s => ({ value: s.id, label: s.name }))}
          className="w-44"
        />
        <Select label="Direction" value={filterDir} onChange={e => setFilterDir(e.target.value)}
          placeholder="All directions"
          options={[{ value: 'long', label: 'Long' }, { value: 'short', label: 'Short' }]}
          className="w-36"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
          <AlertCircle size={15} />{error}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Total Trades',  summary.total],
            ['Win Rate',      `${summary.winRate}%`],
            ['Total Pips',    summary.totalPips],
            ['Total P&L',     `$${summary.totalPnl}`, Number(summary.totalPnl) >= 0],
          ].map(([lbl, val, isPositive]) => (
            <div key={lbl} className="p-4 bg-bg border border-border rounded-xl shadow-card">
              <p className="text-xs text-muted uppercase tracking-wide">{lbl}</p>
              <p className={clsx('text-xl font-bold mt-1',
                isPositive === undefined ? 'text-text' :
                isPositive ? 'text-success' : 'text-danger'
              )}>
                {val}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Trades table */}
      <Table>
        <Thead>
          <tr>
            {COLS.map(c => (
              <Th key={c.key} sortable sorted={sortCol === c.key} direction={sortDir} onSort={() => handleSort(c.key)}>
                {c.label}
              </Th>
            ))}
          </tr>
        </Thead>
        {loading ? (
          <TableSkeleton cols={8} rows={8} />
        ) : filtered.length === 0 ? (
          <TableEmpty message="No trades match your filters" cols={8} />
        ) : (
          <Tbody>
            {filtered.map((t, i) => (
              <Tr key={t.id ?? i}>
                <Td muted>
                  {t.entry_time ? format(new Date(t.entry_time), 'MMM d, HH:mm') : '—'}
                </Td>
                <Td><span className="font-mono font-medium text-text">{t.symbol ?? '—'}</span></Td>
                <Td>
                  <div className={clsx('flex items-center gap-1 text-xs font-medium',
                    t.direction === 'long' ? 'text-success' : 'text-danger')}>
                    {t.direction === 'long'
                      ? <ArrowUpRight size={13} />
                      : <ArrowDownRight size={13} />}
                    {(t.direction ?? '—').toUpperCase()}
                  </div>
                </Td>
                <Td muted>{t.entry_price?.toFixed(5) ?? '—'}</Td>
                <Td muted>{t.exit_price?.toFixed(5) ?? '—'}</Td>
                <Td className={clsx(
                  'font-medium',
                  t.pips > 0 ? 'text-success' : t.pips < 0 ? 'text-danger' : 'text-muted'
                )}>
                  {t.pips != null ? (t.pips > 0 ? '+' : '') + t.pips.toFixed(1) : '—'}
                </Td>
                <Td className={clsx(
                  'font-semibold',
                  t.pnl > 0 ? 'text-success' : t.pnl < 0 ? 'text-danger' : 'text-muted'
                )}>
                  {t.pnl != null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : '—'}
                </Td>
                <Td>
                  <Badge variant={
                    t.status === 'open' ? 'blue' :
                    t.status === 'won' || t.status === 'closed_profit' ? 'success' :
                    t.status === 'lost' || t.status === 'closed_loss' ? 'danger' : 'neutral'
                  }>
                    {t.status ?? '—'}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        )}
      </Table>
    </div>
  )
}
