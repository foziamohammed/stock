import React from "react";

export const Input = ({ placeholder, value, onChange, className = "", type = "text" }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-2 text-sm transition-all outline-none ${className}`}
    />
  );
};
