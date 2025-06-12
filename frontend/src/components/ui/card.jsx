import React from "react";

export const Card = ({ children, className = "", darkMode }) => {
  return (
    <div
      className={`bg-pink-100 rounded-2xl shadow-lg p-6 border ${
        darkMode ? "border-gray-700" : "border-gray-100"
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = "" }) => {
  return <div className={`mt-2 text-gray-700 ${className}`}>{children}</div>;
};