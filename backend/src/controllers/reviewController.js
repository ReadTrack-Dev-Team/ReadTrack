const Review = require('../models/Review');
const Book = require('../models/Book');

// helper to recalc rating
const recalculateBookRating = async (bookId) => {
  const stats = await Review.aggregate([
    { $match: { book: bookId } },
    {
      $group: {
        _id: '$book',
        averageRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const book = await Book.findById(bookId);
  if (!book) return;

  if (stats.length > 0) {
    book.averageRating = stats[0].averageRating;
    book.ratingCount = stats[0].ratingCount;
  } else {
    book.averageRating = 0;
    book.ratingCount = 0;
  }

  await book.save();
};

// POST /api/reviews/book/:bookId
const upsertReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { bookId } = req.params;

    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    const existing = await Review.findOne({
      book: bookId,
      user: req.user._id,
    });

    if (existing) {
      existing.rating = rating;
      if (comment !== undefined) existing.comment = comment;
      const saved = await existing.save();
      await recalculateBookRating(existing.book);
      return res.json(saved);
    } else {
      const review = await Review.create({
        book: bookId,
        user: req.user._id,
        rating,
        comment: comment || '',
      });
      await recalculateBookRating(review.book);
      return res.status(201).json(review);
    }
  } catch (error) {
    console.error('Upsert review error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while saving review',
    });
  }
};

// GET /api/reviews/book/:bookId
const getReviewsForBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const reviews = await Review.find({ book: bookId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while fetching reviews',
    });
  }
};

// DELETE /api/reviews/:reviewId  (owner or admin)
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Not allowed to delete this review' });
    }

    const bookId = review.book;
    await review.deleteOne();
    await recalculateBookRating(bookId);

    return res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while deleting review',
    });
  }
};

// POST /api/reviews/:reviewId/like
const toggleLikeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const userId = req.user._id.toString();
    const index = review.likes.findIndex((u) => u.toString() === userId);

    if (index === -1) {
      review.likes.push(req.user._id);
    } else {
      review.likes.splice(index, 1);
    }

    const saved = await review.save();
    return res.json(saved);
  } catch (error) {
    console.error('Toggle like error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while liking review',
    });
  }
};

module.exports = {
  upsertReview,
  getReviewsForBook,
  deleteReview,
  toggleLikeReview,
};