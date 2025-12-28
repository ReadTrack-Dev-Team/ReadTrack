# 📚 ReadTrack – A Personal Reading Tracker (MERN)

ReadTrack is a full-stack web application that helps users track their reading journey.  
Users can browse books, add them to shelves (Want to Read / Reading / Read), update reading progress, rate and review books, and see popular and recommended titles.  
An admin user can manage the global book catalog.

---

## ✨ Features

### 👤 Authentication & Users
- User registration with name, email and password
- Secure login using JWT
- Logout and auth-protected routes
- Profile page with:
  - Name
  - Bio
  - Profile picture URL
  - Favourite genres

### 📚 Book Catalog
- Browse all books in a **card-based grid**
- Search by **title** or **author**
- Filter by **genre**
- Sort by:
  - Title (A–Z)
  - Rating (high → low)
  - Most recently added
- Book details page showing:
  - Cover image
  - Title, author, description
  - Genres, publication year, pages
  - Average rating and rating count
  - Similar books section

### 📖 Reading Tracking & Shelves
- Default shelves:
  - **Want to Read**
  - **Reading**
  - **Read**
- Set shelf status from the book details page
- Update current page when a book is in **Reading**
- **My Shelves** page (only for logged-in users) with tabs:
  - Want to Read / Reading / Read
- Reading statistics:
  - Total books read
  - Estimated total pages read

### ⭐ Ratings & Reviews
- Submit a **1–5 star rating** for each book
- Write, edit and delete your own reviews
- View all reviews for a book
- Like / unlike reviews (one like per user per review)

### 🏠 Home Experience
- **Public home page (not logged in):**
  - Intro hero section
  - “Browse Books” button
  - “Popular on ReadTrack” – top 5 highest-rated books
- **Logged-in home page:**
  - Hero card with “Go to My Shelves” button
  - Quick stats (currently reading, recommendations)
  - “ReadTrack Weekly” info panel
  - “Recommended for you” based on favourite genres
  - “Popular on ReadTrack” section

### 👨‍💼 Admin Panel
- Dedicated admin role
- Admin-only Panel (visible only to admin user)
- Admin can:
  - Add books (title, author, description, genres, publication year, pages, cover image URL)
  - View list of all books
  - Delete books

---

## 🏗 Tech Stack

**Frontend**
- React.js
- React Router
- Axios
- Custom CSS (pastel themed, responsive layout)

**Backend**
- Node.js
- Express.js
- Mongoose (MongoDB ODM)
- JSON Web Token (JWT)
- bcrypt (password hashing)

**Database**
- MongoDB

---


