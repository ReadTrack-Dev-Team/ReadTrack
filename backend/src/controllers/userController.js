const User = require('../models/User');
const Review = require('../models/Review');
const ReadingList = require('../models/ReadingList');

// GET /api/users  (admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while fetching users',
    });
  }
};

// DELETE /api/users/:id  (admin, cannot delete admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    await Review.deleteMany({ user: user._id });
    await ReadingList.deleteMany({ user: user._id });

    await user.deleteOne();

    return res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      message: error.message || 'Server error while deleting user',
    });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
};