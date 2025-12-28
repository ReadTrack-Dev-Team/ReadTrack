const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ isAdmin: true });

    if (existingAdmin) {
      console.log('✅ Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log('❌ ADMIN_EMAIL or ADMIN_PASSWORD not set in .env');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'ReadTrack Admin',
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      isAdmin: true,
    });

    console.log('🎉 Admin created successfully:');
    console.log('Email:', admin.email);
    console.log('Use ADMIN_PASSWORD from .env to log in.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();