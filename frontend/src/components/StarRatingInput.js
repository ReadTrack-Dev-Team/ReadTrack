import React from 'react';

const StarRatingInput = ({ value, onChange }) => {
  const handleClick = (newValue) => {
    onChange(newValue);
  };

  return (
    <div style={{ display: 'inline-flex', gap: '0.1rem', cursor: 'pointer' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => handleClick(star)}
          style={{
            color: star <= value ? '#e59819' : '#ccc',
            fontSize: '1.1rem',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRatingInput;