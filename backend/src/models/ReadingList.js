const mongoose = require('mongoose');

const ReadingListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    status: {
      type: String,
      enum: ['WANT_TO_READ', 'READING', 'READ'],
      required: true,
      default: 'WANT_TO_READ',
    },
    currentPage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// one entry per user+book
ReadingListSchema.index({ user: 1, book: 1 }, { unique: true });

const ReadingList = mongoose.model('ReadingList', ReadingListSchema);

module.exports = ReadingList;