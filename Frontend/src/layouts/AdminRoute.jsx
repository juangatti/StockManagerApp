// src/layouts/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import MainLayout from "./MainLayout";

const AdminRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario no es 'admin', lo redirigimos al dashboard principal
  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Si es admin, le damos acceso
  return <MainLayout />;
};

export default AdminRoute;
