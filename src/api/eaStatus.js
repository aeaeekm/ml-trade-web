import client from './client'

export const eaStatusApi = {
  // All EA statuses — client baseURL is /api/v1, so path is /mt5/ea-status
  list: () => client.get('/mt5/ea-status').then(r => r.data).catch(() => []),

  // System-wide status (active EAs, last heartbeat)
  systemStatus: () => client.get('/mt5/system-status').then(r => r.data).catch(() => null),
}

// Derive display status + color from EA status string + seconds_since_heartbeat
export function resolveEAStatus(account) {
  const { status, seconds_since_heartbeat, trade_allowed, algo_trading_allowed, terminal_connected } = account

  if (!status || status === 'UNKNOWN') return { label: 'Unknown',  color: 'neutral', warn: false }
  if (status === 'STOPPED')            return { label: 'Stopped',  color: 'neutral', warn: false }
  if (status === 'OFFLINE')            return { label: 'Offline',  color: 'danger',  warn: false }

  // RUNNING — check for warning conditions
  const hasWarning = !trade_allowed || !algo_trading_allowed || !terminal_connected ||
                     (seconds_since_heartbeat != null && seconds_since_heartbeat > 45)

  return {
    label: 'Running',
    color: hasWarning ? 'warning' : 'success',
    warn:  hasWarning,
  }
}

// Format "last seen" text from seconds_since_heartbeat
export function lastSeenText(seconds) {
  if (seconds == null) return 'Never'
  if (seconds < 10)  return 'Just now'
  if (seconds < 60)  return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}
