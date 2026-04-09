import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../api'
import { FiBook, FiClock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

interface Record {
  id: number
  borrowed_at: string
  due_date: string
  returned_at: string | null
  is_overdue?: boolean
  book: {
    id: number; title: string; author: string
    image_url: string | null; category: { name: string }
  }
}

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MyBooks() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState<Record[]>([])
  const [history, setHistory] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [returning, setReturning] = useState<number | null>(null)

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const res = await api.get('/my-books')
      setCurrent(res.data.data.current)
      setHistory(res.data.data.history)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBooks() }, [])

  const handleReturn = async (recordId: number) => {
    setReturning(recordId)
    try {
      await api.post(`/return/${recordId}`)
      toast.success('Book returned successfully!')
      fetchBooks()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not return book.')
    } finally {
      setReturning(null)
    }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Current borrows */}
        <div className="section-header">
          <h1 className="section-title">📖 My Books</h1>
        </div>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Currently Borrowed <span className="badge badge-primary" style={{ verticalAlign: 'middle' }}>{current.length}/3</span>
        </h2>

        {current.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">📚</div>
            <p>You have no books borrowed at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '2.5rem' }}>
            {current.map(rec => (
              <div key={rec.id} className="card">
                <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div
                    style={{ width: 56, height: 72, borderRadius: 6, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => navigate(`/books/${rec.book.id}`)}
                  >
                    {rec.book.image_url
                      ? <img src={rec.book.image_url} alt={rec.book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <FiBook color="var(--primary)" />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate(`/books/${rec.book.id}`)}>
                      {rec.book.title}
                    </div>
                    <div style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>{rec.book.author}</div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '.4rem', fontSize: '.82rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                        <FiClock size={12} /> Borrowed: {fmt(rec.borrowed_at)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem', color: rec.is_overdue ? 'var(--danger)' : 'var(--success)' }}>
                        {rec.is_overdue ? <FiAlertCircle size={12} /> : <FiCheckCircle size={12} />}
                        Due: {fmt(rec.due_date)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <span className={'badge ' + (rec.is_overdue ? 'badge-danger' : 'badge-success')}>
                      {rec.is_overdue ? 'Overdue' : 'On Time'}
                    </span>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleReturn(rec.id)}
                      disabled={returning === rec.id}
                    >
                      {returning === rec.id ? 'Returning…' : 'Return'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Borrowing History <span className="badge badge-muted" style={{ verticalAlign: 'middle' }}>{history.length}</span>
        </h2>

        {history.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">📋</div>
            <p>No borrowing history yet.</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrowed</th>
                    <th>Due</th>
                    <th>Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(rec => (
                    <tr key={rec.id}>
                      <td>
                        <div style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/books/${rec.book.id}`)}>
                          {rec.book.title}
                        </div>
                        <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{rec.book.author}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmt(rec.borrowed_at)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmt(rec.due_date)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{rec.returned_at ? fmt(rec.returned_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
