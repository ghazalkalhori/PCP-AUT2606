import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../utils/auth.js";

function ProtectedRoute() {
  // Route protection is token-presence based; API calls still validate the JWT server-side.
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
