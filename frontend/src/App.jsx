import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

 useEffect(() => {
  console.log('darkMode state:', darkMode);
  if (darkMode) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
  console.log('HTML classList:', document.documentElement.classList.toString());
}, [darkMode]);

  return (
    <Router>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Routes>
          <Route
            path="/"
            element={<Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
          <Route path="/products" element={<Products darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/orders" element={<Orders darkMode={darkMode} setDarkMode={setDarkMode} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;