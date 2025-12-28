import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';

  // if your admin email is different, change it here
  const isAdmin =
    user &&
    (user.role === 'admin' || user.email === 'admin@readtrack.com');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const goToAdmin = () => {
    navigate('/admin/books'); // change path if your admin route is different
  };

  return (
    <nav className="rt-navbar">
      <div className="rt-navbar-inner">
        {/* LEFT SIDE: brand + standard links */}
        <div className="rt-navbar-left">
          <Link to="/" className="rt-navbar-brand">
            ReadTrack
          </Link>

          {!isHome && (
            <>
              <Link to="/books" className="rt-navbar-link">
                Books
              </Link>
              {user && (
                <Link to="/my-shelves" className="rt-navbar-link">
                  My Shelves
                </Link>
              )}
            </>
          )}
        </div>

        {/* RIGHT SIDE: admin, user, logout */}
        <div className="rt-navbar-right">
          {user ? (
            <>
              {isAdmin && (
                <button
                  type="button"
                  className="rt-btn rt-btn-secondary rt-btn-pill rt-btn-admin"
                  onClick={goToAdmin}
                >
                  Admin Panel
                </button>
              )}

              <Link to="/profile" className="rt-navbar-user">
                {user.name}
              </Link>

              <button
                type="button"
                className="rt-btn rt-btn-primary rt-btn-pill"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="rt-btn rt-btn-secondary rt-btn-pill"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button
                type="button"
                className="rt-btn rt-btn-primary rt-btn-pill"
                onClick={() => navigate('/register')}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;