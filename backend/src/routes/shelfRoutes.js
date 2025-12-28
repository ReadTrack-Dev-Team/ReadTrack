const express = require('express');
const router = express.Router();

const {
  getMyShelves,
  upsertShelfEntry,
  removeFromShelves,
} = require('../controllers/shelfController');

const protect = require('../middleware/authMiddleware');

router.get('/my', protect, getMyShelves);
router.post('/:bookId', protect, upsertShelfEntry);
router.delete('/:bookId', protect, removeFromShelves);

module.exports = router;