import clsx from 'clsx'
import { ChevronUp, ChevronDown } from 'lucide-react'
import Skeleton from './Skeleton'

export function Table({ children, className }) {
  return (
    <div className={clsx('w-full overflow-x-auto rounded-xl border border-border', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function Thead({ children }) {
  return (
    <thead className="bg-surface border-b border-border sticky top-0 z-10">
      {children}
    </thead>
  )
}

export function Th({ children, sortable, sorted, direction, onSort, className }) {
  return (
    <th
      className={clsx(
        'px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap',
        sortable && 'cursor-pointer select-none hover:text-text transition-colors',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <span className="inline-flex flex-col">
            <ChevronUp size={10} className={clsx(sorted && direction === 'asc' ? 'text-accent' : 'text-border')} />
            <ChevronDown size={10} className={clsx(sorted && direction === 'desc' ? 'text-accent' : 'text-border')} />
          </span>
        )}
      </div>
    </th>
  )
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-border">{children}</tbody>
}

export function Tr({ children, onClick, className }) {
  return (
    <tr
      onClick={onClick}
      className={clsx(
        'transition-colors',
        onClick && 'cursor-pointer',
        'hover:bg-surface/60',
        className
      )}
    >
      {children}
    </tr>
  )
}

export function Td({ children, className, muted }) {
  return (
    <td className={clsx('px-4 py-3 text-sm', muted ? 'text-muted' : 'text-text', className)}>
      {children}
    </td>
  )
}

export function TableSkeleton({ cols = 5, rows = 6 }) {
  return (
    <Tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <Tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <Td key={j}>
              <Skeleton height={14} className={j === 0 ? 'w-32' : 'w-20'} />
            </Td>
          ))}
        </Tr>
      ))}
    </Tbody>
  )
}

export function TableEmpty({ message = 'No data found', cols = 5 }) {
  return (
    <Tbody>
      <tr>
        <td colSpan={cols} className="px-4 py-16 text-center text-muted text-sm">
          {message}
        </td>
      </tr>
    </Tbody>
  )
}

export default Table
