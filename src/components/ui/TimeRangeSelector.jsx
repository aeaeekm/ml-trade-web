import { useState } from 'react'
import clsx from 'clsx'

const PRESETS = [
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '1y', label: '1Y' },
  { value: 'custom', label: 'Custom' },
]

/* ── Hook ── */
export function useTimeRange(defaultRange = '1m') {
  const [range,     setRange]     = useState(defaultRange)
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')

  function toQueryParams() {
    if (range === 'custom') {
      return { start_date: startDate, end_date: endDate }
    }
    return { range }
  }

  return { range, setRange, startDate, setStartDate, endDate, setEndDate, toQueryParams }
}

/* ── Component ── */
export default function TimeRangeSelector({ value, onChange, startDate, endDate, onStartDate, onEndDate }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Pill row */}
      <div className="flex items-center gap-1 flex-wrap">
        {PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className={clsx(
              'px-3 py-1 text-xs font-medium rounded-full border transition-all duration-150 select-none',
              value === p.value
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'bg-surface text-muted border-border hover:text-text hover:border-muted'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {value === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted whitespace-nowrap">From</label>
            <input
              type="date"
              value={startDate ?? ''}
              onChange={e => onStartDate?.(e.target.value)}
              className={clsx(
                'bg-bg border border-border rounded-lg text-xs text-text px-2.5 py-1.5',
                'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors'
              )}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted whitespace-nowrap">To</label>
            <input
              type="date"
              value={endDate ?? ''}
              onChange={e => onEndDate?.(e.target.value)}
              className={clsx(
                'bg-bg border border-border rounded-lg text-xs text-text px-2.5 py-1.5',
                'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors'
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
}
