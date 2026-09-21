import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

function ProtectedRoute() {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <main className="route-loading" aria-live="polite">Checking your session...</main>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
