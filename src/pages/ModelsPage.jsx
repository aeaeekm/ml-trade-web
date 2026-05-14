import { useEffect, useState } from 'react'
import { Brain, Play, RefreshCw, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { modelsApi } from '../api/models'
import { strategiesApi } from '../api/strategies'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Table, Thead, Tbody, Th, Tr, Td, TableSkeleton, TableEmpty } from '../components/ui/Table'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import useThemeStore from '../store/themeStore'

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

export default function ModelsPage() {
  const [models, setModels]       = useState([])
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading]     = useState(true)
  const [training, setTraining]   = useState({})
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState(null)

  const fetchModels = async () => {
    setLoading(true)
    setError('')
    try {
      const [m, s] = await Promise.allSettled([modelsApi.list(), strategiesApi.list()])
      if (m.status === 'fulfilled') setModels(Array.isArray(m.value) ? m.value : [])
      if (s.status === 'fulfilled') setStrategies(Array.isArray(s.value) ? s.value : [])
    } catch {
      setError('Failed to load models.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchModels() }, [])

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

  const selectedModel = selected != null ? models[selected] : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">ML Models</h1>
          <p className="text-sm text-muted mt-1">Train and monitor your machine learning models</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={fetchModels} loading={loading}>
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
        <div className="xl:col-span-2">
          <Table>
            <Thead>
              <tr>
                <Th>Strategy</Th>
                <Th>Accuracy</Th>
                <Th>Precision</Th>
                <Th>Recall</Th>
                <Th>F1</Th>
                <Th>Samples</Th>
                <Th>Trained</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </Thead>
            {loading ? (
              <TableSkeleton cols={9} rows={5} />
            ) : models.length === 0 ? (
              <TableEmpty message="No models trained yet" cols={9} />
            ) : (
              <Tbody>
                {models.map((m, i) => (
                  <Tr key={m.id ?? i} onClick={() => setSelected(i === selected ? null : i)}>
                    <Td><span className="font-medium text-text">{m.strategy_name ?? m.strategy_id ?? '—'}</span></Td>
                    <Td>{m.accuracy != null ? `${(m.accuracy * 100).toFixed(1)}%` : '—'}</Td>
                    <Td>{m.precision != null ? `${(m.precision * 100).toFixed(1)}%` : '—'}</Td>
                    <Td>{m.recall != null ? `${(m.recall * 100).toFixed(1)}%` : '—'}</Td>
                    <Td>{m.f1_score != null ? `${(m.f1_score * 100).toFixed(1)}%` : '—'}</Td>
                    <Td muted>{m.sample_count?.toLocaleString() ?? '—'}</Td>
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
                    Train "{s.name}"
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
                  <p className="text-sm font-semibold text-text">{selectedModel.strategy_name ?? 'Model'}</p>
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
