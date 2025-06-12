import React, { useState, useEffect, useRef } from "react";
import { Trash2, Plus, Filter, MoreVertical, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { NavLink } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiHome,
  FiPieChart,
  FiCreditCard,
  FiUser,
  FiSettings,
  FiShield,
  FiHelpCircle,
} from "react-icons/fi";
import { BsMoonStars } from "react-icons/bs";

// Dynamically set today's date in DD/MM/YYYY format
const today = new Date().toLocaleDateString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).split('/').join('/'); // Format: 05/06/2025

export default function Products({ darkMode, setDarkMode }) {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // New state for edit modal
  const [editItem, setEditItem] = useState(null); // State to store the item being edited
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    amount: "",
    cost: "",
  });
  const [filterCategory, setFilterCategory] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch books from the backend on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/books');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        throw new Error('Fetched data is not an array');
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
      setError('Failed to fetch books from the server.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index) => {
    setSelectedItems((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditModalOpen) {
      setEditItem((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewItem((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.amount || !newItem.cost) {
      alert("Please fill in all fields.");
      return;
    }

    const formattedDate = selectedDate.toISOString().split('T')[0];
    
    try {
      const response = await fetch('http://localhost:5000/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, date: formattedDate }),
      });
      
      if (response.ok) {
        fetchBooks();
        setNewItem({
          name: "",
          category: "",
          amount: "",
          cost: "",
        });
        setSelectedDate(new Date());
        setIsModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to add book: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error adding book:', err);
      alert('Error adding book to the server.');
    }
  };

  const handleEditItem = async () => {
    if (!editItem.name || !editItem.category || !editItem.amount || !editItem.cost) {
      alert("Please fill in all fields.");
      return;
    }

    const formattedDate = selectedDate.toISOString().split('T')[0];
    
    try {
      const response = await fetch(`http://localhost:5000/api/books/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editItem, date: formattedDate }),
      });

      if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }
      
      if (response.ok) {
        fetchBooks();
        setEditItem(null);
        setSelectedDate(new Date());
        setIsEditModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to update book: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error updating book:', err);
      alert('Error updating book on the server. ${err.message}');
    }
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setSelectedDate(new Date(item.date));
    setIsEditModalOpen(true);
  };

  const handleDeleteItems = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to delete.");
      return;
    }
    try {
      const deletePromises = selectedItems.map(async (index) => {
        const itemId = filteredItems[index].id;
        const response = await fetch(`http://localhost:5000/api/books/${itemId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete book with ID ${itemId}`);
        }
      });
      await Promise.all(deletePromises);
      fetchBooks();
      setSelectedItems([]);
    } catch (err) {
      console.error('Error deleting books:', err);
      alert('Error deleting selected books.');
    }
  };

  const handleFilterSelect = (category) => {
    setFilterCategory(category);
    setIsDropdownOpen(false);
  };

  const uniqueCategories = ["All", ...new Set(items.map((item) => item.category))];

  const filteredItems = filterCategory === "All"
    ? items
    : items.filter((item) => item.category === filterCategory);

  return (
    <div>
      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Item</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newItem.name}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter book name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <input
                  type="text"
                  name="category"
                  value={newItem.category}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={newItem.amount}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cost</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost"
                  value={newItem.cost}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter cost"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholderText="Select date"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                className="text-gray-700 dark:text-gray-300"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-pink-600 text-white hover:bg-pink-700 dark:hover:bg-pink-800"
                onClick={handleAddItem}
              >
                Add Book
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && editItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Item</h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editItem.name}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter book name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <input
                  type="text"
                  name="category"
                  value={editItem.category}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={editItem.amount}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cost</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost"
                  value={editItem.cost}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter cost"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholderText="Select date"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                className="text-gray-700 dark:text-gray-300"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-pink-600 text-white hover:bg-pink-700 dark:hover:bg-pink-800"
                onClick={handleEditItem}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen bg-gray-100 dark:bg-[#0e1525] text-gray-900 dark:text-gray-100">
        <aside className="w-64 p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-md border border-white/20 dark:border-gray-700 rounded-tr-3xl rounded-br-3xl">
          <div className="mb-10">
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">📚Perfect Books</div>
          </div>
          <nav className="space-y-5 text-gray-700 dark:text-gray-300 text-[15px] font-medium">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 ${isActive ? "text-pink-600 dark:text-pink-400 font-semibold" : "hover:text-pink-500 dark:hover:text-pink-300"}`
              }
            >
              <FiHome /> Dashboard
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `flex items-center gap-3 ${isActive ? "text-pink-600 dark:text-pink-400 font-semibold" : "hover:text-pink-500 dark:hover:text-pink-300"}`
              }
            >
              <FiPieChart /> Products
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `flex items-center gap-3 ${isActive ? "text-pink-600 dark:text-pink-400 font-semibold" : "hover:text-pink-500 dark:hover:text-pink-300"}`
              }
            >
              <FiCreditCard /> Orders
            </NavLink>
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `flex items-center gap-3 ${isActive ? "text-pink-600 dark:text-pink-400 font-semibold" : "hover:text-pink-500 dark:hover:text-pink-300"}`
              }
            >
              <FiUser /> Account
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 ${isActive ? "text-pink-600 dark:text-pink-400 font-semibold" : "hover:text-pink-500 dark:hover:text-pink-300"}`
              }
            >
              <FiSettings /> Settings
            </NavLink>

            <hr className="my-4 border-gray-300 dark:border-gray-600" />

            <NavLink
              to="/security"
              className={({ isActive }) =>
                `flex items-center gap-3 ${isActive ? "text-pink-600 dark:text-pink-400 font-semibold" : "hover:text-pink-500 dark:hover:text-pink-300"}`
              }
            >
              <FiShield /> Security
            </NavLink>
            <NavLink
              to="/help"
              className={({ isActive }) =>
                `flex items-center gap-3 ${isActive ? "text-pink-600 dark:text-pink-400 font-semibold" : "hover:text-pink-500 dark:hover:text-pink-300"}`
              }
            >
              <FiHelpCircle /> Help Center
            </NavLink>
          </nav>
          <div
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-3 py-4 cursor-pointer ${darkMode ? "text-pink-600 dark:text-pink-400 font-semibold" : "hover:text-pink-500 dark:hover:text-pink-300"}`}
          >
            <BsMoonStars /> {darkMode ? "Light Mode" : "Dark Mode"}
          </div>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Products</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your book inventory</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center py-2"
                onClick={handleDeleteItems}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="outline"
                  className="flex items-center py-2 hover:bg-gray-100 dark:hover:bg-pink-800"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                >
                  <Filter className="w-4 h-4 mr-2" /> Filters
                </Button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10">
                    {uniqueCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleFilterSelect(category)}
                        className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                className="flex items-center bg-pink-600 text-white hover:bg-pink-700 dark:hover:bg-pink-800"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Add new ITEM
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="min-w-full table-auto border-collapse text-sm">
              <thead className="bg-gray-200 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left text-gray-700 dark:text-gray-300">
                    <input type="checkbox" />
                  </th>
                  <th className="p-3 text-left text-gray-700 dark:text-gray-300">Book</th>
                  <th className="p-3 text-left text-gray-700 dark:text-gray-300">Category</th>
                  <th className="p-3 text-left text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="p-3 text-left text-gray-700 dark:text-gray-300">Cost</th>
                  <th className="p-3 text-left text-gray-700 dark:text-gray-300">Date</th>
                  <th className="p-3 text-right text-gray-700 dark:text-gray-300"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-3 text-center text-gray-700 dark:text-gray-300">
                      Loading books...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="p-3 text-center text-red-600 dark:text-red-400">
                      {error}
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-3 text-center text-gray-700 dark:text-gray-300">
                      No books found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-t border-gray-300 dark:border-gray-700 hover:bg-pink-100 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(idx)}
                          onChange={() => toggleSelect(idx)}
                        />
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                        {item.name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">{item.category}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">{item.amount}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">{item.cost}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {item.date ? new Date(item.date).toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                      <td className="p-3 text-right">
                        <MoreVertical
                          className="w-4 h-4 cursor-pointer text-gray-700 dark:text-gray-300"
                          onClick={() => openEditModal(item)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}