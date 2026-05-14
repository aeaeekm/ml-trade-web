import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import useThemeStore from '../../store/themeStore'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-bg border border-border rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="text-muted text-xs mb-1">
        {label ? (() => { try { return format(parseISO(label), 'MMM d, yyyy') } catch { return label } })() : ''}
      </p>
      <p className={clsx('font-semibold', val >= 0 ? 'text-success' : 'text-danger')}>
        {val >= 0 ? '+' : ''}{val?.toFixed(2)} pips
      </p>
    </div>
  )
}

export default function PnLBarChart({ data = [] }) {
  const { isDark } = useThemeStore()
  const gridColor = isDark ? '#2A2F3A' : '#E5E7EB'
  const successColor = isDark ? '#34D399' : '#10B981'
  const dangerColor  = isDark ? '#F87171' : '#EF4444'

  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-muted text-sm">
        No P&L data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#6B7280' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => { try { return format(parseISO(v), 'MMM d') } catch { return v } }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#6B7280' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}`}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? successColor : dangerColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
