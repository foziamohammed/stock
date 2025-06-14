require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Supabase client with your credentials
const supabase = createClient(process.env.SUPABASE_URL, process.env.ANON_KEY);

app.get('/', (req, res) => {
  res.send('Welcome to the Stock API!');
});

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const { data, error } = await supabase.from('books').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books', details: err.message });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
});

// Get recent activities
app.get('/api/activities', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities', details: err.message });
  }
});

// Get chart data
app.get('/api/chart-data', async (req, res) => {
  try {
    const { data, error } = await supabase.from('books').select('*');
    if (error) throw error;
    const categoryData = data.reduce((acc, book) => {
      const category = book.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (book.quantity || 0); // Changed from amount to quantity
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

// Get dashboard summary
app.get('/api/dashboard-summary', async (req, res) => {
  try {
    const { data: books, error: booksError } = await supabase.from('books').select('*');
    if (booksError) throw booksError;
    const { data: orders, error: ordersError } = await supabase.from('orders').select('*');
    if (ordersError) throw ordersError;
    const totalBooks = books.length; // Count of books, not sum of quantities
    const lowStock = books.filter(book => book.quantity < 5).length; // Changed to quantity, lowered threshold to 5
    const totalOrders = orders.length;
    const summary = { totalBooks, lowStock, totalOrders };
    res.json(summary);
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary', details: err.message });
  }
});

// Add a book
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
    const { data, error } = await supabase
      .from('books')
      .insert({ book_name: name, category, quantity: amount, price: cost, date_added: date }) // Changed field names
      .select();
    if (error) throw error;
    await supabase.from('activities').insert({
      type: 'book_added',
      message: `New book "${name}" added to inventory`,
    });
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).json({ error: 'Failed to add book', details: err.message });
  }
});

// Update a book
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
    const { data, error } = await supabase
      .from('books')
      .update({ book_name: name, category, quantity: amount, price: cost, date_added: date }) // Changed field names
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data.length) return res.status(404).json({ error: 'Book not found' });
    await supabase.from('activities').insert({
      type: 'book_updated',
      message: `Book "${name}" updated`,
    });
    res.status(200).json(data[0]);
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ error: 'Failed to update book', details: err.message });
  }
});

// Add an order
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
    const { data, error } = await supabase
      .from('orders')
      .insert({ book_name: bookName.trim(), quantity, customer_name: customerName, category: category.trim(), order_date: orderDate, status })
      .select();
    if (error) throw error;
    await supabase.from('activities').insert({
      type: 'order_received',
      message: `New order received from ${customerName} for ${bookName} (${category})`,
    });
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error adding order:', err);
    res.status(500).json({ error: 'Failed to add order', details: err.message });
  }
});

// Update an order
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
    const { data, error } = await supabase
      .from('orders')
      .update({ book_name: bookName, quantity, customer_name: customerName, category, order_date: orderDate, status })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data.length) return res.status(404).json({ error: 'Order not found' });
    await supabase.from('activities').insert({
      type: 'order_updated',
      message: `Order from ${customerName} for ${bookName} (${category}) updated`,
    });
    res.status(200).json(data[0]);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order', details: err.message });
  }
});

// Delete a book
app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('books').select('*').eq('id', id);
    if (error) throw error;
    if (!data.length) return res.status(404).json({ error: 'Book not found' });
    await supabase.from('books').delete().eq('id', id);
    await supabase.from('activities').insert({
      type: 'book_deleted',
      message: `Book "${data[0].book_name}" deleted from inventory`, // Changed from name to book_name
    });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ error: 'Failed to delete book', details: err.message });
  }
});

// Delete an order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('orders').select('*').eq('id', id);
    if (error) throw error;
    if (!data.length) return res.status(404).json({ error: 'Order not found' });
    await supabase.from('orders').delete().eq('id', id);
    await supabase.from('activities').insert({
      type: 'order_deleted',
      message: `Order from ${data[0].customer_name} deleted`, // Correct field name
    });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order', details: err.message });
  }
});

// Start server
app.listen(5000, () => console.log('Server running on port 5000'));