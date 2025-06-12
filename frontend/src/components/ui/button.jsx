import React from "react";

export const Button = ({ children, onClick, className = "", type = "button" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-pink-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium  px-5 rounded-xl shadow-md transition duration-200 ease-in-out ${className}`}
    >
      {children}
    </button>
  );
};
