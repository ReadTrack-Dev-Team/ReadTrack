import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import PasswordRequirements, { isPasswordValid } from '../components/PasswordRequirements';

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Registration step: 'register' or 'verify'
  const [step, setStep] = useState('register');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
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

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid(form.password)) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
      };
      const res = await apiClient.post('/api/auth/register', payload);
      
      if (res.data.requiresVerification) {
        // Move to verification step
        setStep('verify');
        startResendCooldown();
      } else {
        // Direct login (shouldn't happen with new flow, but just in case)
        login(res.data);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/api/auth/verify-email', {
        email: form.email,
        code: verificationCode,
      });
      
      // Verification successful, log in the user
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

  const handleResend = async () => {
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

  // Verification step UI
  if (step === 'verify') {
    return (
      <div className="rt-container">
        <div className="rt-form-card">
          <h2 className="rt-page-title">Verify Your Email</h2>
          <p style={{ marginBottom: '1rem', color: '#555', fontSize: '0.9rem' }}>
            We've sent a 6-digit verification code to <strong>{form.email}</strong>.
            Please enter it below. The code expires in 10 minutes.
          </p>
          <form onSubmit={handleVerify}>
            <div className="rt-form-field">
              <label className="rt-form-label">Verification Code</label>
              <input
                type="text"
                className="rt-form-input verification-code-input"
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
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="rt-btn-link"
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
              onClick={() => setStep('register')}
              className="rt-btn-link"
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ← Back to registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration form UI
  return (
    <div className="rt-container">
      <div className="rt-form-card">
        <h2 className="rt-page-title">Create your ReadTrack account</h2>
        <form onSubmit={handleSubmit}>
          <div className="rt-form-field">
            <label className="rt-form-label">Name</label>
            <input
              type="text"
              name="name"
              className="rt-form-input"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
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
            <PasswordRequirements password={form.password} />
          </div>
          <div className="rt-form-field">
            <label className="rt-form-label">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              className="rt-form-input"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          {error && <div className="rt-form-error">{error}</div>}
          <button
            type="submit"
            className="rt-btn rt-btn-primary"
            style={{ marginTop: '0.6rem', width: '100%' }}
            disabled={loading || !isPasswordValid(form.password)}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p style={{ marginTop: '0.8rem', fontSize: '0.85rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;