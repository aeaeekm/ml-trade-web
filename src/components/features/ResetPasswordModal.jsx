import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { usersApi } from '../../api/users'

export default function ResetPasswordModal({ open, onClose, user, onSuccess }) {
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [errors, setErrors]         = useState({})
  const [apiError, setApiError]     = useState('')
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    if (open) {
      setPassword('')
      setConfirm('')
      setErrors({})
      setApiError('')
    }
  }, [open])

  const validate = () => {
    const errs = {}
    if (!password) errs.password = 'New password is required.'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.'
    if (password && password !== confirm) errs.confirm = 'Passwords do not match.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setApiError('')
    setLoading(true)
    try {
      await usersApi.resetPassword(user.id, password)
      onSuccess?.()
      onClose()
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Failed to reset password.'
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset Password"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} loading={loading}>
            Reset Password
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {user && (
          <p className="text-sm text-muted">
            Resetting password for <span className="font-medium text-text">{user.email}</span>.
          </p>
        )}

        {apiError && (
          <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
            {apiError}
          </div>
        )}

        <Input
          label="New Password"
          type="password"
          placeholder="Min. 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
      </form>
    </Modal>
  )
}
