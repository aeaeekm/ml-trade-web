import clsx from 'clsx'

export default function Skeleton({ className, lines = 1, height }) {
  if (lines > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              'animate-skeleton bg-border rounded',
              i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full',
              className
            )}
            style={{ height: height || 14 }}
          />
        ))}
      </div>
    )
  }
  return (
    <div
      className={clsx('animate-skeleton bg-border rounded', className)}
      style={{ height: height || 14 }}
    />
  )
}
