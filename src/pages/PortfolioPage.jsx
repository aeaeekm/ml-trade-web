import { useEffect, useState } from 'react'
import { AlertCircle, TrendingDown, BarChart2, Wallet, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { portfolioApi } from '../api/portfolio'
import { brokersApi } from '../api/brokers'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Table, Thead, Tbody, Th, Tr, Td, TableSkeleton, TableEmpty } from '../components/ui/Table'
import DrawdownChart from '../components/charts/DrawdownChart'

function AccountCard({ account }) {
  const equity = account.equity ?? account.balance ?? 0
  const balance = account.balance ?? 0
  const freeMargin = account.free_margin ?? account.margin_free ?? 0
  const ddPct = account.drawdown_pct ?? 0

  return (
    <div className="bg-bg border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">
            {account.broker_name ?? 'Account'}
          </p>
          <p className="text-sm font-semibold text-text mt-0.5">
            {account.login ?? account.account_number ?? `#${account.id}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={account.account_type === 'demo' ? 'warning' : 'success'}>
            {account.account_type ?? 'live'}
          </Badge>
          <Badge variant={account.currency === 'USD' ? 'blue' : 'neutral'}>
            {account.currency ?? 'USD'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ['Balance', `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
          ['Equity',  `$${equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
          ['Free Margin', `$${freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ].map(([lbl, val]) => (
          <div key={lbl} className="p-3 rounded-lg bg-surface">
            <p className="text-[10px] text-muted uppercase tracking-wide">{lbl}</p>
            <p className="text-sm font-bold text-text mt-0.5">{val}</p>
          </div>
        ))}
      </div>

      {ddPct > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-border rounded-full">
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                ddPct > 20 ? 'bg-danger' : ddPct > 10 ? 'bg-warning' : 'bg-success'
              )}
              style={{ width: `${Math.min(ddPct, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted">{ddPct.toFixed(1)}% DD</span>
        </div>
      )}
    </div>
  )
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null)
  const [accounts, setAccounts]  = useState([])
  const [loading, setLoading]    = useState(true)
  const [error, setError]        = useState('')

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [p, a] = await Promise.allSettled([portfolioApi.get(), brokersApi.mt5Accounts()])
      if (p.status === 'fulfilled') setPortfolio(p.value)
      if (a.status === 'fulfilled') setAccounts(Array.isArray(a.value) ? a.value : [])
    } catch {
      setError('Failed to load portfolio data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const positions = portfolio?.open_positions ?? portfolio?.positions ?? []
  const riskMetrics = portfolio?.risk_metrics ?? {}
  const ddCurve = portfolio?.drawdown_curve ?? []
  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0)
  const totalEquity = accounts.reduce((s, a) => s + (a.equity ?? a.balance ?? 0), 0)
  const exposure = riskMetrics.exposure_pct ?? portfolio?.exposure_pct ?? 0
  const maxDD = riskMetrics.max_drawdown ?? portfolio?.max_drawdown ?? 0
  const currentDD = riskMetrics.current_drawdown ?? portfolio?.current_drawdown ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Portfolio</h1>
          <p className="text-sm text-muted mt-1">Live account overview and risk metrics</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={fetchAll} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
          <AlertCircle size={15} />{error}
        </div>
      )}

      {/* Account cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Accounts</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2].map(i => (
              <div key={i} className="bg-bg border border-border rounded-xl p-5 h-40 animate-skeleton" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-surface border border-border rounded-xl">
            <Wallet size={28} className="text-border mb-3" />
            <p className="text-sm text-muted">No broker accounts connected.</p>
            <p className="text-xs text-muted mt-1">Go to Settings to add a broker account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map((a, i) => <AccountCard key={a.id ?? i} account={a} />)}
          </div>
        )}
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card header={
          <div className="flex items-center gap-2 w-full">
            <BarChart2 size={15} className="text-muted" />
            <h3 className="text-sm font-semibold text-text">Risk Metrics</h3>
          </div>
        }>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-surface rounded animate-skeleton" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                {
                  label: 'Exposure',
                  value: `${exposure.toFixed(1)}%`,
                  color: exposure > 80 ? 'bg-danger' : exposure > 50 ? 'bg-warning' : 'bg-success',
                  pct: exposure,
                },
                {
                  label: 'Max Drawdown',
                  value: `${(maxDD * 100).toFixed(1)}%`,
                  color: maxDD > 0.2 ? 'bg-danger' : maxDD > 0.1 ? 'bg-warning' : 'bg-success',
                  pct: maxDD * 100,
                },
                {
                  label: 'Current Drawdown',
                  value: `${(currentDD * 100).toFixed(1)}%`,
                  color: currentDD > 0.15 ? 'bg-danger' : currentDD > 0.07 ? 'bg-warning' : 'bg-success',
                  pct: currentDD * 100,
                },
              ].map(({ label, value, color, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted">{label}</span>
                    <span className="font-semibold text-text">{value}</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full transition-all duration-500', color)}
                      style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-border grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface rounded-lg">
                  <p className="text-[10px] text-muted uppercase tracking-wide">Total Balance</p>
                  <p className="text-base font-bold text-text mt-0.5">
                    ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 bg-surface rounded-lg">
                  <p className="text-[10px] text-muted uppercase tracking-wide">Total Equity</p>
                  <p className={clsx('text-base font-bold mt-0.5', totalEquity >= totalBalance ? 'text-success' : 'text-danger')}>
                    ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Drawdown chart */}
        <Card header={
          <div className="flex items-center gap-2 w-full">
            <TrendingDown size={15} className="text-muted" />
            <h3 className="text-sm font-semibold text-text">Drawdown History</h3>
          </div>
        }>
          <DrawdownChart data={ddCurve} />
        </Card>
      </div>

      {/* Open positions */}
      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Open Positions</h2>
        <Table>
          <Thead>
            <tr>
              <Th>Symbol</Th>
              <Th>Direction</Th>
              <Th>Volume</Th>
              <Th>Open Price</Th>
              <Th>Current Price</Th>
              <Th>Pips</Th>
              <Th>Unrealized P&L</Th>
              <Th>Account</Th>
            </tr>
          </Thead>
          {loading ? (
            <TableSkeleton cols={8} rows={4} />
          ) : positions.length === 0 ? (
            <TableEmpty message="No open positions" cols={8} />
          ) : (
            <Tbody>
              {positions.map((p, i) => (
                <Tr key={p.id ?? i}>
                  <Td><span className="font-mono font-medium text-text">{p.symbol}</span></Td>
                  <Td>
                    <Badge variant={p.type === 'buy' || p.direction === 'long' ? 'success' : 'danger'}>
                      {p.type === 'buy' || p.direction === 'long' ? 'BUY' : 'SELL'}
                    </Badge>
                  </Td>
                  <Td>{p.volume ?? p.lots ?? '—'}</Td>
                  <Td muted>{p.open_price?.toFixed(5) ?? p.entry_price?.toFixed(5) ?? '—'}</Td>
                  <Td muted>{p.current_price?.toFixed(5) ?? '—'}</Td>
                  <Td className={clsx('font-medium', (p.pips ?? 0) >= 0 ? 'text-success' : 'text-danger')}>
                    {p.pips != null ? `${p.pips >= 0 ? '+' : ''}${p.pips.toFixed(1)}` : '—'}
                  </Td>
                  <Td className={clsx('font-semibold', (p.profit ?? p.pnl ?? 0) >= 0 ? 'text-success' : 'text-danger')}>
                    {(p.profit ?? p.pnl) != null
                      ? `${(p.profit ?? p.pnl) >= 0 ? '+' : ''}$${(p.profit ?? p.pnl).toFixed(2)}`
                      : '—'}
                  </Td>
                  <Td muted>{p.account_id ?? '—'}</Td>
                </Tr>
              ))}
            </Tbody>
          )}
        </Table>
      </div>
    </div>
  )
}
