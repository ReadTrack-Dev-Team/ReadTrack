const ReadingList = require('../models/ReadingList');
const Book = require('../models/Book');

// GET /api/shelves/my
const getMyShelves = async (req, res) => {
  try {
    const entries = await ReadingList.find({ user: req.user._id })
      .populate('book')
      .sort({ updatedAt: -1 });

    return res.json(entries);
  } catch (error) {
    console.error('Get my shelves error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while fetching shelves',
    });
  }
};

// POST /api/shelves/:bookId  { status, currentPage? }
const upsertShelfEntry = async (req, res) => {
  try {
    const { status, currentPage } = req.body;
    const { bookId } = req.params;

    if (!['WANT_TO_READ', 'READING', 'READ'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const update = { status };
    if (typeof currentPage === 'number') {
      update.currentPage = currentPage;
    }

    const entry = await ReadingList.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    ).populate('book');

    return res.json(entry);
  } catch (error) {
    console.error('Upsert shelf entry error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while updating shelf',
    });
  }
};

// DELETE /api/shelves/:bookId
const removeFromShelves = async (req, res) => {
  try {
    const { bookId } = req.params;

    await ReadingList.findOneAndDelete({
      user: req.user._id,
      book: bookId,
    });

    return res.json({ message: 'Removed from shelves' });
  } catch (error) {
    console.error('Remove from shelves error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while removing from shelf',
    });
  }
};

module.exports = {
  getMyShelves,
  upsertShelfEntry,
  removeFromShelves,
};