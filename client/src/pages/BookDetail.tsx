import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { FiBook, FiEdit2, FiTrash2, FiArrowLeft } from 'react-icons/fi'
import EditBookModal from '../components/EditBookModal'

interface Book {
  id: number; title: string; author: string; isbn_no: string
  description: string; image_url: string | null; is_available: boolean
  category: { id: number; name: string }
  active_record?: { user: { name: string } }
}

export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, user } = useAuth()

  const [book, setBook]         = useState<Book | null>(null)
  const [loading, setLoading]   = useState(true)
  const [borrowing, setBorrowing] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDel, setShowDel]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeCount, setActiveCount] = useState(0)

  useEffect(() => {
    api.get(`/books/${id}`).then(r => setBook(r.data.data)).catch(() => navigate('/')).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      api.get('/my-books').then(r => setActiveCount(r.data.data.current.length)).catch(() => {})
    }
  }, [isAuthenticated, isAdmin])

  const handleBorrow = async () => {
    setBorrowing(true)
    try {
      await api.post(`/borrow/${id}`)
      toast.success('Book borrowed! Due in 14 days.')
      setBook(b => b ? { ...b, is_available: false } : b)
      setActiveCount(c => c + 1)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not borrow book.')
    } finally {
      setBorrowing(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/books/${id}`)
      toast.success('Book deleted.')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not delete book.')
      setDeleting(false)
    }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!book)   return null

  const canBorrow = isAuthenticated && !isAdmin && book.is_available && activeCount < 3

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 860 }}>
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }} onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>

        <div className="card">
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem' }}>
            {/* Cover */}
            <div>
              <div className="book-cover" style={{ borderRadius: 8, height: 300 }}>
                {book.image_url ? <img src={book.image_url} alt={book.title} /> : <FiBook size={64} />}
              </div>
            </div>

            {/* Info */}
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '.35rem' }}>{book.title}</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '.75rem' }}>by <strong>{book.author}</strong></p>

              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span className="badge badge-primary">{book.category?.name}</span>
                <span className={'badge ' + (book.is_available ? 'badge-success' : 'badge-danger')}>
                  {book.is_available ? '✓ Available' : '✗ Borrowed'}
                </span>
              </div>

              <div style={{ marginBottom: '1rem', fontSize: '.9rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>ISBN:</strong> {book.isbn_no}
              </div>

              {book.description && (
                <p style={{ fontSize: '.95rem', lineHeight: 1.7, color: 'var(--text)', marginBottom: '1.25rem' }}>
                  {book.description}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                {isAuthenticated && !isAdmin && (
                  <button
                    className="btn btn-primary"
                    onClick={handleBorrow}
                    disabled={!canBorrow || borrowing}
                    title={
                      !book.is_available ? 'Currently borrowed'
                      : activeCount >= 3 ? 'You have 3 active borrows (limit reached)'
                      : ''
                    }
                  >
                    {borrowing ? 'Borrowing…' : 'Borrow Book'}
                  </button>
                )}

                {!isAuthenticated && (
                  <button className="btn btn-outline" onClick={() => navigate('/login')}>Login to Borrow</button>
                )}

                {isAdmin && (
                  <>
                    <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>
                      <FiEdit2 /> Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => setShowDel(true)}>
                      <FiTrash2 /> Delete
                    </button>
                  </>
                )}
              </div>

              {isAuthenticated && !isAdmin && activeCount >= 3 && (
                <p style={{ marginTop: '.75rem', fontSize: '.85rem', color: 'var(--warning)' }}>
                  ⚠ You have reached the 3-book borrow limit. Return a book to borrow more.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && book && (
        <EditBookModal
          book={book}
          onClose={() => setShowEdit(false)}
          onSaved={() => { api.get(`/books/${id}`).then(r => setBook(r.data.data)); setShowEdit(false) }}
        />
      )}

      {/* Delete Confirm */}
      {showDel && (
        <div className="modal-overlay" onClick={() => setShowDel(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirm Delete</span>
              <button className="modal-close" onClick={() => setShowDel(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{book.title}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDel(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
