// ProtectedRoute checks whether the user is logged in.
// If no JWT token exists, user is redirected to login page.

import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  // Read JWT token saved after login
  const token = localStorage.getItem("reporta_token");

  // If token does not exist,
  // redirect user back to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token exists,
  // allow user to access protected pages
  return <Outlet />;
}

export default ProtectedRoute;
