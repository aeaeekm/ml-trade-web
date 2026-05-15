import { Activity, AlertTriangle } from 'lucide-react'
import { useSystemStatus } from '../../hooks/useSystemStatus'
import StatusDot from '../ui/StatusDot'

function formatHeartbeat(ts) {
  if (!ts) return null
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function ServerStatusBar() {
  const { signalStatus, apiStatus, mt5Status, activeEAs, totalEAs, lastHb, error } = useSystemStatus()

  const heartbeat = formatHeartbeat(lastHb)

  return (
    <div className="w-full h-9 bg-surface border-b border-border flex items-center px-4 gap-4 shrink-0">
      <Activity size={13} className="text-muted shrink-0" />

      <div className="flex items-center gap-4 flex-1 overflow-x-auto">
        {error ? (
          <>
            <AlertTriangle size={13} className="text-warning shrink-0" />
            <span className="text-xs text-muted whitespace-nowrap">Status unavailable</span>
          </>
        ) : (
          <>
            <StatusDot status={signalStatus} label="Signal Server" />
            <StatusDot status={apiStatus}    label="API Server"    />
            <StatusDot status={mt5Status}    label="MT5 Connector" />

            {heartbeat && (
              <span className="text-xs text-muted whitespace-nowrap">
                Last heartbeat: <span className="text-text font-medium">{heartbeat}</span>
              </span>
            )}

            {activeEAs !== null && (
              <span className="text-xs text-muted whitespace-nowrap">
                Active EAs:{' '}
                <span className="text-text font-medium">
                  {activeEAs}{totalEAs !== null ? ` / ${totalEAs}` : ''}
                </span>
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
