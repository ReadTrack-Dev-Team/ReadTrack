require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Book = require('./models/Book');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB for seeding');

  // delete or keep as you like
  await User.deleteMany({});
  await Book.deleteMany({});

  const admin = await User.create({ name: 'Admin', email: 'admin@readtrack.local', password: 'admin123', role: 'admin' });
  const user = await User.create({ name: 'User', email: 'user@readtrack.local', password: 'user123', role: 'user' });

  await Book.create([
    { title: 'Dune', author: 'Frank Herbert', genres: ['Sci-Fi'], description: 'Classic sci-fi', createdBy: admin._id },
    { title: 'The Alchemist', author: 'Paulo Coelho', genres: ['Philosophy'], description: 'Popular' , createdBy: admin._id }
  ]);

  console.log('Seed completed');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });

