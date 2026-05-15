import clsx from 'clsx'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
  onPageSize,
  pageSizeOptions = [10, 25, 50, 100],
}) {
  if (total === 0) return null

  const safeTotal = totalPages ?? Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  // Build visible page numbers (max 5, with ellipsis)
  const pages = []
  const delta = 2
  const left = Math.max(1, page - delta)
  const right = Math.min(safeTotal, page + delta)
  for (let i = left; i <= right; i++) pages.push(i)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border">
      {/* Left: showing X-Y of Z + page size */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted whitespace-nowrap">
          Showing{' '}
          <span className="font-medium text-text">{start}–{end}</span>{' '}
          of{' '}
          <span className="font-medium text-text">{total}</span>{' '}
          records
        </span>
        {onPageSize && (
          <select
            value={pageSize}
            onChange={e => onPageSize(Number(e.target.value))}
            className="bg-bg border border-border rounded-lg text-xs text-text px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          >
            {pageSizeOptions.map(n => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        )}
      </div>

      {/* Right: page navigation */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPage(1)}
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Prev */}
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Ellipsis before */}
        {pages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPage(1)}
              className="px-2.5 py-1 rounded-lg text-xs text-muted hover:bg-surface transition-colors"
            >
              1
            </button>
            {pages[0] > 2 && (
              <span className="px-1 text-muted text-xs">…</span>
            )}
          </>
        )}

        {/* Page numbers */}
        {pages.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={clsx(
              'px-2.5 py-1 rounded-lg text-xs transition-colors',
              p === page
                ? 'bg-accent text-white font-semibold'
                : 'text-muted hover:bg-surface',
            )}
          >
            {p}
          </button>
        ))}

        {/* Ellipsis after */}
        {pages[pages.length - 1] < safeTotal && (
          <>
            {pages[pages.length - 1] < safeTotal - 1 && (
              <span className="px-1 text-muted text-xs">…</span>
            )}
            <button
              type="button"
              onClick={() => onPage(safeTotal)}
              className="px-2.5 py-1 rounded-lg text-xs text-muted hover:bg-surface transition-colors"
            >
              {safeTotal}
            </button>
          </>
        )}

        {/* Next */}
        <button
          type="button"
          disabled={page === safeTotal}
          onClick={() => onPage(page + 1)}
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>

        {/* Last */}
        <button
          type="button"
          disabled={page === safeTotal}
          onClick={() => onPage(safeTotal)}
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  )
}
