const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Existing routes (KEEP THESE)
router.post('/register', registerUser);
router.post('/login', loginUser);

// NEW ROUTES FOR MEMBER 3 (ADD THESE BELOW)
router.get('/profile', protect, (req, res) => {
  res.json({ message: "Profile accessed", user: req.user });
});

router.get('/admin/check', protect, adminOnly, (req, res) => {
  res.json({ message: "Admin verified" });
});

module.exports = router;
