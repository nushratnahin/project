import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { FiUser, FiMail, FiLock, FiTrash2 } from 'react-icons/fi'

export default function Profile() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()

  const [name, setName]   = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [infoLoading, setInfoLoading] = useState(false)

  const [currPwd, setCurrPwd]     = useState('')
  const [newPwd, setNewPwd]       = useState('')
  const [confPwd, setConfPwd]     = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({})

  const [showDel, setShowDel]   = useState(false)
  const [delLoading, setDelLoading] = useState(false)

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const handleUpdateInfo = async (e: FormEvent) => {
    e.preventDefault()
    setInfoLoading(true)
    try {
      const res = await api.put('/profile', { name, email })
      setUser(res.data.data)
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed.')
    } finally {
      setInfoLoading(false)
    }
  }

  const handleChangePwd = async (e: FormEvent) => {
    e.preventDefault()
    setPwdErrors({})
    if (newPwd !== confPwd) { setPwdErrors({ confirm: 'Passwords do not match.' }); return }
    if (newPwd.length < 8) { setPwdErrors({ new: 'Password must be at least 8 characters.' }); return }
    setPwdLoading(true)
    try {
      await api.put('/profile/password', { current_password: currPwd, password: newPwd, password_confirmation: confPwd })
      toast.success('Password changed!')
      setCurrPwd(''); setNewPwd(''); setConfPwd('')
    } catch (err: any) {
      const serverErrs = err.response?.data?.errors || {}
      const mapped: Record<string, string> = {}
      for (const [k, v] of Object.entries(serverErrs)) mapped[k] = Array.isArray(v) ? v[0] : String(v)
      if (Object.keys(mapped).length) setPwdErrors(mapped)
      else toast.error(err.response?.data?.message || 'Password change failed.')
    } finally {
      setPwdLoading(false)
    }
  }

  const handleDelete = async () => {
    setDelLoading(true)
    try {
      await api.delete('/profile')
      await logout()
      toast.success('Account deleted.')
      navigate('/')
    } catch {
      toast.error('Could not delete account.')
      setDelLoading(false)
    }
  }

  const sectionStyle: React.CSSProperties = { marginBottom: '2rem' }
  const headStyle: React.CSSProperties = { fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.1rem', paddingBottom: '.6rem', borderBottom: '1px solid var(--border)' }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 className="section-title" style={{ marginBottom: '1.75rem' }}>👤 My Profile</h1>

        {/* Account Info */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Member Since</div>
                <div style={{ fontWeight: 600 }}>{user?.created_at ? fmt(user.created_at) : '—'}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
                <span className={'badge ' + (user?.status === 'active' ? 'badge-success' : 'badge-danger')}>
                  {user?.status}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Role</div>
                <span className={'badge ' + (user?.type === 'admin' ? 'badge-warning' : 'badge-primary')}>
                  {user?.type}
                </span>
              </div>
            </div>

            <h3 style={headStyle}><FiUser size={15} /> Edit Profile</h3>
            <form onSubmit={handleUpdateInfo}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={infoLoading}>
                {infoLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <h3 style={headStyle}><FiLock size={15} /> Change Password</h3>
            <form onSubmit={handleChangePwd}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-control" value={currPwd} onChange={e => setCurrPwd(e.target.value)} />
                {pwdErrors.current_password && <div className="form-error">{pwdErrors.current_password}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className={'form-control' + (pwdErrors.new ? ' is-invalid' : '')} value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                {pwdErrors.new && <div className="form-error">{pwdErrors.new}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className={'form-control' + (pwdErrors.confirm ? ' is-invalid' : '')} value={confPwd} onChange={e => setConfPwd(e.target.value)} />
                {pwdErrors.confirm && <div className="form-error">{pwdErrors.confirm}</div>}
              </div>
              <button type="submit" className="btn btn-secondary" disabled={pwdLoading}>
                {pwdLoading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Danger zone */}
        <div className="card" style={{ border: '1.5px solid #fecaca' }}>
          <div className="card-body">
            <h3 style={{ ...headStyle, color: 'var(--danger)', borderColor: '#fecaca' }}><FiTrash2 size={15} /> Danger Zone</h3>
            <p style={{ fontSize: '.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Permanently delete your account. This action cannot be undone.
            </p>
            <button className="btn btn-danger btn-sm" onClick={() => setShowDel(true)}>Delete Account</button>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDel && (
        <div className="modal-overlay" onClick={() => setShowDel(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Delete Account</span>
              <button className="modal-close" onClick={() => setShowDel(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete your account? All your data will be permanently removed.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDel(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={delLoading}>
                {delLoading ? 'Deleting…' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
