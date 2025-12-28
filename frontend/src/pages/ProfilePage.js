import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [shelves, setShelves] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
    favouriteGenres: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, shelfRes, recRes] = await Promise.all([
          apiClient.get('/api/auth/me'),
          apiClient.get('/api/shelves/my'),
          apiClient.get('/api/books/me/recommended'),
        ]);
        setMe(meRes.data);
        setShelves(shelfRes.data);
        setRecommended(recRes.data);
        setForm({
          name: meRes.data.name || '',
          bio: meRes.data.bio || '',
          avatarUrl: meRes.data.avatarUrl || '',
          favouriteGenres:
            meRes.data.favouriteGenres?.join(', ') || '',
        });
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchData();
  }, [user, navigate]);

  if (!user) return null;

  // Books fully marked as READ
  const readEntries = shelves.filter((e) => e.status === 'READ');
  // Books currently reading
  const readingEntries = shelves.filter((e) => e.status === 'READING');

  const totalRead = readEntries.length;

  // Pages read: full pages for READ + currentPage for READING
  const totalPagesRead =
    readEntries.reduce((sum, e) => {
      const pages = e.book?.pages || 0;
      return sum + pages;
    }, 0) +
    readingEntries.reduce((sum, e) => {
      const p = e.currentPage || 0;
      return sum + p;
    }, 0);

  // Books-per-year: count fully read books only
  const perYear = {};
  readEntries.forEach((entry) => {
    const year = new Date(entry.updatedAt).getFullYear();
    perYear[year] = (perYear[year] || 0) + 1;
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        favouriteGenres: form.favouriteGenres
          ? form.favouriteGenres.split(',').map((g) => g.trim())
          : [],
      };
      const res = await apiClient.put('/api/auth/me', payload);
      setMe(res.data);
      // update context (for navbar name)
      login({
        ...user,
        name: res.data.name,
      });
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rt-container">
      <h2 className="rt-page-title">My Profile</h2>
      {me && (
        <div className="rt-section-card" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
          {me.avatarUrl && (
            <img
              src={me.avatarUrl}
              alt={me.name}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            {!editing ? (
              <>
                <h3 style={{ marginTop: 0 }}>{me.name}</h3>
                <p style={{ fontSize: '0.9rem', color: '#555' }}>
                  {me.email}
                </p>
                {me.bio && (
                  <p
                    style={{
                      fontSize: '0.9rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    {me.bio}
                  </p>
                )}
                {me.favouriteGenres && me.favouriteGenres.length > 0 &&
                  (
                    <p
                      style={{
                        fontSize: '0.85rem',
                        marginTop: '0.3rem',
                      }}
                    >
                      Favourite genres:{' '}
                      {me.favouriteGenres.join(', ')}
                    </p>
                  )}
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: '#777',
                    marginTop: '0.4rem',
                  }}
                >
                  Member since:{' '}
                  {new Date(me.createdAt).toLocaleDateString()}
                </p>

                <button
                  className="rt-btn rt-btn-ghost"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <div className="rt-form-field">
                  <label className="rt-form-label">Name</label>
                  <input
                    name="name"
                    className="rt-form-input"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="rt-form-field">
                  <label className="rt-form-label">Bio</label>
                  <textarea
                    name="bio"
                    className="rt-form-textarea"
                    value={form.bio}
                    onChange={handleChange}
                  />
                </div>
                <div className="rt-form-field">
                  <label className="rt-form-label">
                    Avatar image URL
                  </label>
                  <input
                    name="avatarUrl"
                    className="rt-form-input"
                    value={form.avatarUrl}
                    onChange={handleChange}
                  />
                </div>
                <div className="rt-form-field">
                  <label className="rt-form-label">
                    Favourite genres (comma-separated)
                  </label>
                  <input
                    name="favouriteGenres"
                    className="rt-form-input"
                    value={form.favouriteGenres}
                    onChange={handleChange}
                  />
                </div>
                <button
                  type="submit"
                  className="rt-btn rt-btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="rt-btn rt-btn-ghost"
                  style={{ marginLeft: '0.5rem' }}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          background: '#fff',
          padding: '1rem',
          borderRadius: '6px',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: '1rem' }}>
          Reading statistics
        </h3>
        <p style={{ fontSize: '0.9rem' }}>
          Books read: <strong>{totalRead}</strong>
        </p>
        <p style={{ fontSize: '0.9rem' }}>
          Estimated pages read:{' '}
          <strong>{totalPagesRead}</strong>
        </p>
        {Object.keys(perYear).length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <p
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Books read per year:
            </p>
            <ul
              style={{
                fontSize: '0.85rem',
                paddingLeft: '1.2rem',
                marginTop: '0.2rem',
              }}
            >
              {Object.entries(perYear)
                .sort(([a], [b]) => b - a)
                .map(([year, count]) => (
                  <li key={year}>
                    {year}: {count} book(s)
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {recommended && recommended.length > 0 && (
        <div
          style={{
            marginTop: '1.5rem',
            background: '#fff',
            padding: '1rem',
            borderRadius: '6px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: '1rem' }}>
            Recommended for you
          </h3>
          <p
            style={{
              fontSize: '0.8rem',
              color: '#777',
              marginTop: '0.2rem',
              marginBottom: '0.8rem',
            }}
          >
            Based on your favourite genres and top-rated books.
          </p>
          <div className="rt-book-grid">
            {recommended.map((b) => (
              <div
                key={b._id}
                className="rt-book-card"
                onClick={() => (window.location.href = `/books/${b._id}`)}
              >
                <div className="rt-book-cover-wrapper">
                  {b.coverImageUrl ? (
                    <img
                      src={b.coverImageUrl}
                      alt={b.title}
                      className="rt-book-cover"
                    />
                  ) : (
                    <span>No cover</span>
                  )}
                </div>
                <div className="rt-book-card-body">
                  <div className="rt-book-title">{b.title}</div>
                  <div className="rt-book-author">by {b.author}</div>
                  <div className="rt-book-rating">
                    ★ {b.averageRating?.toFixed(1) || '0.0'} (
                    {b.ratingCount || 0} ratings)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;