import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { toast } from 'react-toastify'
import api from '../api'

interface Category { id: number; name: string }
interface Book { id: number; title: string; author: string; isbn_no: string; description?: string; image_url?: string | null; category: { id: number; name: string } }
interface Props { book: Book; onClose: () => void; onSaved: () => void }

export default function EditBookModal({ book, onClose, onSaved }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm]   = useState({
    title:       book.title,
    author:      book.author,
    isbn_no:     book.isbn_no,
    description: book.description || '',
    category_id: String(book.category?.id || ''),
  })
  const [image, setImage]   = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(book.image_url || null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data))
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImage(file)
    if (file) setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('_method', 'PUT') // Laravel method spoofing
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (image) fd.append('image', image)

      const res = await api.post(`/books/${book.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Book updated!')
      onSaved()
    } catch (err: any) {
      const serverErrors = err.response?.data?.errors || {}
      const mapped: Record<string, string> = {}
      for (const [k, v] of Object.entries(serverErrors)) mapped[k] = Array.isArray(v) ? v[0] : String(v)
      if (Object.keys(mapped).length) setErrors(mapped)
      else toast.error(err.response?.data?.message || 'Failed to update book.')
    } finally {
      setLoading(false)
    }
  }

  const inp = (key: string, label: string, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input type={type} className={'form-control' + (errors[key] ? ' is-invalid' : '')} placeholder={placeholder} value={(form as any)[key]} onChange={e => set(key, e.target.value)} />
      {errors[key] && <div className="form-error">{errors[key]}</div>}
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Edit Book</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {inp('title',  'Title *',  'text')}
            {inp('author', 'Author *', 'text')}
            {inp('isbn_no','ISBN *',   'text')}

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className={'form-control' + (errors.category_id ? ' is-invalid' : '')} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">— Select category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <div className="form-error">{errors.category_id}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Cover Image (leave blank to keep current)</label>
              <input type="file" className="form-control" accept="image/*" onChange={handleImage} />
              {preview && <img src={preview} alt="Preview" className="img-preview" />}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
