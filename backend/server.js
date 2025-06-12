const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Welcome to the Stock API!');
});

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'db/database.sqlite',
});

const Book = sequelize.define('Book', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  cost: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
});

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bookName: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  customerName: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false }, // Added category field
  orderDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
});

const Activity = sequelize.define('Activity', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.STRING, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ alter: true }); // Use alter to update schema
    console.log('Database synced');
    console.log('Database initialized without seeded data');
    app.listen(5000, () => console.log('Server running on port 5000'));
  } catch (err) {
    console.error('Failed to connect to database:', err);
  }
};

app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.findAll();
    res.json(books);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const activities = await Activity.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    res.json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.get('/api/chart-data', async (req, res) => {
  try {
    const books = await Book.findAll();
    const categoryData = books.reduce((acc, book) => {
      const category = book.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (book.amount || 0);
      return acc;
    }, {});
    const chartData = {
      labels: Object.keys(categoryData),
      datasets: [
        {
          label: 'Number of Books per Category',
          data: Object.values(categoryData),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        },
      ],
    };
    res.json(chartData);
  } catch (err) {
    console.error('Error fetching chart data:', err);
    res.status(500).json({ error: 'Failed to fetch chart data', details: err.message });
  }
});

app.get('/api/dashboard-summary', async (req, res) => {
  try {
    const books = await Book.findAll();
    const orders = await Order.findAll();
    const totalBooks = books.reduce((sum, book) => sum + (book.amount || 0), 0);
    const lowStock = books.filter(book => book.amount < 50).length;
    const totalOrders = orders.length;
    const summary = { totalBooks, lowStock, totalOrders };
    res.json(summary);
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary', details: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  console.log('Received POST /api/books:', req.body);
  try {
    const { name, category, amount, cost, date } = req.body;
    if (!name || !category || !amount || !cost || !date) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    const book = await Book.create({ name, category, amount, cost, date });
    await Activity.create({
      type: 'book_added',
      message: `New book "${name}" added to inventory`,
    });
    res.status(201).json(book);
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).json({ error: 'Failed to add book', details: err.message });
  }
});

app.put('/api/books/:id', async (req, res) => {
  console.log(`Received PUT /api/books/${req.params.id}:`, req.body);
  try {
    const { id } = req.params;
    const { name, category, amount, cost, date } = req.body;
    if (!name || !category || !amount || !cost || !date) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    await book.update({ name, category, amount, cost, date });
    await Activity.create({
      type: 'book_updated',
      message: `Book "${name}" updated`,
    });
    res.status(200).json(book);
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ error: 'Failed to update book', details: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  console.log(`[${new Date().toISOString()}] Received POST /api/orders:`, req.body);
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is empty or invalid' });
    }
    const { bookName, quantity, customerName, category, orderDate, status } = req.body;
    if (!bookName || !quantity || !customerName || !category || !orderDate || !status) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(orderDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    const order = await Order.create({
      bookName: bookName.trim(),
      quantity,
      customerName,
      category: category.trim(), // Added category
      orderDate,
      status,
    });
    await Activity.create({
      type: 'order_received',
      message: `New order received from ${customerName} for ${bookName} (${category})`,
    });
    res.status(201).json(order);
  } catch (err) {
    console.error('Error adding order:', err);
    res.status(500).json({ error: 'Failed to add order', details: err.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  console.log(`Received PUT /api/orders/${req.params.id}:`, req.body);
  try {
    const { id } = req.params;
    const { bookName, quantity, customerName, category, orderDate, status } = req.body;
    if (!bookName || !quantity || !customerName || !category || !orderDate || !status) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(orderDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    await order.update({ bookName, quantity, customerName, category, orderDate, status });
    await Activity.create({
      type: 'order_updated',
      message: `Order from ${customerName} for ${bookName} (${category}) updated`,
    });
    res.status(200).json(order);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order', details: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    await book.destroy();
    await Activity.create({
      type: 'book_deleted',
      message: `Book "${book.name}" deleted from inventory`,
    });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    await order.destroy();
    await Activity.create({
      type: 'order_deleted',
      message: `Order from ${order.customerName} deleted`,
    });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

startServer();