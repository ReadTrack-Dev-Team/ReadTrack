const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Reading List
router.get('/reading-list', protect, bookController.getReadingList);
router.post('/:id/reading-list', protect, bookController.addToReadingList);

// Reading Progress
router.put('/:id/progress', protect, bookController.updateProgress);
router.get('/:id/progress', protect, bookController.getProgress);

// Reviews
router.post('/:id/review', protect, bookController.addReview);

// Public
router.get('/', bookController.getBooks);
router.get('/:id', bookController.getBookById);

// Admin CRUD
router.post('/', protect, adminOnly, bookController.createBook);
router.put('/:id', protect, adminOnly, bookController.updateBook);
router.delete('/:id', protect, adminOnly, bookController.deleteBook);

module.exports = router;



