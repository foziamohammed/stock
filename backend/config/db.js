// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./stock.db'); // creates stock.db file if it doesn't exist

// Create a sample table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;

