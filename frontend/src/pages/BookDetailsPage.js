import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import StarRatingInput from '../components/StarRatingInput';

const BookDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [error, setError] = useState('');
  const [loadingBook, setLoadingBook] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [shelfEntry, setShelfEntry] = useState(null);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [updateMessage, setUpdateMessage] = useState('');

  const fetchBook = async () => {
    try {
      setLoadingBook(true);
      const res = await apiClient.get(`/api/books/${id}`);
      setBook(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load book');
    } finally {
      setLoadingBook(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await apiClient.get(`/api/reviews/book/${id}`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchShelfEntry = async () => {
    if (!user) {
      setShelfEntry(null);
      return;
    }
    try {
      const res = await apiClient.get('/api/shelves/my');
      const entries = res.data;
      const entry = entries.find((e) => e.book && e.book._id === id);
      setShelfEntry(entry || null);
    } catch (err) {
      console.error('shelf fetch error', err);
    }
  };

  const fetchSimilar = async () => {
    try {
      const res = await apiClient.get(`/api/books/${id}/similar`);
      setSimilarBooks(res.data);
    } catch (err) {
      console.error('Failed to load similar books', err);
    }
  };

  useEffect(() => {
    fetchBook();
    fetchReviews();
    fetchShelfEntry();
    fetchSimilar();
    setUpdateMessage('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleReviewChange = (e) => {
    setReviewForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to review.');
      return;
    }

    try {
      await apiClient.post(`/api/reviews/book/${id}`, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setReviewForm({ rating: 5, comment: '' });
      fetchBook();
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;

    try {
      await apiClient.delete(`/api/reviews/${reviewId}`);
      fetchBook();
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const updateShelf = async (status, currentPageOverride) => {
    if (!user) {
      alert('You must be logged in to add shelves.');
      return;
    }
    setUpdateMessage('');
    try {
      const payload = { status };
      if (typeof currentPageOverride === 'number') {
        payload.currentPage = currentPageOverride;
      }
      const res = await apiClient.post(`/api/shelves/${id}`, payload);
      setShelfEntry(res.data);

      if (status === 'READING' && typeof currentPageOverride === 'number') {
        setUpdateMessage('Reading progress updated.');
      } else if (status === 'READ') {
        setUpdateMessage('Book marked as Read.');
      } else if (status === 'WANT_TO_READ') {
        setUpdateMessage('Book added to Want to Read shelf.');
      } else {
        setUpdateMessage('Shelf updated.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update shelf');
    }
  };

  if (loadingBook) {
    return (
      <div className="rt-container">
        <p>Loading book...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="rt-container">
        <p className="rt-form-error">{error || 'Book not found'}</p>
      </div>
    );
  }

  return (
    <div className="rt-container">
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="rt-book-cover-wrapper" style={{ maxWidth: '220px' }}>
          {book.coverImageUrl ? (
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="rt-book-cover"
            />
          ) : (
            <span>No cover</span>
          )}
        </div>
        <div>
          <h2 className="rt-page-title">{book.title}</h2>
          <p style={{ margin: 0, color: '#555' }}>by {book.author}</p>
          <p
            style={{ fontSize: '0.9rem', color: '#8a6b3f', marginTop: '0.4rem' }}
          >
            ★ {book.averageRating?.toFixed(1) || '0.0'} (
            {book.ratingCount || 0} ratings)
          </p>
          {book.publicationYear && (
            <p style={{ fontSize: '0.85rem', color: '#555' }}>
              Published: {book.publicationYear}
            </p>
          )}
          {book.pages && (
            <p style={{ fontSize: '0.85rem', color: '#555' }}>
              {book.pages} pages
            </p>
          )}
          {book.genres && book.genres.length > 0 && (
            <p style={{ fontSize: '0.85rem', color: '#555' }}>
              Genres: {book.genres.join(', ')}
            </p>
          )}

          {user && (
            <div style={{ marginTop: '0.8rem' }}>
              <p
                style={{
                  fontSize: '0.85rem',
                  marginBottom: '0.3rem',
                }}
              >
                Your shelf:{' '}
                <strong>
                  {shelfEntry
                    ? shelfEntry.status === 'WANT_TO_READ'
                      ? 'Want to Read'
                      : shelfEntry.status === 'READING'
                      ? 'Currently Reading'
                      : 'Read'
                    : 'None'}
                </strong>
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  className="rt-btn rt-btn-ghost"
                  onClick={() => updateShelf('WANT_TO_READ')}
                >
                  Want to Read
                </button>
                <button
                  className="rt-btn rt-btn-ghost"
                  onClick={() => updateShelf('READING')}
                >
                  Reading
                </button>
                <button
                  className="rt-btn rt-btn-ghost"
                  onClick={() => updateShelf('READ')}
                >
                  Read
                </button>
              </div>
            </div>
          )}

          {user && shelfEntry && shelfEntry.status === 'READING' && (
            <div style={{ marginTop: '0.6rem', fontSize: '0.85rem' }}>
              <span>Progress: </span>
              <input
                type="number"
                min="0"
                max={book.pages || undefined}
                value={shelfEntry.currentPage || 0}
                onChange={(e) =>
                  setShelfEntry((prev) =>
                    prev
                      ? {
                          ...prev,
                          currentPage: Number(e.target.value),
                        }
                      : prev
                  )
                }
                style={{ width: '80px', marginRight: '0.4rem' }}
                className="rt-form-input"
              />
              {book.pages && (
                <span>
                  / {book.pages} pages (
                  {Math.round(
                    Math.min(
                      100,
                      ((shelfEntry.currentPage || 0) / book.pages) * 100
                    )
                  )}
                  %)
                </span>
              )}
              <button
                className="rt-btn rt-btn-primary"
                style={{ marginLeft: '0.6rem', fontSize: '0.8rem' }}
                onClick={() =>
                  updateShelf('READING', shelfEntry.currentPage || 0)
                }
              >
                Update
              </button>
            </div>
          )}

          {updateMessage && (
            <p
              style={{
                fontSize: '0.8rem',
                color: '#2e7d32',
                marginTop: '0.4rem',
              }}
            >
              {updateMessage}
            </p>
          )}

          <p style={{ marginTop: '0.8rem', fontSize: '0.9rem' }}>
            {book.description}
          </p>
        </div>
      </div>

      <h3 style={{ fontSize: '1.1rem', color: '#382110' }}>
        Community Reviews
      </h3>

      {user ? (
        <form
          onSubmit={handleReviewSubmit}
          style={{
            marginTop: '0.8rem',
            marginBottom: '1.2rem',
            padding: '0.8rem',
            background: '#fff',
            borderRadius: '6px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="rt-form-field">
            <label className="rt-form-label">Your rating</label>
            <StarRatingInput
              value={Number(reviewForm.rating)}
              onChange={(val) =>
                setReviewForm((prev) => ({ ...prev, rating: val }))
              }
            />
          </div>
          <div className="rt-form-field">
            <label className="rt-form-label">Your review</label>
            <textarea
              name="comment"
              className="rt-form-textarea"
              value={reviewForm.comment}
              onChange={handleReviewChange}
              placeholder="What did you think of this book?"
            />
          </div>
          <button type="submit" className="rt-btn rt-btn-primary">
            Submit Review
          </button>
        </form>
      ) : (
        <p style={{ fontSize: '0.85rem', marginTop: '0.6rem' }}>
          <i>Login to rate and review this book.</i>
        </p>
      )}

      {loadingReviews ? (
        <p>Loading reviews...</p>
      ) : (
        <div style={{ marginTop: '0.5rem' }}>
          {reviews.length === 0 && (
            <p style={{ fontSize: '0.9rem' }}>
              No reviews yet. Be the first!
            </p>
          )}
          {reviews.map((rev) => {
            const canDelete =
              user && (user.isAdmin || rev.user?._id === user._id);

            const likeCount = rev.likes ? rev.likes.length : 0;
            const hasLiked =
              user &&
              rev.likes?.some(
                (u) => u === user._id || u?._id === user._id
              );

            const handleToggleLike = async () => {
              if (!user) {
                alert('Login to like reviews.');
                return;
              }
              try {
                await apiClient.post(`/api/reviews/${rev._id}/like`);
                fetchReviews();
              } catch (err) {
                console.error(err);
                alert(
                  err.response?.data?.message ||
                    'Failed to like/unlike review'
                );
              }
            };

            return (
              <div
                key={rev._id}
                style={{
                  marginBottom: '0.8rem',
                  padding: '0.7rem',
                  background: '#fff',
                  borderRadius: '4px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: '#382110',
                    marginBottom: '0.2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    <strong>{rev.user?.name || 'User'}</strong> rated it{' '}
                    {rev.rating}★
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="rt-btn rt-btn-ghost"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                      }}
                      onClick={handleToggleLike}
                    >
                      {hasLiked ? 'Unlike' : 'Like'} ({likeCount})
                    </button>
                    {canDelete && (
                      <button
                        className="rt-btn rt-btn-ghost"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                        }}
                        onClick={() => handleDeleteReview(rev._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: '0.85rem',
                    marginTop: '0.3rem',
                  }}
                >
                  {rev.comment || <i>No comment</i>}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {similarBooks && similarBooks.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#382110' }}>
            Similar books
          </h3>
          <div className="rt-book-grid" style={{ marginTop: '0.6rem' }}>
            {similarBooks.map((b) => (
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

export default BookDetailsPage;