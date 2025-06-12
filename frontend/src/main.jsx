import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Function to get the initial theme (default to 'light' if not set)
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  return savedTheme ? savedTheme : 'light'; // Default to light mode
};

// Apply the initial theme to the html element
const initialTheme = getInitialTheme();
document.documentElement.classList.toggle('dark', initialTheme === 'dark');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);