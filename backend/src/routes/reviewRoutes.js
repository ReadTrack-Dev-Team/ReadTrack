const express = require('express');
const router = express.Router();

const {
  upsertReview,
  getReviewsForBook,
  deleteReview,
  toggleLikeReview,
} = require('../controllers/reviewController');

const protect = require('../middleware/authMiddleware');

// public
router.get('/book/:bookId', getReviewsForBook);

// logged-in
router.post('/book/:bookId', protect, upsertReview);
router.delete('/:reviewId', protect, deleteReview);
router.post('/:reviewId/like', protect, toggleLikeReview);

module.exports = router;