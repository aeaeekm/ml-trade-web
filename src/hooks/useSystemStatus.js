import { useState, useEffect, useCallback, useRef } from 'react'
import client from '../api/client'

const POLL_INTERVAL = 30000  // 30 seconds

function toStatus(val) {
  if (!val) return 'unknown'
  const s = typeof val === 'string' ? val : val.status
  if (s === 'online' || s === 'healthy') return 'online'
  if (s === 'offline' || s === 'down') return 'offline'
  if (s === 'warning' || s === 'degraded') return 'warning'
  return 'unknown'
}

export function useSystemStatus() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const timerRef = useRef(null)

  const fetch = useCallback(async () => {
    try {
      const r = await client.get('/system/status')
      setData(r.data)
      setError(null)
    } catch (e) {
      setError(e)
      // Keep previous data if available
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    timerRef.current = setInterval(fetch, POLL_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [fetch])

  // Derived values
  const signalStatus = toStatus(data?.signal_server)
  const apiStatus    = toStatus(data?.api_server)
  const mt5Status    = toStatus(data?.mt5_connector)
  const activeEAs    = data?.ea?.active ?? null
  const totalEAs     = data?.ea?.total ?? null
  const lastHb       = data?.signal_server?.last_heartbeat_at ?? data?.updated_at ?? null

  return {
    data,
    loading,
    error,
    signalStatus,
    apiStatus,
    mt5Status,
    activeEAs,
    totalEAs,
    lastHb,
    refetch: fetch,
  }
}

export default useSystemStatus
