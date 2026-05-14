import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Monitor, AlertCircle, RefreshCw, ServerCrash } from 'lucide-react'
import { mt5AccountsApi } from '../api/mt5accounts'
import { eaStatusApi } from '../api/eaStatus'
import Button from '../components/ui/Button'
import StatusDot from '../components/ui/StatusDot'
import MT5AccountCard from '../components/features/MT5AccountCard'
import AccountFormModal from '../components/features/AccountFormModal'
import Skeleton from '../components/ui/Skeleton'

function toStatus(val) {
  if (val === true  || val === 'online'  || val === 'connected') return 'online'
  if (val === false || val === 'offline' || val === 'down')      return 'offline'
  if (val === 'warning' || val === 'degraded')                   return 'warning'
  return 'unknown'
}

function CardSkeleton() {
  return (
    <div className="bg-bg border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton height={16} className="w-36" />
          <Skeleton height={12} className="w-24" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton height={20} className="w-12 rounded-full" />
          <Skeleton height={20} className="w-10 rounded-full" />
        </div>
      </div>
      <Skeleton height={12} className="w-48" />
      <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-surface">
        <Skeleton height={36} className="rounded-md" />
        <Skeleton height={36} className="rounded-md" />
        <Skeleton height={36} className="rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton height={14} className="w-full" />
        <Skeleton height={14} className="w-full" />
        <Skeleton height={14} className="w-full" />
        <Skeleton height={14} className="w-full" />
      </div>
      <Skeleton height={14} className="w-32" />
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <Skeleton height={20} className="w-28" />
        <div className="flex gap-1">
          <Skeleton height={30} className="w-8 rounded-lg" />
          <Skeleton height={30} className="w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function MT5AccountsPage() {
  const [accounts, setAccounts]   = useState([])
  const [sysStatus, setSysStatus] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)   // null = create mode

  // Fetch accounts + EA heartbeat status, merge them
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [accountData, eaData, sysData] = await Promise.all([
        mt5AccountsApi.list(),
        eaStatusApi.list(),
        eaStatusApi.systemStatus(),
      ])
      const eaMap = {}
      ;(eaData || []).forEach(ea => { eaMap[ea.broker_account_id] = ea })
      const merged = (accountData || []).map(acc => ({
        ...acc,
        _ea: eaMap[acc.id] || null,
      }))
      setAccounts(merged)
      setSysStatus(sysData)
    } catch {
      setError('Failed to load MT5 accounts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 30_000)   // refresh every 30s
    return () => clearInterval(id)
  }, [fetchAll])

  // Modal handlers
  const openCreate = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit   = (account) => { setEditTarget(account); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditTarget(null) }

  const handleSave = async (formData, id) => {
    if (id) {
      await mt5AccountsApi.update(id, formData)
    } else {
      await mt5AccountsApi.create(formData)
    }
    fetchAll()
  }

  const handleDelete = async (id) => {
    try {
      await mt5AccountsApi.delete(id)
      fetchAll()
    } catch {
      alert('Failed to delete account.')
    }
  }

  const handleToggle = async (id, enabled) => {
    try {
      await mt5AccountsApi.update(id, { is_active: enabled })
      fetchAll()
    } catch {
      alert('Failed to update account.')
    }
  }

  // Derived status values from real data
  const signalStatus = toStatus(sysStatus?.signal_server)
  const apiStatus    = toStatus(sysStatus?.api_server)
  const activeEas    = sysStatus?.active_eas ?? accounts.filter(a => a._ea?.status === 'RUNNING').length
  const totalEas     = accounts.length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text">MT5 Accounts</h1>
          <p className="text-sm text-muted mt-0.5">Manage MetaTrader 5 accounts and EA connections</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={openCreate} className="hidden sm:inline-flex">
          Add Account
        </Button>
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-xl bg-surface border border-border text-xs">
        <StatusDot status={signalStatus} label="Signal Server" />
        <StatusDot status={apiStatus}    label="API Server"    />
        <span className="text-muted">
          Active EAs:{' '}
          <span className={activeEas > 0 ? 'text-success font-semibold' : 'text-muted font-semibold'}>
            {activeEas}
          </span>
          {totalEas > 0 && <span className="text-border"> / {totalEas}</span>}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={fetchAccounts}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <Monitor size={28} className="text-accent" />
          </div>
          <h3 className="text-base font-semibold text-text">No MT5 accounts yet</h3>
          <p className="text-sm text-muted mt-2 max-w-xs">
            Add your first MetaTrader 5 account to start managing EA-based trading.
          </p>
          <Button variant="primary" className="mt-6" icon={<Plus size={15} />} onClick={openCreate}>
            Add Account
          </Button>
        </div>
      )}

      {/* Account cards grid */}
      {!loading && accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {accounts.map(account => (
              <MT5AccountCard
                key={account.id}
                account={account}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* FAB for mobile */}
      <button
        onClick={openCreate}
        className="fixed bottom-6 right-6 sm:hidden h-14 w-14 rounded-full bg-accent text-white
                   flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95
                   transition-all duration-150 z-30"
        aria-label="Add account"
      >
        <Plus size={22} />
      </button>

      {/* Add / Edit modal */}
      <AccountFormModal
        open={modalOpen}
        onClose={closeModal}
        account={editTarget}
        onSave={handleSave}
      />
    </div>
  )
}
