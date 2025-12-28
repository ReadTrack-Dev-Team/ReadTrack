import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'WANT_TO_READ', label: 'Want to Read' },
  { key: 'READING', label: 'Reading' },
  { key: 'READ', label: 'Read' },
];

const MyShelvesPage = () => {
  const [entries, setEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('WANT_TO_READ');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchShelves = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/api/shelves/my');
      setEntries(res.data || []);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || 'Failed to load your shelves';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return; // don't fetch if redirecting
    fetchShelves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredEntries = entries.filter((e) => e.status === activeTab);

  const stats = {
    want: entries.filter((e) => e.status === 'WANT_TO_READ').length,
    reading: entries.filter((e) => e.status === 'READING').length,
    read: entries.filter((e) => e.status === 'READ').length,
    pagesRead: entries
      .filter((e) => e.status === 'READ')
      .reduce((sum, e) => sum + (e.book?.pages || 0), 0),
    pagesInProgress: entries
      .filter((e) => e.status === 'READING')
      .reduce((sum, e) => sum + (e.currentPage || 0), 0),
  };

  const handleCardClick = (bookId) => {
    if (!bookId) return;
    navigate(`/books/${bookId}`);
  };

  const renderEmptyState = () => {
    const currentTab = TABS.find((t) => t.key === activeTab);
    return (
      <div className="rt-shelf-empty">
        <h4>No books on the “{currentTab?.label}” shelf yet</h4>
        <p>
          Start exploring the catalog and add books to this shelf from the book
          details page.
        </p>
        <button
          className="rt-btn rt-btn-primary"
          onClick={() => navigate('/books')}
        >
          Browse books
        </button>
      </div>
    );
  };

  // while redirecting, render nothing
  if (!user) return null;

  return (
    <div className="rt-container">
      <div className="rt-shelves-header-row">
        <div>
          <h2 className="rt-page-title">My Shelves</h2>
          <p className="rt-shelves-subtitle">
            Keep track of everything you want to read, are reading now, and have
            already finished.
          </p>
        </div>

        <div className="rt-shelves-stats-card">
          <div className="rt-shelves-stat">
            <span className="rt-shelves-stat-label">Want to read</span>
            <span className="rt-shelves-stat-value">{stats.want}</span>
          </div>
          <div className="rt-shelves-stat">
            <span className="rt-shelves-stat-label">Reading</span>
            <span className="rt-shelves-stat-value">{stats.reading}</span>
          </div>
          <div className="rt-shelves-stat">
            <span className="rt-shelves-stat-label">Finished</span>
            <span className="rt-shelves-stat-value">{stats.read}</span>
          </div>
          <div className="rt-shelves-stat rt-shelves-stat-wide">
            <span className="rt-shelves-stat-label">Estimated pages read</span>
            <span className="rt-shelves-stat-value">
              {stats.pagesRead + stats.pagesInProgress}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rt-shelf-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={
              'rt-shelf-tab ' +
              (activeTab === tab.key ? 'rt-shelf-tab--active' : '')
            }
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="rt-shelf-tab-count">
              {
                entries.filter((e) => e.status === tab.key)
                  .length
              }
            </span>
          </button>
        ))}
      </div>

      {loading && <p>Loading your shelves…</p>}
      {error && <p className="rt-form-error">{error}</p>}

      {!loading && !error && (
        <>
          {filteredEntries.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="rt-shelf-grid">
              {filteredEntries.map((entry) => {
                const book = entry.book;
                if (!book) return null;

                const totalPages = book.pages || 0;
                const current = entry.currentPage || 0;
                const pct =
                  totalPages > 0
                    ? Math.min(100, Math.round((current / totalPages) * 100))
                    : null;

                return (
                  <div
                    key={entry._id}
                    className="rt-shelf-card"
                    onClick={() => handleCardClick(book._id)}
                  >
                    <div className="rt-shelf-cover-wrapper">
                      {book.coverImageUrl ? (
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="rt-shelf-cover"
                        />
                      ) : (
                        <span>No cover</span>
                      )}
                    </div>
                    <div className="rt-shelf-card-body">
                      <div className="rt-shelf-title">{book.title}</div>
                      <div className="rt-shelf-author">by {book.author}</div>

                      <div className="rt-shelf-meta-row">
                        <span className="rt-shelf-chip">
                          {book.year || 'Year unknown'}
                        </span>
                        {book.genres && book.genres.length > 0 && (
                          <span className="rt-shelf-chip rt-shelf-chip--soft">
                            {book.genres.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>

                      {pct !== null && (
                        <div className="rt-shelf-progress">
                          <div className="rt-shelf-progress-bar">
                            <div
                              className="rt-shelf-progress-fill"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="rt-shelf-progress-text">
                            {current} / {totalPages} pages ({pct}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyShelvesPage;