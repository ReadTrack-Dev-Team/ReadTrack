import React from 'react';

/**
 * Password requirements checker component
 * Shows password requirements with red/green indicators
 */
const PasswordRequirements = ({ password }) => {
  const requirements = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'Contains uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Contains lowercase letter (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      label: 'Contains a number (0-9)',
      met: /[0-9]/.test(password),
    },
    {
      label: 'Contains special character (!@#$%^&*)',
      met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    },
  ];

  const allMet = requirements.every((r) => r.met);

  return (
    <div className="password-requirements">
      <p className="password-requirements-title">Password must contain:</p>
      <ul className="password-requirements-list">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`password-requirement ${req.met ? 'met' : 'unmet'}`}
          >
            <span className="requirement-icon">{req.met ? '✓' : '✗'}</span>
            <span className="requirement-label">{req.label}</span>
          </li>
        ))}
      </ul>
      {allMet && (
        <p className="password-valid-message">✓ Password meets all requirements</p>
      )}
    </div>
  );
};

/**
 * Check if password meets all requirements
 */
export const isPasswordValid = (password) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  );
};

export default PasswordRequirements;
