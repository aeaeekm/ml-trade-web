import { useEffect, useState, useCallback } from 'react'
import { Activity } from 'lucide-react'
import { systemApi } from '../../api/system'
import StatusDot from '../ui/StatusDot'

function formatHeartbeat(ts) {
  if (!ts) return null
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function toStatus(val) {
  if (val === true  || val === 'online'    || val === 'connected') return 'online'
  if (val === false || val === 'offline'   || val === 'down')      return 'offline'
  if (val === 'warning' || val === 'degraded')                     return 'warning'
  return 'unknown'
}

export default function ServerStatusBar() {
  const [status, setStatus] = useState(null)

  const fetch = useCallback(() => {
    systemApi.status().then(setStatus)
  }, [])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, 30_000)
    return () => clearInterval(id)
  }, [fetch])

  const signalStatus    = toStatus(status?.signal_server)
  const apiStatus       = toStatus(status?.api_server)
  const mt5Status       = toStatus(status?.mt5_connector)
  const heartbeat       = formatHeartbeat(status?.last_heartbeat)
  const activeEas       = status?.active_eas ?? null
  const queueSize       = status?.signal_queue ?? null

  return (
    <div className="w-full h-9 bg-surface border-b border-border flex items-center px-4 gap-4 shrink-0">
      <Activity size={13} className="text-muted shrink-0" />

      <div className="flex items-center gap-4 flex-1 overflow-x-auto">
        <StatusDot status={signalStatus}  label="Signal Server"  />
        <StatusDot status={apiStatus}     label="API Server"     />
        <StatusDot status={mt5Status}     label="MT5 Connector"  />

        {heartbeat && (
          <span className="text-xs text-muted whitespace-nowrap">
            Last heartbeat: <span className="text-text font-medium">{heartbeat}</span>
          </span>
        )}

        {activeEas !== null && (
          <span className="text-xs text-muted whitespace-nowrap">
            Active EAs: <span className="text-text font-medium">{activeEas}</span>
          </span>
        )}

        {queueSize !== null && (
          <span className="text-xs text-muted whitespace-nowrap">
            Signal queue: <span className="text-text font-medium">{queueSize}</span>
          </span>
        )}
      </div>
    </div>
  )
}
