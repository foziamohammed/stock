import axios from 'axios';

const API_URL = 'http://localhost:5000/api/books';

// Get all books
const getBooks = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Get books by category
const getBooksByCategory = async (category) => {
  const response = await axios.get(`${API_URL}/category/${category}`);
  return response.data;
};

const bookService = {
  getBooks,
  getBooksByCategory
};

export default bookService;