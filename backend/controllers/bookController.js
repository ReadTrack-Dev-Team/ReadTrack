const Book = require('../models/Book');
const User = require('../models/User');

// GET /api/books?search=&page=&limit=&listType=
exports.getBooks = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 50, listType } = req.query;
    const q = search.trim();
    const filter = {};

    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { author: new RegExp(q, 'i') },
        { genres: new RegExp(q, 'i') }
      ];
    }

    if (listType) {
      filter.listType = listType;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const books = await Book.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/books/:id
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('reviews.user', 'name email');
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin only - create a book
// POST /api/books
exports.createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      description = '',
      genres = [],
      coverUrl = '',
      listType = 'Want to Read',
      totalPages = 0
    } = req.body;

    if (!title || !author) return res.status(400).json({ message: 'Title and author are required' });

    const book = new Book({
      title,
      author,
      description,
      genres,
      coverUrl,
      listType,
      totalPages,
      currentPage: 0,
      createdBy: req.user.id
    });

    await book.save();
    res.status(201).json({ message: 'Book created', book });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/books/:id
exports.updateBook = async (req, res) => {
  try {
    const data = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    Object.assign(book, data);
    await book.save();
    res.json({ message: 'Book updated', book });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/books/:id
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    // Remove book from user reading lists
    await User.updateMany({ readingList: book._id }, { $pull: { readingList: book._id } });
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Add book to user's reading list
// POST /api/books/:id/reading-list
exports.addToReadingList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const bookId = req.params.id;
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.readingList.includes(bookId)) return res.status(400).json({ message: 'Already in reading list' });

    user.readingList.push(bookId);
    await user.save();
    res.json({ message: 'Added to reading list', readingList: user.readingList });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/books/reading-list
exports.getReadingList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('readingList');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.readingList);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update reading progress
// PUT /api/books/:id/progress
exports.updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const bookId = req.params.id;

    if (progress == null) {
      return res.status(400).json({ message: "progress required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if book is in reading list
    if (!user.readingList.includes(bookId)) {
      return res.status(404).json({ message: "Book not in reading list" });
    }

    // Update book with current progress (store it in the book document)
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    book.currentPage = progress;
    await book.save();

    res.json({ message: "Progress updated", progress, bookId });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// GET /api/books/:id/progress
exports.getProgress = async (req, res) => {
  try {
    const bookId = req.params.id;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if book is in reading list
    if (!user.readingList.includes(bookId)) {
      return res.status(404).json({ message: "Book not in reading list" });
    }

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    res.json({ progress: book.currentPage || 0, totalPages: book.totalPages || 0 });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/books/:id/review
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const existing = book.reviews.find(r => r.user?.toString() === req.user.id);
    if (existing) return res.status(400).json({ message: 'You already reviewed this book' });

    const review = { user: req.user.id, name: req.user.email || req.user.id, rating, comment };
    book.reviews.push(review);

    // Update average rating
    const total = book.reviews.reduce((s, r) => s + (r.rating || 0), 0);
    book.averageRating = total / book.reviews.length;

    await book.save();
    res.status(201).json({ message: 'Review added', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

