import { useEffect, useState, useCallback, useRef } from 'react'
import { Brain, Play, RefreshCw, AlertCircle, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { modelsApi } from '../api/models'
import { strategiesApi } from '../api/strategies'
import { displayName } from '../utils/strategyDisplay'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Pagination from '../components/ui/Pagination'
import { Table, Thead, Tbody, Th, Tr, Td, TableSkeleton, TableEmpty } from '../components/ui/Table'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import useThemeStore from '../store/themeStore'
import clsx from 'clsx'

/* ── Feature importance chart ── */
function FeatureImportanceChart({ features }) {
  const { isDark } = useThemeStore()
  const accentColor = isDark ? '#3B82F6' : '#2563EB'
  const gridColor = isDark ? '#2A2F3A' : '#E5E7EB'

  const data = (features ?? [])
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10)
    .map(f => ({ name: f.feature ?? f.name, value: f.importance ?? f.value ?? 0 }))

  if (!data.length) return (
    <p className="text-sm text-muted text-center py-6">No feature importance data available.</p>
  )

  return (
    <ResponsiveContainer width="100%" height={data.length * 36}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 80 }}>
        <CartesianGrid horizontal={false} stroke={gridColor} strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#6B7280' }} axisLine={false} tickLine={false} width={76} />
        <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={accentColor} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Sortable column header helper ── */
function SortTh({ col, currentCol, dir, onSort, children }) {
  const active = currentCol === col
  return (
    <Th
      sortable
      sorted={active}
      direction={dir}
      onSort={() => onSort(col)}
    >
      {children}
    </Th>
  )
}

/* ── Main page ── */
export default function ModelsPage() {
  // Data
  const [models,     setModels]     = useState([])
  const [strategies, setStrategies] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [training,   setTraining]   = useState({})
  const [error,      setError]      = useState('')
  const [selected,   setSelected]   = useState(null)

  // Pagination
  const [page,       setPage]       = useState(1)
  const [pageSize,   setPageSize]   = useState(25)
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Filters
  const [search,    setSearch]    = useState('')
  const [sortBy,    setSortBy]    = useState('trained_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Debounce search
  const searchTimer = useRef(null)

  const fetchModels = useCallback(async (opts = {}) => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page:       opts.page      ?? page,
        page_size:  opts.pageSize  ?? pageSize,
        search:     opts.search    !== undefined ? opts.search    : search,
        sort_by:    opts.sortBy    ?? sortBy,
        sort_order: opts.sortOrder ?? sortOrder,
      }
      // Remove empty search
      if (!params.search) delete params.search

      const [res, s] = await Promise.allSettled([
        modelsApi.list(params),
        strategiesApi.list(),
      ])

      if (res.status === 'fulfilled') {
        const val = res.value
        // Support both paginated { data, pagination } and plain array
        if (val && val.data && val.pagination) {
          setModels(val.data)
          setTotal(val.pagination.total)
          setTotalPages(val.pagination.total_pages)
        } else if (Array.isArray(val)) {
          setModels(val)
          setTotal(val.length)
          setTotalPages(1)
        } else {
          setModels([])
          setTotal(0)
          setTotalPages(0)
        }
      } else {
        setError('Failed to load models.')
        setModels([])
      }

      if (s.status === 'fulfilled') setStrategies(Array.isArray(s.value) ? s.value : [])
    } catch {
      setError('Failed to load models.')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, sortBy, sortOrder])

  // Initial fetch
  useEffect(() => {
    fetchModels()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortOrder])

  // Debounced search re-fetch
  const handleSearchChange = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchModels({ page: 1, search: val })
    }, 350)
  }

  const handleSort = (col) => {
    const newOrder = sortBy === col && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(col)
    setSortOrder(newOrder)
    setPage(1)
  }

  const handlePage = (p) => setPage(p)

  const handlePageSize = (ps) => {
    setPageSize(ps)
    setPage(1)
  }

  const handleTrain = async (strategyId) => {
    setTraining(t => ({ ...t, [strategyId]: true }))
    try {
      await modelsApi.train(strategyId)
      await fetchModels()
    } catch (err) {
      setError(`Training failed: ${err?.response?.data?.detail || 'Unknown error'}`)
    } finally {
      setTraining(t => ({ ...t, [strategyId]: false }))
    }
  }

  const selectedModel = selected != null
    ? models.find(m => m.id === selected) ?? null
    : null

  const paginationProps = {
    page,
    totalPages,
    total,
    pageSize,
    onPage: handlePage,
    onPageSize: handlePageSize,
    pageSizeOptions: [10, 25, 50, 100],
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">ML Models</h1>
          <p className="text-sm text-muted mt-1">Train and monitor your machine learning models</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={() => fetchModels()} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Models table */}
        <div className="xl:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search strategy name…"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                className={clsx(
                  'w-full bg-bg border border-border rounded-lg text-sm text-text placeholder:text-muted',
                  'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors',
                  'pl-9 pr-3.5 py-2.5',
                )}
              />
            </div>
          </div>

          {/* Top pagination */}
          {total > 0 && (
            <Pagination {...paginationProps} />
          )}

          <Table>
            <Thead>
              <tr>
                <Th>Strategy</Th>
                <SortTh col="accuracy"   currentCol={sortBy} dir={sortOrder} onSort={handleSort}>Accuracy</SortTh>
                <Th>Precision</Th>
                <Th>Recall</Th>
                <Th>F1</Th>
                <Th>Samples</Th>
                <SortTh col="trained_at" currentCol={sortBy} dir={sortOrder} onSort={handleSort}>Trained</SortTh>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </Thead>
            {loading ? (
              <TableSkeleton cols={9} rows={5} />
            ) : models.length === 0 ? (
              <TableEmpty
                message="No model training data found. Run a backtest first, then train a model."
                cols={9}
              />
            ) : (
              <Tbody>
                {models.map((m) => (
                  <Tr
                    key={m.id}
                    onClick={() => setSelected(m.id === selected ? null : m.id)}
                    className={clsx(m.id === selected && 'bg-accent/5')}
                  >
                    <Td>
                      <div>
                        <span className="font-medium text-text">
                          {m.display_name || m.strategy_nickname || m.strategy_name || m.strategy_id || '—'}
                        </span>
                        {m.strategy_code && (
                          <span className="block text-[10px] font-mono text-muted mt-0.5">{m.strategy_code}</span>
                        )}
                      </div>
                    </Td>
                    <Td>{m.accuracy != null ? `${(m.accuracy * 100).toFixed(1)}%` : '—'}</Td>
                    <Td>{m.precision_score != null ? `${(m.precision_score * 100).toFixed(1)}%` : (m.precision != null ? `${(m.precision * 100).toFixed(1)}%` : '—')}</Td>
                    <Td>{m.recall_score != null ? `${(m.recall_score * 100).toFixed(1)}%` : (m.recall != null ? `${(m.recall * 100).toFixed(1)}%` : '—')}</Td>
                    <Td>{m.f1_score != null ? `${(m.f1_score * 100).toFixed(1)}%` : '—'}</Td>
                    <Td muted>{(m.training_samples ?? m.sample_count)?.toLocaleString() ?? '—'}</Td>
                    <Td muted>{m.trained_at ? format(new Date(m.trained_at), 'MMM d, yyyy') : '—'}</Td>
                    <Td>
                      <Badge variant={m.is_active ? 'success' : 'neutral'}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={!!training[m.strategy_id]}
                        icon={<Play size={12} />}
                        onClick={(e) => { e.stopPropagation(); handleTrain(m.strategy_id) }}
                      >
                        Train
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            )}
          </Table>

          {/* Bottom pagination */}
          {total > 0 && (
            <Pagination {...paginationProps} />
          )}

          {/* Train unmodeled strategies */}
          {!loading && strategies.filter(s => !models.find(m => m.strategy_id === s.id)).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Train new strategies</p>
              <div className="flex flex-wrap gap-2">
                {strategies.filter(s => !models.find(m => m.strategy_id === s.id)).map(s => (
                  <Button
                    key={s.id}
                    size="sm"
                    variant="secondary"
                    loading={!!training[s.id]}
                    icon={<Play size={12} />}
                    onClick={() => handleTrain(s.id)}
                  >
                    Train &ldquo;{displayName(s)}&rdquo;
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feature importance panel */}
        <div>
          <Card header="Feature Importance" className="h-full">
            {!selectedModel ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <Brain size={32} className="text-border" />
                <p className="text-sm text-muted">Click a model row to see feature importance</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-text">
                    {selectedModel.display_name || selectedModel.strategy_name || 'Model'}
                  </p>
                  <p className="text-xs text-muted">Top predictive features</p>
                </div>
                <FeatureImportanceChart features={selectedModel.feature_importance} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
