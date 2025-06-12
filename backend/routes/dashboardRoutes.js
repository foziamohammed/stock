const express = require('express');
const router = express.Router();
const Book = require('../models/Books');

// Get book counts by category for the dashboard graph
router.get('/books-by-category', async (req, res) => {
  try {
    const books = await Book.findAll();
    const categories = {};

    // Aggregate books by category
    books.forEach(book => {
      if (categories[book.category]) {
        categories[book.category] += book.amount;
      } else {
        categories[book.category] = book.amount;
      }
    });

    // Convert to array format for frontend graph
    const result = Object.keys(categories).map(category => ({
      category,
      amount: categories[category],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;