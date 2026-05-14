import clsx from 'clsx'
import { TrendingUp, TrendingDown } from 'lucide-react'
import Skeleton from './Skeleton'

export default function StatCard({ label, value, delta, deltaLabel, icon: Icon, loading, prefix, suffix }) {
  const isPositive = typeof delta === 'number' ? delta >= 0 : delta?.startsWith('+')
  const isNegative = typeof delta === 'number' ? delta < 0 : delta?.startsWith('-')

  return (
    <div className="bg-bg border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon size={16} className="text-accent" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton height={28} className="w-3/4" />
          <Skeleton height={12} className="w-1/2" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-text tracking-tight">
            {prefix}{value}{suffix}
          </p>
          {delta !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {isPositive && <TrendingUp size={12} className="text-success" />}
              {isNegative && <TrendingDown size={12} className="text-danger" />}
              <span
                className={clsx(
                  'text-xs font-medium',
                  isPositive && 'text-success',
                  isNegative && 'text-danger',
                  !isPositive && !isNegative && 'text-muted'
                )}
              >
                {typeof delta === 'number'
                  ? `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%`
                  : delta}
              </span>
              {deltaLabel && <span className="text-xs text-muted">{deltaLabel}</span>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
