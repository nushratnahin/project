import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { FiBookOpen, FiUser, FiMail, FiLock } from 'react-icons/fi'

export default function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]     = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) { navigate('/'); return null }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name)     e.name = 'Name is required.'
    if (!form.email)    e.email = 'Email is required.'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (form.password !== form.password_confirmation) e.password_confirmation = 'Passwords do not match.'
    return e
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, form.password_confirmation)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err: any) {
      const serverErrors = err.response?.data?.errors || {}
      const mapped: Record<string, string> = {}
      for (const [k, v] of Object.entries(serverErrors)) {
        mapped[k] = Array.isArray(v) ? v[0] : String(v)
      }
      if (Object.keys(mapped).length) setErrors(mapped)
      else setErrors({ general: err.response?.data?.message || 'Registration failed.' })
    } finally {
      setLoading(false)
    }
  }

  const field = (key: string, label: string, type = 'text', icon: React.ReactNode, placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{icon} {label}</label>
      <input
        type={type}
        className={'form-control' + (errors[key] ? ' is-invalid' : '')}
        placeholder={placeholder}
        value={(form as any)[key]}
        onChange={e => set(key, e.target.value)}
      />
      {errors[key] && <div className="form-error">{errors[key]}</div>}
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <FiBookOpen size={40} color="var(--primary)" />
          <h1>LibraryMS</h1>
          <p>Create your account</p>
        </div>

        {errors.general && <div className="alert alert-danger">{errors.general}</div>}

        <form onSubmit={handleSubmit}>
          {field('name',  'Full Name',        'text',     <FiUser size={13} />,  'John Doe')}
          {field('email', 'Email',            'email',    <FiMail size={13} />,  'you@example.com')}
          {field('password', 'Password',      'password', <FiLock size={13} />,  '••••••••')}
          {field('password_confirmation', 'Confirm Password', 'password', <FiLock size={13} />, '••••••••')}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
