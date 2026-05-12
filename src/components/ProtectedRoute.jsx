import { Navigate, Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import useAuthStore from "../store/useAuthStore";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role, logout } = useAuthStore();

  const getTargetLoginRoute = () => {
    if (allowedRoles?.length === 1) {
      if (allowedRoles.includes("ADMIN")) return "/admin/login";
      if (allowedRoles.includes("CLERK")) return "/clerk/login";
    }
    return "/user/login";
  };

  if (!isAuthenticated) {
    return <Navigate to={getTargetLoginRoute()} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    logout();

    if (role === "ADMIN") return <Navigate to="/admin/login" replace />;
    if (role === "CLERK") return <Navigate to="/clerk/login" replace />;
    return <Navigate to="/user/login" replace />;
  }

  return <Outlet />;
}

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};
