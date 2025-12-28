import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BookListPage = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('title');
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (genre) params.genre = genre;
      if (sort === 'rating') params.sort = 'rating';
      else if (sort === 'recent') params.sort = 'recent';

      const res = await apiClient.get('/api/books', { params });
      setBooks(res.data);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to load books';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const res = await apiClient.get('/api/books/genres');
      setGenres(res.data);
    } catch (err) {
      console.error('Failed to load genres', err);
    }
  };

  useEffect(() => {
    fetchGenres();
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  // ✅ when you click a card, go to /books/:id
  const handleCardClick = (id) => {
    navigate(`/books/${id}`);
  };

  return (
    <div className="rt-container">
      <h2 className="rt-page-title">Browse Books</h2>

      <form
        className="rt-search-bar"
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <input
          className="rt-form-input rt-search-input"
          placeholder="Search by title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '1000px' }}   // fixed width so it doesn’t take full row
        />
        <select
          className="rt-form-input"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          style={{ width: '150px' }}
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          className="rt-form-input"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ width: '150px' }}
        >
          <option value="title">Sort by title</option>
          <option value="rating">Sort by rating</option>
          <option value="recent">Most recent</option>
        </select>
        <button
          type="submit"
          className="rt-btn rt-btn-primary"
          style={{ height: '32px', padding: '0 0.9rem' }}
        >
          Search
        </button>
      </form>


      {loading && <p>Loading books...</p>}
      {error && <p className="rt-form-error">{error}</p>}

      {!loading && !error && (
        <div
          className="rt-book-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '1.3rem 1.3rem',
            alignItems: 'stretch',
          }}
        >
          {books.map((book) => (
            <div
              key={book._id}
              className="rt-book-card"
              onClick={() => handleCardClick(book._id)}
            >
              <div
                className="rt-book-cover-wrapper"
                style={{
                  width: '140px',
                  height: '210px',
                  overflow: 'hidden',
                  borderRadius: '3px',
                  marginBottom: '0.4rem',
                }}
              >
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="rt-book-cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>No cover</span>
                )}
              </div>
              <div
                className="rt-book-card-body"
                style={{ textAlign: 'center', maxWidth: '150px' }}
              >
                <div
                  className="rt-book-title"
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#382110',
                    marginBottom: '0.2rem',
                  }}
                >
                  {book.title}
                </div>
                <div
                  className="rt-book-author"
                  style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.2rem' }}
                >
                  by {book.author}
                </div>
                <div
                  className="rt-book-rating"
                  style={{ fontSize: '0.75rem', color: '#8a6b3f' }}
                >
                  ★ {book.averageRating?.toFixed(1) || '0.0'} (
                  {book.ratingCount || 0} ratings)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookListPage;
