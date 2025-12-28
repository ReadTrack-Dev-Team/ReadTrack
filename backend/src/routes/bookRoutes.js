const express = require('express');
const router = express.Router();

const {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  getDistinctGenres,
  getSimilarBooks,
  getRecommendedForUser,
} = require('../controllers/bookController');

const protect = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

// ORDER MATTERS! Put specific routes before "/:id"

// Public
router.get('/', getBooks);
router.get('/genres', getDistinctGenres);

// Private (needs logged-in user)
router.get('/me/recommended', protect, getRecommendedForUser);

// Public routes that use :id
router.get('/:id/similar', getSimilarBooks);
router.get('/:id', getBookById);

// Admin-only
router.post('/', protect, admin, createBook);
router.put('/:id', protect, admin, updateBook);
router.delete('/:id', protect, admin, deleteBook);

module.exports = router;