import clsx from 'clsx'
import { motion } from 'framer-motion'

export default function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={clsx(
        'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        checked ? 'bg-accent' : 'bg-border'
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        className={clsx(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}
