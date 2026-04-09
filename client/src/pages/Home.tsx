import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { FiSearch, FiBook } from 'react-icons/fi'

interface Category { id: number; name: string }
interface Book {
  id: number; title: string; author: string; isbn_no: string
  image_url: string | null; is_available: boolean
  category: Category
}
interface Paginated { data: Book[]; current_page: number; last_page: number; total: number }

export default function Home() {
  const navigate = useNavigate()
  const [books, setBooks]         = useState<Book[]>([])
  const [meta, setMeta]           = useState({ current_page: 1, last_page: 1, total: 0 })
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch]       = useState('')
  const [catId, setCatId]         = useState<number | null>(null)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data))
  }, [])

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page }
      if (search)  params.search      = search
      if (catId)   params.category_id = catId
      const res = await api.get('/books', { params })
      const p: Paginated = res.data.data
      setBooks(p.data)
      setMeta({ current_page: p.current_page, last_page: p.last_page, total: p.total })
    } finally {
      setLoading(false)
    }
  }, [page, search, catId])

  useEffect(() => { fetchBooks() }, [fetchBooks])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, catId])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)

  const pages = Array.from({ length: meta.last_page }, (_, i) => i + 1)

  return (
    <div className="page">
      <div className="container">
        {/* Toolbar */}
        <div className="section-header">
          <div>
            <h1 className="section-title">📚 Book Catalog</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>{meta.total} books available</p>
          </div>
          <div className="search-bar" style={{ width: 260 }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search title or author…"
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="category-filters">
          <button className={'cat-btn' + (!catId ? ' active' : '')} onClick={() => setCatId(null)}>All</button>
          {categories.map(c => (
            <button
              key={c.id}
              className={'cat-btn' + (catId === c.id ? ' active' : '')}
              onClick={() => setCatId(catId === c.id ? null : c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Book grid */}
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : books.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>No books found. Try a different search or category.</p>
          </div>
        ) : (
          <div className="books-grid">
            {books.map(book => (
              <div key={book.id} className="book-card" onClick={() => navigate(`/books/${book.id}`)}>
                <div className="book-cover">
                  {book.image_url
                    ? <img src={book.image_url} alt={book.title} />
                    : <FiBook />}
                </div>
                <div className="book-info">
                  <div className="book-title">{book.title}</div>
                  <div className="book-author">{book.author}</div>
                  <div style={{ marginTop: 'auto', paddingTop: '.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-primary">{book.category?.name}</span>
                    <span className={'badge ' + (book.is_available ? 'badge-success' : 'badge-danger')}>
                      {book.is_available ? 'Available' : 'Borrowed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {pages.map(p => (
              <button key={p} className={'page-btn' + (p === page ? ' active' : '')} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>
    </div>
  )
}
