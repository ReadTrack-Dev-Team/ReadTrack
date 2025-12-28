const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    coverImageUrl: {
      type: String,
      required: [true, 'Cover image URL is required'],
    },
    genres: [
      {
        type: String,
      },
    ],
    publicationYear: {
      type: Number,
    },
    pages: {
      type: Number,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;