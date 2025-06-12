import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-800">📚 Inventory System</h1>
      <div className="space-x-4">
        <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium">Dashboard</Link>
        <Link to="/products" className="text-gray-600 hover:text-indigo-600 font-medium">Products</Link>
        <Link to="/orders" className="text-gray-600 hover:text-indigo-600 font-medium">Orders</Link>
      </div>
    </nav>
  );
};

export default Navbar;
