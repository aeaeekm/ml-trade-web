/**
 * Returns the best display name for a strategy object.
 * Priority: strategy_nickname > display_name > name > "Strategy {id}"
 */
export function displayName(strategy) {
  if (!strategy) return '—'
  return (
    strategy.strategy_nickname ||
    strategy.display_name ||
    strategy.name ||
    `Strategy ${strategy.id}`
  )
}

/**
 * Returns { primary, secondary } strings for displaying a strategy.
 * primary  = nickname if set, else name
 * secondary = "name · code" when nickname is set, else just code
 */
export function strategyLabel(strategy) {
  if (!strategy) return { primary: '—', secondary: '' }

  const hasNick = Boolean(strategy.strategy_nickname)
  const primary = hasNick
    ? strategy.strategy_nickname
    : (strategy.name || `Strategy ${strategy.id}`)

  const secondary = hasNick
    ? [strategy.name, strategy.strategy_code].filter(Boolean).join(' · ')
    : (strategy.strategy_code || '')

  return { primary, secondary }
}
