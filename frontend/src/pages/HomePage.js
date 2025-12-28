import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [continueReading, setContinueReading] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForLoggedIn = async () => {
      try {
        setLoading(true);
        const [shelfRes, recRes, allBooksRes] = await Promise.all([
          apiClient.get('/api/shelves/my'),
          apiClient.get('/api/books/me/recommended'),
          apiClient.get('/api/books', { params: { sort: 'rating' } }),
        ]);

        const reading = shelfRes.data.filter(
          (entry) => entry.status === 'READING'
        );
        setContinueReading(reading);
        setRecommended(recRes.data || []);

        // 🔹 only top 5 highest-rated books
        setPopular((allBooksRes.data || []).slice(0, 5));
      } catch (err) {
        console.error('Home fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchForGuest = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/api/books', {
          params: { sort: 'rating' },
        });

        // 🔹 only top 5 highest-rated books
        setPopular((res.data || []).slice(0, 5));
      } catch (err) {
        console.error('Home fetch error (guest)', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchForLoggedIn();
    } else {
      fetchForGuest();
    }
  }, [user]);

  const handleSignup = () => navigate('/register');
  const handleSignin = () => navigate('/login');

  const goToBook = (bookId) => {
    window.location.href = `/books/${bookId}`;
  };

  return (
    <div className="rt-container rt-home-container">
      {/* HERO SECTION */}
      <section className="rt-home-hero">
        <div className="rt-home-hero-left">
          <div className="rt-home-tagline-pill">TRACK. DISCOVER. REREAD.</div>
          <h1 className="rt-home-heading">
            Keep all your reading
            <br />
            in one cozy place.
          </h1>
          <p className="rt-home-subtitle">
            See what you were reading last night, discover your next favourite
            book, and keep your shelves organised.
          </p>
          {user && (
            <button
              className="rt-btn rt-btn-primary"
              onClick={() => navigate('/my-shelves')}
              style={{ marginTop: '0.5rem' }}
            >
              Go to My Shelves
            </button>
          )}
        </div>

        <div className="rt-home-hero-right">
          {user ? (
            <div className="rt-home-discover-card">
              <h3 className="rt-home-card-title">
                Welcome back, {user.name?.split(' ')[0] || user.name}
              </h3>
              <p className="rt-home-card-sub">
                Continue your reading journey or explore fresh picks for you.
              </p>
              <div className="rt-home-card-stat-row">
                <div className="rt-home-card-stat">
                  <span className="rt-home-card-stat-label">
                    Currently reading
                  </span>
                  <span className="rt-home-card-stat-value">
                    {continueReading.length}
                  </span>
                </div>
                <div className="rt-home-card-stat">
                  <span className="rt-home-card-stat-label">
                    New recommendations
                  </span>
                  <span className="rt-home-card-stat-value">
                    {recommended.length}
                  </span>
                </div>
              </div>
              <button
                className="rt-btn rt-btn-ghost"
                style={{ width: '100%', marginTop: '0.6rem' }}
                onClick={() => navigate('/books')}
              >
                Browse all books
              </button>
            </div>
          ) : (
            <div className="rt-home-discover-card">
              <h3 className="rt-home-card-title">Discover &amp; read more</h3>
              <p className="rt-home-card-sub">
                Join ReadTrack to save the books you want to read and see what
                you’ve finished.
              </p>
              <button
                className="rt-btn rt-btn-primary"
                style={{ width: '100%', marginBottom: '0.4rem' }}
                onClick={handleSignup}
              >
                Sign up with email
              </button>
              <button
                className="rt-btn rt-btn-ghost"
                style={{ width: '100%' }}
                onClick={handleSignin}
              >
                Already a member? Sign in
              </button>

              {/* 🔹 NEW: browse option for guests */}
              <button
                className="rt-btn rt-btn-ghost"
                style={{ width: '100%', marginTop: '0.4rem' }}
                onClick={() => navigate('/books')}
              >
                Browse books 
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SMALL INFO ROW */}
      <section className="rt-home-info-row">
        <div className="rt-home-info-col">
          <h4>Deciding what to read next?</h4>
          <p>
            Use your favourite genres and ratings to get personalised
            recommendations. ReadTrack learns from your shelves to suggest books
            that match your taste.
          </p>
        </div>
        <div className="rt-home-info-col">
          <h4>Keep track of every page.</h4>
          <p>
            Move books between Want to Read, Reading, and Read. Update your
            page number as you go and see your reading statistics grow.
          </p>
        </div>
        <div className="rt-home-info-col">
          <h4>Share your thoughts.</h4>
          <p>
            Leave ratings and reviews, like other readers’ reviews, and build a
            history of everything you’ve loved—or hated.
          </p>
        </div>
      </section>

      {/* WEEKLY (LEFT) + RECOMMENDED (RIGHT) */}
      {!loading && recommended.length > 0 ? (
        <section className="rt-home-weekly-row">
          {/* LEFT: ReadTrack Weekly */}
          <div className="rt-home-weekly-left">
            <section className="rt-home-newsletter">
              <div className="rt-home-newsletter-header">
                <h3>ReadTrack Weekly</h3>
                <p>
                  A quick peek at the bookish world – new releases, prize lists,
                  and conversations about stories that matter.
                </p>
              </div>

              <div className="rt-home-newsletter-grid">
                <article className="rt-home-news-card">
                  <span className="rt-news-tag">News &amp; Interviews</span>

                  <h4 className="rt-news-main-title">
                    What are readers talking about this week?
                  </h4>

                  <ul className="rt-home-news-list">
                    <li className="rt-home-news-item">
                      <a
                        href="https://booktrib.com"
                        target="_blank"
                        rel="noreferrer"
                        className="rt-home-news-link"
                      >
                        BookTrib: Buzzy new fiction picks and under-the-radar
                        gems
                      </a>
                      <span className="rt-home-news-source">from BookTrib</span>
                    </li>

                    <li className="rt-home-news-item">
                      <a
                        href="https://thebookerprizes.com"
                        target="_blank"
                        rel="noreferrer"
                        className="rt-home-news-link"
                      >
                        Booker Prizes: Discover the latest longlists and
                        shortlists
                      </a>
                      <span className="rt-home-news-source">
                        via The Booker Prizes
                      </span>
                    </li>

                    <li className="rt-home-news-item">
                      <a
                        href="https://booktrib.com/category/reviews/"
                        target="_blank"
                        rel="noreferrer"
                        className="rt-home-news-link"
                      >
                        BookTrib Reviews: Critic and reader takes on new
                        releases
                      </a>
                      <span className="rt-home-news-source">
                        from BookTrib Reviews
                      </span>
                    </li>
                  </ul>

                  <button
                    className="rt-btn rt-btn-ghost rt-news-btn"
                    onClick={() =>
                      window.open('https://booktrib.com', '_blank', 'noopener')
                    }
                  >
                    Browse book news
                  </button>
                </article>
              </div>
            </section>
          </div>

          {/* RIGHT: Recommended for you */}
          <div className="rt-home-weekly-right">
            <section className="rt-home-section">
              <h3 className="rt-home-section-title">Recommended for you</h3>
              <div className="rt-home-horizontal-row">
                {recommended.map((b) => (
                  <div
                    key={b._id}
                    className="rt-home-cover-mini-card"
                    onClick={() => goToBook(b._id)}
                  >
                    <div className="rt-home-cover-mini">
                      {b.coverImageUrl ? (
                        <img src={b.coverImageUrl} alt={b.title} />
                      ) : (
                        <span>No cover</span>
                      )}
                    </div>
                    <div className="rt-home-cover-mini-meta">
                      <div className="rt-home-mini-title">{b.title}</div>
                      <div className="rt-home-mini-sub">by {b.author}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      ) : (
        /* If no recommendations yet, show Weekly full-width */
        <section className="rt-home-newsletter">
          <div className="rt-home-newsletter-header">
            <h3>ReadTrack Weekly</h3>
            <p>
              A quick peek at the bookish world – new releases, prize lists, and
              conversations about stories that matter.
            </p>
          </div>

          <div className="rt-home-newsletter-grid">
            <article className="rt-home-news-card">
              <span className="rt-news-tag">News &amp; Interviews</span>

              <h4 className="rt-news-main-title">
                What are readers talking about this week?
              </h4>

              <ul className="rt-home-news-list">
                <li className="rt-home-news-item">
                  <a
                    href="https://booktrib.com"
                    target="_blank"
                    rel="noreferrer"
                    className="rt-home-news-link"
                  >
                    BookTrib: Buzzy new fiction picks and under-the-radar gems
                  </a>
                  <span className="rt-home-news-source">from BookTrib</span>
                </li>

                <li className="rt-home-news-item">
                  <a
                    href="https://thebookerprizes.com"
                    target="_blank"
                    rel="noreferrer"
                    className="rt-home-news-link"
                  >
                    Booker Prizes: Discover the latest longlists and shortlists
                  </a>
                  <span className="rt-home-news-source">
                    via The Booker Prizes
                  </span>
                </li>

                <li className="rt-home-news-item">
                  <a
                    href="https://booktrib.com/category/reviews/"
                    target="_blank"
                    rel="noreferrer"
                    className="rt-home-news-link"
                  >
                    BookTrib Reviews: Critic and reader takes on new releases
                  </a>
                  <span className="rt-home-news-source">
                    from BookTrib Reviews
                  </span>
                </li>
              </ul>

              <button
                className="rt-btn rt-btn-ghost rt-news-btn"
                onClick={() =>
                  window.open('https://booktrib.com', '_blank', 'noopener')
                }
              >
                Browse book news
              </button>
            </article>
          </div>
        </section>
      )}

      {/* MAIN CONTENT ROWS BELOW */}

      {loading && <p>Loading your books...</p>}

      {!loading && user && continueReading.length > 0 && (
        <section className="rt-home-section">
          <h3 className="rt-home-section-title">Continue reading</h3>
          <div className="rt-home-horizontal-row">
            {continueReading.map((entry) => {
              const b = entry.book;
              if (!b) return null;
              const progress = entry.currentPage || 0;
              const pct =
                b.pages && b.pages > 0
                  ? Math.min(100, Math.round((progress / b.pages) * 100))
                  : null;
              return (
                <div
                  key={entry._id}
                  className="rt-home-cover-mini-card"
                  onClick={() => goToBook(b._id)}
                >
                  <div className="rt-home-cover-mini">
                    {b.coverImageUrl ? (
                      <img src={b.coverImageUrl} alt={b.title} />
                    ) : (
                      <span>No cover</span>
                    )}
                  </div>
                  <div className="rt-home-cover-mini-meta">
                    <div className="rt-home-mini-title">{b.title}</div>
                    {pct !== null && (
                      <div className="rt-home-mini-sub">
                        {progress} / {b.pages} pages ({pct}%)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!loading && popular.length > 0 && (
        <section className="rt-home-section">
          <h3 className="rt-home-section-title">Popular on ReadTrack</h3>
          <div className="rt-home-horizontal-row">
            {popular.map((b) => (
              <div
                key={b._id}
                className="rt-home-cover-mini-card"
                onClick={() => goToBook(b._id)}
              >
                <div className="rt-home-cover-mini">
                  {b.coverImageUrl ? (
                    <img src={b.coverImageUrl} alt={b.title} />
                  ) : (
                    <span>No cover</span>
                  )}
                </div>
                <div className="rt-home-cover-mini-meta">
                  <div className="rt-home-mini-title">{b.title}</div>
                  <div className="rt-home-mini-sub">by {b.author}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;