// ProtectedRoute checks whether the user is logged in.
// If no JWT token exists, user is redirected to login page.

import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../utils/auth.js";

function ProtectedRoute() {
  // If token does not exist,
  // redirect user back to login page
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // If token exists,
  // allow user to access protected pages
  return <Outlet />;
}

export default ProtectedRoute;
