const Book = require('../models/Book');

// @desc   Create a new book (admin)
// @route  POST /api/books
// @access Admin
const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      coverImageUrl,
      genres,
      publicationYear,
      pages,
    } = req.body;

    const book = new Book({
      title,
      author,
      description,
      coverImageUrl,
      genres: Array.isArray(genres)
        ? genres
        : typeof genres === 'string' && genres.length > 0
        ? genres.split(',').map((g) => g.trim())
        : [],
      publicationYear,
      pages,
    });

    const saved = await book.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Create book error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while creating book',
    });
  }
};

// @desc   Get all books with optional search / genre / sort
// @route  GET /api/books
// @access Public
const getBooks = async (req, res) => {
  try {
    const { search, genre, sort } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    if (genre) {
      filter.genres = { $in: [genre] };
    }

    let sortOption = { title: 1 };
    if (sort === 'rating') {
      sortOption = { averageRating: -1, ratingCount: -1 };
    } else if (sort === 'recent') {
      sortOption = { createdAt: -1 };
    }

    const books = await Book.find(filter).sort(sortOption);
    return res.json(books);
  } catch (error) {
    console.error('Get books error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while fetching books',
    });
  }
};

// @desc   Get a single book by id
// @route  GET /api/books/:id
// @access Public
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.json(book);
  } catch (error) {
    console.error('Get book by id error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while fetching book',
    });
  }
};

// @desc   Update book
// @route  PUT /api/books/:id
// @access Admin
const updateBook = async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      coverImageUrl,
      genres,
      publicationYear,
      pages,
    } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (description !== undefined) book.description = description;
    if (coverImageUrl !== undefined) book.coverImageUrl = coverImageUrl;
    if (genres !== undefined) {
      book.genres = Array.isArray(genres)
        ? genres
        : typeof genres === 'string' && genres.length > 0
        ? genres.split(',').map((g) => g.trim())
        : [];
    }
    if (publicationYear !== undefined) book.publicationYear = publicationYear;
    if (pages !== undefined) book.pages = pages;

    const saved = await book.save();
    return res.json(saved);
  } catch (error) {
    console.error('Update book error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while updating book',
    });
  }
};

// @desc   Delete book
// @route  DELETE /api/books/:id
// @access Admin
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    await book.deleteOne();
    return res.json({ message: 'Book removed' });
  } catch (error) {
    console.error('Delete book error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while deleting book',
    });
  }
};

// @desc   Distinct genres from existing books
// @route  GET /api/books/genres
// @access Public
const getDistinctGenres = async (req, res) => {
  try {
    const genres = await Book.distinct('genres');
    const cleaned = genres.filter(
      (g) => g && typeof g === 'string' && g.trim() !== ''
    );
    cleaned.sort((a, b) => a.localeCompare(b));
    return res.json(cleaned);
  } catch (error) {
    console.error('Get genres error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while fetching genres',
    });
  }
};

// @desc   Similar books based on same author or overlapping genres
// @route  GET /api/books/:id/similar
// @access Public
const getSimilarBooks = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const query = {
      _id: { $ne: book._id },
      $or: [],
    };

    if (book.author) {
      query.$or.push({ author: book.author });
    }
    if (book.genres && book.genres.length > 0) {
      query.$or.push({ genres: { $in: book.genres } });
    }

    if (query.$or.length === 0) {
      return res.json([]);
    }

    const similar = await Book.find(query)
      .sort({ averageRating: -1 })
      .limit(6);

    return res.json(similar);
  } catch (error) {
    console.error('Get similar books error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while fetching similar books',
    });
  }
};

// @desc   Recommended books based on user's favouriteGenres
// @route  GET /api/books/me/recommended
// @access Private
const getRecommendedForUser = async (req, res) => {
  try {
    const user = req.user;

    let query = {};
    if (user && user.favouriteGenres && user.favouriteGenres.length > 0) {
      query = { genres: { $in: user.favouriteGenres } };
    }

    const books = await Book.find(query)
      .sort({ averageRating: -1, ratingCount: -1 })
      .limit(10);

    return res.json(books);
  } catch (error) {
    console.error('Get recommended error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while fetching recommendations',
    });
  }
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  getDistinctGenres,
  getSimilarBooks,
  getRecommendedForUser,
};