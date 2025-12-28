import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const AdminUsersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!user) navigate('/login');
    else if (!user.isAdmin) navigate('/');
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        'Delete this user? All their reviews and shelves will be removed.'
      )
    )
      return;
    try {
      await apiClient.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="rt-container">
      <h2 className="rt-page-title">Admin – Users</h2>
      <div
        style={{
          background: '#fff',
          borderRadius: '6px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {users.map((u) => (
          <div
            key={u._id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.6rem 0.8rem',
              borderTop: '1px solid #eee',
              fontSize: '0.9rem',
            }}
          >
            <div>
              <div>
                {u.name}{' '}
                {u.isAdmin && (
                  <span
                    className="rt-admin-badge"
                    style={{ marginLeft: '0.3rem' }}
                  >
                    Admin
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555' }}>
                {u.email}
              </div>
            </div>
            {!u.isAdmin && (
              <button
                className="rt-btn rt-btn-ghost"
                style={{ fontSize: '0.8rem' }}
                onClick={() => handleDelete(u._id)}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersPage;