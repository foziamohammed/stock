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
const today = new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).split("/").join("/"); // Format: 14/06/2025

export default function Orders({ darkMode, setDarkMode }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newOrder, setNewOrder] = useState({
    bookName: "",
    quantity: "",
    customerName: "",
    category: "", // Added category field
    status: "active",
  });
  const [filterStatus, setFilterStatus] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = import.meta.env.VITE_API_URL;
      if (!API_URL) throw new Error("API_URL is not defined");
      const response = await fetch(`${API_URL}/api/orders`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        // Map Supabase fields to frontend-friendly names
        const mappedOrders = data.map((order) => ({
          id: order.id,
          bookName: order.book_name,
          quantity: order.quantity,
          customerName: order.customer_name,
          category: order.category || "N/A",
          orderDate: order.order_date,
          status: order.status,
        }));
        setOrders(mappedOrders);
      } else {
        throw new Error("Fetched data is not an array");
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to fetch orders from the server.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index) => {
    setSelectedOrders((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditModalOpen) {
      setEditOrder((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewOrder((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddOrder = async () => {
    if (
      !newOrder.bookName ||
      !newOrder.quantity ||
      !newOrder.customerName ||
      !newOrder.category ||
      !selectedDate ||
      !newOrder.status
    ) {
      alert("Please fill in all fields.");
      return;
    }
    const formattedDate = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const payload = {
      book_name: newOrder.bookName.trim(),
      quantity: parseInt(newOrder.quantity),
      customer_name: newOrder.customerName,
      category: newOrder.category.trim(),
      order_date: formattedDate,
      status: newOrder.status,
    };
    try {
      console.log(`[${new Date().toISOString()}] Sending new order:`, payload);
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        fetchOrders();
        setNewOrder({
          bookName: "",
          quantity: "",
          customerName: "",
          category: "",
          status: "active",
        });
        setSelectedDate(new Date());
        setIsModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to add order: ${errorData.error || "Server error"}`);
      }
    } catch (err) {
      console.error("Error adding order:", err);
      alert("Error adding order to the server.");
    }
  };

  const handleEditOrder = async () => {
    if (
      !editOrder.bookName ||
      !editOrder.quantity ||
      !editOrder.customerName ||
      !editOrder.category ||
      !selectedDate ||
      !editOrder.status
    ) {
      alert("Please fill in all fields.");
      return;
    }
    const formattedDate = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const payload = {
      book_name: editOrder.bookName.trim(),
      quantity: parseInt(editOrder.quantity),
      customer_name: editOrder.customerName,
      category: editOrder.category.trim(),
      order_date: formattedDate,
      status: editOrder.status,
    };
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/orders/${editOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        fetchOrders();
        setEditOrder(null);
        setSelectedDate(new Date());
        setIsEditModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to update order: ${errorData.error || "Server error"}`);
      }
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Error updating order on the server.");
    }
  };

  const openEditModal = (order) => {
    setEditOrder({
      id: order.id,
      bookName: order.bookName,
      quantity: order.quantity,
      customerName: order.customerName,
      category: order.category,
      orderDate: order.orderDate,
      status: order.status,
    });
    setSelectedDate(new Date(order.orderDate));
    setIsEditModalOpen(true);
  };

  const handleDeleteOrders = async () => {
    if (selectedOrders.length === 0) {
      alert("Please select at least one order to delete.");
      return;
    }
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const deletePromises = selectedOrders.map(async (index) => {
        const orderId = filteredOrders[index].id;
        const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error(`Failed to delete order with ID ${orderId}`);
        }
      });
      await Promise.all(deletePromises);
      fetchOrders();
      setSelectedOrders([]);
    } catch (err) {
      console.error("Error deleting orders:", err);
      alert("Error deleting selected orders.");
    }
  };

  const handleFilterSelect = (status) => {
    setFilterStatus(status === "All" ? "All" : status.toLowerCase());
    setIsDropdownOpen(false);
  };

  // Map status values to display labels
  const statusDisplayMap = {
    active: "Order Pending",
    customs: "Customs",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  // Map display labels back to status values for filtering
  const statusValueMap = {
    "Order Pending": "active",
    "Customs": "customs",
    "Completed": "completed",
    "Cancelled": "cancelled",
  };

  const uniqueStatuses = [
    "All",
    ...new Set(orders.map((order) => statusDisplayMap[order.status] || order.status)),
  ];

  const filteredOrders = filterStatus === "All"
    ? orders
    : orders.filter(
        (order) =>
          order.status === statusValueMap[filterStatus] ||
          order.status === filterStatus.toLowerCase()
      );

  return (
    <div>
      {/* Add Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add New Order
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Book Name
                </label>
                <input
                  type="text"
                  name="bookName"
                  value={newOrder.bookName}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter book name (e.g., foz)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={newOrder.quantity}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={newOrder.customerName}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={newOrder.category}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter category (e.g., Fiction, Non-Fiction)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order Date
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="yyyy-MM-dd" // Match backend's expected format
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholderText="Select date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  name="status"
                  value={newOrder.status}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="active">Order Pending</option>
                  <option value="customs">Customs</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
                onClick={handleAddOrder}
              >
                Add Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {isEditModalOpen && editOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Edit Order
              </h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Book Name
                </label>
                <input
                  type="text"
                  name="bookName"
                  value={editOrder.bookName}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter book name (e.g., foz)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={editOrder.quantity}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={editOrder.customerName}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={editOrder.category}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Enter category (e.g., Fiction, Non-Fiction)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order Date
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="yyyy-MM-dd" // Match backend's expected format
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                  placeholderText="Select date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  name="status"
                  value={editOrder.status}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="active">Order Pending</option>
                  <option value="customs">Customs</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
                onClick={handleEditOrder}
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
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
              📚Perfect Books
            </div>
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
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Orders
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customer requests for new imported books
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center py-2"
                onClick={handleDeleteOrders}
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
                    {uniqueStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleFilterSelect(status)}
                        className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                className="flex items-center bg-pink-600 text-white hover:bg-pink-700 dark:hover:bg-gray-800"
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
                  <th className="p-3 text-left text-gray-700 dark:text-gray-300">
                    Quantity
                  </th>
                  <th className="p-3 text-left text-gray-700 dark:text-gray-300">
                    Customer
                  </th>
                  <th className="p-3 text-left text-gray-700 dark:text-gray-300">
                    Category
                  </th>
                  <th className="p-3 text-left text-gray-700 dark:text-gray-300">Date</th>
                  <th className="p-3 text-left text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="p-3 text-right text-gray-700 dark:text-gray-300"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-3 text-center text-gray-700 dark:text-gray-300">
                      Loading orders...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8" className="p-3 text-center text-red-600 dark:text-red-400">
                      {error}
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-3 text-center text-gray-700 dark:text-gray-300">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, idx) => (
                    <tr
                      key={order.id}
                      className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-800"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(idx)}
                          onChange={() => toggleSelect(idx)}
                        />
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                        {order.bookName}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {order.quantity}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {order.customerName}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {order.category}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {order.orderDate
                          ? new Date(order.orderDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {statusDisplayMap[order.status] || order.status}
                      </td>
                      <td className="p-3 text-right">
                        <MoreVertical
                          className="w-4 h-4 cursor-pointer text-gray-700 dark:text-gray-300"
                          onClick={() => openEditModal(order)}
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