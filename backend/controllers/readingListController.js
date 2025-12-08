const User = require('../models/User');
const Book = require('../models/Book');

// Add book to reading list
exports.addToReadingList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;

    if (!bookId) return res.status(400).json({ message: "bookId is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.readingList.includes(bookId)) {
      return res.status(400).json({ message: "Book already in reading list" });
    }

    user.readingList.push(bookId);
    await user.save();

    res.json({ message: "Book added to reading list", readingList: user.readingList });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Remove book from reading list
exports.removeFromReadingList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;

    if (!bookId) return res.status(400).json({ message: "bookId is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.readingList = user.readingList.filter(
      (id) => id.toString() !== bookId.toString()
    );

    await user.save();

    res.json({ message: "Book removed", readingList: user.readingList });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get full reading list with book details
exports.getReadingList = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate("readingList");

    res.json(user.readingList);

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};