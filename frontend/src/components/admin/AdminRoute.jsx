import React from "react";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");

  // Login nahi hai
  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  // Login hai lekin admin nahi hai
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Admin access allowed
  return children;
};

export default AdminRoute;