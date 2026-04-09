import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import api from '../api'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiBook, FiUsers, FiAlertCircle } from 'react-icons/fi'
import AddBookModal from '../components/AddBookModal'
import EditBookModal from '../components/EditBookModal'

interface Stats { total_books: number; total_users: number; borrowed_books: number; overdue_books: number }
interface Book { id: number; title: string; author: string; isbn_no: string; image_url?: string | null; is_available?: boolean; category: { id: number; name: string }; description?: string }
interface User { id: number; name: string; email: string; type: string; status: string; created_at: string; deleted_at: string | null }
interface Paginated<T> { data: T[]; current_page: number; last_page: number }

export default function AdminPanel() {
  const [stats, setStats]   = useState<Stats | null>(null)
  const [tab, setTab]       = useState<'books' | 'users'>('books')

  // Books state
  const [books, setBooks]             = useState<Book[]>([])
  const [bookPage, setBookPage]       = useState(1)
  const [bookLastPage, setBookLastPage] = useState(1)
  const [bookSearch, setBookSearch]   = useState('')
  const [showAdd, setShowAdd]         = useState(false)
  const [editBook, setEditBook]       = useState<Book | null>(null)
  const [delBook, setDelBook]         = useState<Book | null>(null)
  const [booksLoading, setBooksLoading] = useState(true)

  // Users state
  const [users, setUsers]             = useState<User[]>([])
  const [userSearch, setUserSearch]   = useState('')
  const [userPage, setUserPage]       = useState(1)
  const [userLastPage, setUserLastPage] = useState(1)
  const [usersLoading, setUsersLoading] = useState(false)

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data.data))
  }, [])

  const fetchBooks = useCallback(async () => {
    setBooksLoading(true)
    try {
      const res = await api.get('/books', { params: { page: bookPage, search: bookSearch || undefined } })
      const p: Paginated<Book> = res.data.data
      setBooks(p.data)
      setBookLastPage(p.last_page)
    } finally { setBooksLoading(false) }
  }, [bookPage, bookSearch])

  useEffect(() => { fetchBooks() }, [fetchBooks])
  useEffect(() => { setBookPage(1) }, [bookSearch])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await api.get('/admin/users', { params: { page: userPage, search: userSearch || undefined } })
      const p: Paginated<User> = res.data.data
      setUsers(p.data)
      setUserLastPage(p.last_page)
    } finally { setUsersLoading(false) }
  }, [userPage, userSearch])

  useEffect(() => { if (tab === 'users') fetchUsers() }, [tab, fetchUsers])
  useEffect(() => { setUserPage(1) }, [userSearch])

  const handleDeleteBook = async () => {
    if (!delBook) return
    try {
      await api.delete(`/books/${delBook.id}`)
      toast.success('Book deleted.')
      setDelBook(null)
      fetchBooks()
      api.get('/admin/stats').then(r => setStats(r.data.data))
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not delete.')
    }
  }

  const handleToggleStatus = async (u: User) => {
    const newStatus = u.status === 'active' ? 'suspended' : 'active'
    try {
      await api.put(`/admin/users/${u.id}/status`, { status: newStatus })
      toast.success(`User ${newStatus}.`)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: newStatus } : x))
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update user.')
    }
  }

  const tabBtn = (t: 'books' | 'users', label: string, icon: React.ReactNode) => (
    <button
      className={'btn ' + (tab === t ? 'btn-primary' : 'btn-secondary')}
      onClick={() => setTab(t)}
    >
      {icon} {label}
    </button>
  )

  const bookPages  = Array.from({ length: bookLastPage },  (_, i) => i + 1)
  const userPages  = Array.from({ length: userLastPage },  (_, i) => i + 1)

  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title" style={{ marginBottom: '1.75rem' }}>⚙️ Admin Panel</h1>

        {/* Stats */}
        {stats && (
          <div className="stats-grid">
            {[
              { label: 'Total Books',     value: stats.total_books,    icon: '📚' },
              { label: 'Total Members',   value: stats.total_users,    icon: '👥' },
              { label: 'Currently Borrowed', value: stats.borrowed_books, icon: '📖' },
              { label: 'Overdue Books',   value: stats.overdue_books,  icon: '⚠️' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.icon} {s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
          {tabBtn('books', 'Books', <FiBook size={14} />)}
          {tabBtn('users', 'Users', <FiUsers size={14} />)}
        </div>

        {/* Books Tab */}
        {tab === 'books' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
              <span>Books Management</span>
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                <div className="search-bar" style={{ width: 220 }}>
                  <FiSearch className="search-icon" />
                  <input type="text" className="form-control" style={{ padding: '.4rem .4rem .4rem 2.2rem' }} placeholder="Search books…" value={bookSearch} onChange={e => setBookSearch(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><FiPlus /> Add Book</button>
              </div>
            </div>
            <div className="table-wrap">
              {booksLoading ? (
                <div className="spinner-wrap"><div className="spinner" /></div>
              ) : (
                <table>
                  <thead>
                    <tr><th>#</th><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {books.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No books found.</td></tr>
                    )}
                    {books.map(book => (
                      <tr key={book.id}>
                        <td>{book.id}</td>
                        <td style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</td>
                        <td>{book.author}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{book.isbn_no}</td>
                        <td><span className="badge badge-primary">{book.category?.name}</span></td>
                        <td>
                          <span className={'badge ' + (book.is_available ? 'badge-success' : 'badge-danger')}>
                            {book.is_available ? 'Available' : 'Borrowed'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '.4rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditBook(book)}><FiEdit2 size={13} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDelBook(book)}><FiTrash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {bookLastPage > 1 && (
              <div style={{ padding: '.75rem 1rem', borderTop: '1px solid var(--border)' }}>
                <div className="pagination" style={{ marginTop: 0 }}>
                  <button className="page-btn" disabled={bookPage === 1} onClick={() => setBookPage(p => p - 1)}>‹</button>
                  {bookPages.map(p => <button key={p} className={'page-btn' + (p === bookPage ? ' active' : '')} onClick={() => setBookPage(p)}>{p}</button>)}
                  <button className="page-btn" disabled={bookPage === bookLastPage} onClick={() => setBookPage(p => p + 1)}>›</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
              <span>User Management</span>
              <div className="search-bar" style={{ width: 220 }}>
                <FiSearch className="search-icon" />
                <input type="text" className="form-control" style={{ padding: '.4rem .4rem .4rem 2.2rem' }} placeholder="Search users…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
            </div>
            <div className="table-wrap">
              {usersLoading ? (
                <div className="spinner-wrap"><div className="spinner" /></div>
              ) : (
                <table>
                  <thead>
                    <tr><th>#</th><th>Name</th><th>Email</th><th>Status</th><th>Joined</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found.</td></tr>
                    )}
                    {users.map(u => (
                      <tr key={u.id} style={u.deleted_at ? { opacity: .55 } : {}}>
                        <td>{u.id}</td>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={'badge ' + (u.status === 'active' ? 'badge-success' : 'badge-danger')}>
                            {u.status}
                          </span>
                          {u.deleted_at && <span className="badge badge-muted" style={{ marginLeft: '.35rem' }}>Deleted</span>}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                          {!u.deleted_at && (
                            <button
                              className={'btn btn-sm ' + (u.status === 'active' ? 'btn-danger' : 'btn-success')}
                              onClick={() => handleToggleStatus(u)}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {userLastPage > 1 && (
              <div style={{ padding: '.75rem 1rem', borderTop: '1px solid var(--border)' }}>
                <div className="pagination" style={{ marginTop: 0 }}>
                  <button className="page-btn" disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)}>‹</button>
                  {userPages.map(p => <button key={p} className={'page-btn' + (p === userPage ? ' active' : '')} onClick={() => setUserPage(p)}>{p}</button>)}
                  <button className="page-btn" disabled={userPage === userLastPage} onClick={() => setUserPage(p => p + 1)}>›</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAdd && (
        <AddBookModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchBooks(); api.get('/admin/stats').then(r => setStats(r.data.data)) }} />
      )}

      {/* Edit Book Modal */}
      {editBook && (
        <EditBookModal book={editBook} onClose={() => setEditBook(null)} onSaved={() => { setEditBook(null); fetchBooks() }} />
      )}

      {/* Delete Book Confirm */}
      {delBook && (
        <div className="modal-overlay" onClick={() => setDelBook(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirm Delete</span>
              <button className="modal-close" onClick={() => setDelBook(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Delete <strong>{delBook.title}</strong>? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDelBook(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteBook}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
