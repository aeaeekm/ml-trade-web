import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'
import useThemeStore from '../../store/themeStore'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-bg border border-border rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="text-muted text-xs mb-1">
        {label ? (() => { try { return format(parseISO(label), 'MMM d, yyyy') } catch { return label } })() : ''}
      </p>
      <p className="font-semibold text-danger">{val?.toFixed(2)}%</p>
    </div>
  )
}

export default function DrawdownChart({ data = [] }) {
  const { isDark } = useThemeStore()
  const dangerColor = isDark ? '#F87171' : '#EF4444'
  const gridColor   = isDark ? '#2A2F3A' : '#E5E7EB'

  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-muted text-sm">
        No drawdown data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={dangerColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={dangerColor} stopOpacity={0} />
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
          tickFormatter={(v) => `${v}%`}
          width={44}
        />
        <ReferenceLine y={0} stroke={isDark ? '#2A2F3A' : '#E5E7EB'} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="drawdown"
          stroke={dangerColor}
          strokeWidth={2}
          fill="url(#ddGradient)"
          dot={false}
          activeDot={{ r: 4, fill: dangerColor, strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
