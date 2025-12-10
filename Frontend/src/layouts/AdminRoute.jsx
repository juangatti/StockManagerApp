// src/layouts/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import MainLayout from "./MainLayout";

const AdminRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const isAdmin =
    user?.roles_name === "GameMaster" ||
    user?.roles_name === "SuperAdmin" ||
    user?.roles_name === "admin";

  if (!isAdmin) {
    console.log("Acceso denegado. Rol actual:", user?.role_name);
    return <Navigate to="/dashboard" replace />;
  }

  // Si es admin, le damos acceso
  return <MainLayout />;
};

export default AdminRoute;
