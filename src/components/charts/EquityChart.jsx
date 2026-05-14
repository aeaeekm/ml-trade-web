import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'
import useThemeStore from '../../store/themeStore'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const prev = payload[0]?.payload?.prev ?? val
  const change = val - prev
  const pct = prev !== 0 ? ((change / prev) * 100).toFixed(2) : '0.00'

  return (
    <div className="bg-bg border border-border rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="text-muted text-xs mb-1">
        {label ? (() => { try { return format(parseISO(label), 'MMM d, yyyy') } catch { return label } })() : ''}
      </p>
      <p className="font-semibold text-text">${val?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      <p className={change >= 0 ? 'text-success text-xs' : 'text-danger text-xs'}>
        {change >= 0 ? '+' : ''}{change.toFixed(2)} ({pct}%)
      </p>
    </div>
  )
}

export default function EquityChart({ data = [] }) {
  const { isDark } = useThemeStore()
  const accentColor = isDark ? '#3B82F6' : '#2563EB'
  const gridColor = isDark ? '#2A2F3A' : '#E5E7EB'

  const formatted = data.map((d, i) => ({
    ...d,
    prev: i > 0 ? data[i - 1].equity ?? data[i - 1].value : d.equity ?? d.value,
    equity: d.equity ?? d.value ?? 0,
  }))

  if (!formatted.length) {
    return (
      <div className="h-56 flex items-center justify-center text-muted text-sm">
        No equity data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={accentColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="equity"
          stroke={accentColor}
          strokeWidth={2}
          fill="url(#equityGradient)"
          dot={false}
          activeDot={{ r: 4, fill: accentColor, strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
