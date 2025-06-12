const express = require('express');
const router = express.Router();
const Book = require('../models/Books');

// Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.findAll();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Add a new book
router.post('/', async (req, res) => {
  const { name, category, amount, cost, date } = req.body;
  try {
    const book = await Book.create({ name, category, amount, cost, date });
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// Update a book
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, amount, cost, date } = req.body;
  try {
    const book = await Book.findByPk(id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    await book.update({ name, category, amount, cost, date });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Delete a book
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Book.findByPk(id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    await book.destroy();
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

module.exports = router;