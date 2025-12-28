import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import PasswordRequirements, { isPasswordValid } from '../components/PasswordRequirements';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Steps: 'login', 'verify', 'forgot', 'forgot-verify', 'reset-password'
  const [step, setStep] = useState('login');

  const [form, setForm] = useState({ email: '', password: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/api/auth/login', form);
      login(res.data);
      navigate('/');
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      
      // Check if user needs verification
      if (data?.requiresVerification) {
        setStep('verify');
        startResendCooldown();
      } else {
        const msg = data?.message || 'Login failed';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle email verification (for unverified users trying to login)
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/api/auth/verify-email', {
        email: form.email,
        code: verificationCode,
      });
      
      login(res.data);
      navigate('/');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Verification failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/api/auth/resend-verification', {
        email: form.email,
      });
      startResendCooldown();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to resend code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password - send reset code
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/api/auth/forgot-password', {
        email: forgotEmail,
      });
      setStep('forgot-verify');
      startResendCooldown();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to send reset code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Verify reset code
  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/api/auth/verify-reset-code', {
        email: forgotEmail,
        code: resetCode,
      });
      
      if (res.data.codeValid) {
        setStep('reset-password');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Invalid or expired code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendResetCode = async () => {
    if (resendCooldown > 0) return;
    
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/api/auth/forgot-password', {
        email: forgotEmail,
      });
      startResendCooldown();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to resend code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/reset-password', {
        email: forgotEmail,
        code: resetCode,
        newPassword,
      });
      
      login(res.data);
      navigate('/');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to reset password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Verification step UI (for unverified users)
  if (step === 'verify') {
    return (
      <div className="rt-container">
        <div className="rt-form-card">
          <h2 className="rt-page-title">Verify Your Email</h2>
          <p style={{ marginBottom: '1rem', color: '#555', fontSize: '0.9rem' }}>
            Your email is not verified. We've sent a 6-digit code to <strong>{form.email}</strong>.
            Please enter it below.
          </p>
          <form onSubmit={handleVerify}>
            <div className="rt-form-field">
              <label className="rt-form-label">Verification Code</label>
              <input
                type="text"
                className="rt-form-input"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
                style={{ 
                  fontSize: '1.5rem', 
                  letterSpacing: '0.5rem', 
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              />
            </div>
            {error && <div className="rt-form-error">{error}</div>}
            <button
              type="submit"
              className="rt-btn rt-btn-primary"
              style={{ marginTop: '0.6rem', width: '100%' }}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              onClick={handleResendVerification}
              disabled={resendCooldown > 0 || loading}
              style={{
                background: 'none',
                border: 'none',
                color: resendCooldown > 0 ? '#999' : '#00635d',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
                fontSize: '0.85rem',
              }}
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Didn't receive a code? Resend"}
            </button>
          </div>
          <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
            <button
              onClick={() => { setStep('login'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password - enter email
  if (step === 'forgot') {
    return (
      <div className="rt-container">
        <div className="rt-form-card">
          <h2 className="rt-page-title">Forgot Password</h2>
          <p style={{ marginBottom: '1rem', color: '#555', fontSize: '0.9rem' }}>
            Enter your email address and we'll send you a code to reset your password.
          </p>
          <form onSubmit={handleForgotPassword}>
            <div className="rt-form-field">
              <label className="rt-form-label">Email</label>
              <input
                type="email"
                className="rt-form-input"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
            {error && <div className="rt-form-error">{error}</div>}
            <button
              type="submit"
              className="rt-btn rt-btn-primary"
              style={{ marginTop: '0.6rem', width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
          <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
            <button
              onClick={() => { setStep('login'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password - verify code
  if (step === 'forgot-verify') {
    return (
      <div className="rt-container">
        <div className="rt-form-card">
          <h2 className="rt-page-title">Enter Reset Code</h2>
          <p style={{ marginBottom: '1rem', color: '#555', fontSize: '0.9rem' }}>
            We've sent a 6-digit code to <strong>{forgotEmail}</strong>.
            Enter it below to reset your password. The code expires in 10 minutes.
          </p>
          <form onSubmit={handleVerifyResetCode}>
            <div className="rt-form-field">
              <label className="rt-form-label">Reset Code</label>
              <input
                type="text"
                className="rt-form-input"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
                style={{ 
                  fontSize: '1.5rem', 
                  letterSpacing: '0.5rem', 
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              />
            </div>
            {error && <div className="rt-form-error">{error}</div>}
            <button
              type="submit"
              className="rt-btn rt-btn-primary"
              style={{ marginTop: '0.6rem', width: '100%' }}
              disabled={loading || resetCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              onClick={handleResendResetCode}
              disabled={resendCooldown > 0 || loading}
              style={{
                background: 'none',
                border: 'none',
                color: resendCooldown > 0 ? '#999' : '#00635d',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
                fontSize: '0.85rem',
              }}
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Didn't receive a code? Resend"}
            </button>
          </div>
          <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
            <button
              onClick={() => { setStep('forgot'); setError(''); setResetCode(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reset password - enter new password
  if (step === 'reset-password') {
    return (
      <div className="rt-container">
        <div className="rt-form-card">
          <h2 className="rt-page-title">Set New Password</h2>
          <p style={{ marginBottom: '1rem', color: '#555', fontSize: '0.9rem' }}>
            Enter your new password below.
          </p>
          <form onSubmit={handleResetPassword}>
            <div className="rt-form-field">
              <label className="rt-form-label">New Password</label>
              <div className="rt-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="rt-form-input rt-password-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="rt-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <PasswordRequirements password={newPassword} />
            </div>
            <div className="rt-form-field">
              <label className="rt-form-label">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="rt-form-input"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
              {confirmNewPassword && newPassword !== confirmNewPassword && (
                <div className="rt-form-error">Passwords do not match</div>
              )}
            </div>
            {error && <div className="rt-form-error">{error}</div>}
            <button
              type="submit"
              className="rt-btn rt-btn-primary"
              style={{ marginTop: '0.6rem', width: '100%' }}
              disabled={loading || !isPasswordValid(newPassword) || newPassword !== confirmNewPassword}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
          <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
            <button
              onClick={() => { setStep('login'); setError(''); setNewPassword(''); setConfirmNewPassword(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: Login form
  return (
    <div className="rt-container">
      <div className="rt-form-card">
        <h2 className="rt-page-title">Login to ReadTrack</h2>
        <form onSubmit={handleSubmit}>
          <div className="rt-form-field">
            <label className="rt-form-label">Email</label>
            <input
              type="email"
              name="email"
              className="rt-form-input"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="rt-form-field">
            <label className="rt-form-label">Password</label>
            <div className="rt-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="rt-form-input rt-password-input"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="rt-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <div className="rt-form-error">{error}</div>}
          <button
            type="submit"
            className="rt-btn rt-btn-primary"
            style={{ marginTop: '0.6rem', width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
          <button
            onClick={() => { setStep('forgot'); setError(''); setForgotEmail(form.email); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#00635d',
              cursor: 'pointer',
              fontSize: '0.85rem',
              textDecoration: 'underline',
            }}
          >
            Forgot Password?
          </button>
        </div>
        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
