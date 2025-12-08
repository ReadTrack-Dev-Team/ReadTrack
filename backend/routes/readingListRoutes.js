const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const readingListController = require('../controllers/readingListController');

// Add a book to reading list
router.post('/add', protect, readingListController.addToReadingList);

// Remove a book from reading list
router.post('/remove', protect, readingListController.removeFromReadingList);

// Get user's full reading list
router.get('/', protect, readingListController.getReadingList);

module.exports = router;
