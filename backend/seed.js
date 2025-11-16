require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Book = require('./models/Book');

const MONGO = process.env.MONGO_URI;
mongoose.connect(MONGO).then(()=> console.log('Connected for seeding')).catch(e=> { console.error(e); process.exit(1); });

async function seed() {
  try {
    // create admin (email must be unique)
    const admin = await User.create({ name:'Admin', email:'admin@example.com', password:'admin123', role:'admin' });
    const books = await Book.insertMany([
      { title: 'Dune', author: 'Frank Herbert', genres:['Sci-Fi'], synopsis:'Epic sci-fi classic', createdBy: admin._id },
      { title: 'Pride and Prejudice', author: 'Jane Austen', genres:['Romance'], synopsis:'Classic novel', createdBy: admin._id }
    ]);
    console.log('Seeded', { admin, books });
    process.exit(0);
  } catch(err){
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
