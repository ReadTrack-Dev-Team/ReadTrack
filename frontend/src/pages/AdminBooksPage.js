import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const AdminBooksPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    coverImageUrl: '',
    genres: '',
    publicationYear: '',
    pages: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/books');
      setBooks(res.data);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to load books';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        genres: form.genres
          ? form.genres.split(',').map((g) => g.trim())
          : [],
        publicationYear: form.publicationYear
          ? Number(form.publicationYear)
          : undefined,
        pages: form.pages ? Number(form.pages) : undefined,
      };

      await apiClient.post('/api/books', payload);
      setForm({
        title: '',
        author: '',
        description: '',
        coverImageUrl: '',
        genres: '',
        publicationYear: '',
        pages: '',
      });
      fetchBooks();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to create book';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await apiClient.delete(`/api/books/${id}`);
      fetchBooks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete book');
    }
  };

  return (
    <div className="rt-container">
      <h2 className="rt-page-title">Admin – Manage Books</h2>

      <div className="rt-form-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0, fontSize: '1.05rem', color: '#382110' }}>
          Add a new book
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="rt-form-field">
            <label className="rt-form-label">Title</label>
            <input
              name="title"
              className="rt-form-input"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="rt-form-field">
            <label className="rt-form-label">Author</label>
            <input
              name="author"
              className="rt-form-input"
              value={form.author}
              onChange={handleChange}
              required
            />
          </div>
          <div className="rt-form-field">
            <label className="rt-form-label">Cover image URL</label>
            <input
              name="coverImageUrl"
              className="rt-form-input"
              value={form.coverImageUrl}
              onChange={handleChange}
              placeholder="https://... or /covers/..."
              required
            />
          </div>
          <div className="rt-form-field">
            <label className="rt-form-label">
              Genres (comma-separated, e.g. Fantasy, Adventure)
            </label>
            <input
              name="genres"
              className="rt-form-input"
              value={form.genres}
              onChange={handleChange}
            />
          </div>
          <div className="rt-form-field">
            <label className="rt-form-label">Publication year</label>
            <input
              name="publicationYear"
              type="number"
              className="rt-form-input"
              value={form.publicationYear}
              onChange={handleChange}
            />
          </div>
          <div className="rt-form-field">
            <label className="rt-form-label">Pages</label>
            <input
              name="pages"
              type="number"
              className="rt-form-input"
              value={form.pages}
              onChange={handleChange}
            />
          </div>
          <div className="rt-form-field">
            <label className="rt-form-label">Description</label>
            <textarea
              name="description"
              className="rt-form-textarea"
              value={form.description}
              onChange={handleChange}
            />
          </div>
          {error && <div className="rt-form-error">{error}</div>}
          <button
            type="submit"
            className="rt-btn rt-btn-primary"
            style={{ marginTop: '0.6rem' }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Add Book'}
          </button>
        </form>
      </div>

      <h3 style={{ fontSize: '1.05rem', color: '#382110' }}>All books</h3>
      {loading ? (
        <p>Loading books...</p>
      ) : (
        <div
          style={{
            marginTop: '0.6rem',
            background: '#fff',
            borderRadius: '6px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {books.length === 0 && (
            <p style={{ padding: '0.8rem' }}>No books yet.</p>
          )}
          {books.map((b) => (
            <div
              key={b._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 0.8rem',
                borderTop: '1px solid #eee',
              }}
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {b.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#555' }}>
                  by {b.author}
                </div>
              </div>
              <button
                className="rt-btn rt-btn-ghost"
                style={{ fontSize: '0.8rem' }}
                onClick={() => handleDelete(b._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBooksPage;