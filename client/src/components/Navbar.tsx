import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiBook, FiBookOpen, FiUser, FiSettings, FiLogOut, FiLogIn, FiMenu, FiX } from 'react-icons/fi'

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Close menu on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const link = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
      onClick={() => setOpen(false)}
    >
      {icon} <span>{label}</span>
    </NavLink>
  )

  return (
    <nav className="navbar" ref={menuRef}>
      <div className="container navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          <FiBookOpen size={22} />
          <span>LibraryMS</span>
        </NavLink>

        {/* Desktop links */}
        <div className="navbar-links desktop-links">
          {link('/', <FiBook size={15} />, 'Books')}
          {isAuthenticated && !isAdmin && link('/my-books', <FiBookOpen size={15} />, 'My Books')}
          {isAdmin && link('/admin', <FiSettings size={15} />, 'Admin')}
          {isAuthenticated ? (
            <>
              {link('/profile', <FiUser size={15} />, user?.name.split(' ')[0] || 'Profile')}
              <button className="nav-btn nav-btn-logout" onClick={handleLogout}>
                <FiLogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">
              <FiLogIn size={14} /> Login
            </NavLink>
          )}
        </div>

        {/* Hamburger button (mobile only) */}
        <button
          className="hamburger"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={'mobile-menu' + (open ? ' open' : '')}>
        <div className="mobile-menu-inner">
          {link('/', <FiBook size={16} />, 'Books')}
          {isAuthenticated && !isAdmin && link('/my-books', <FiBookOpen size={16} />, 'My Books')}
          {isAdmin && link('/admin', <FiSettings size={16} />, 'Admin')}
          {isAuthenticated ? (
            <>
              {link('/profile', <FiUser size={16} />, user?.name.split(' ')[0] || 'Profile')}
              <button className="nav-btn nav-btn-logout mobile-logout" onClick={handleLogout}>
                <FiLogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setOpen(false)}>
              <FiLogIn size={15} /> Login
            </NavLink>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {open && <div className="menu-backdrop" onClick={() => setOpen(false)} />}
    </nav>
  )
}