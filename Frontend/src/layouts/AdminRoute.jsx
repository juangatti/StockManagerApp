import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import MainLayout from "./MainLayout";

const AdminRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  // 1. Si no está logueado, fuera.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Normalizamos el rol para evitar errores de tipeo (espacios, mayúsculas)
  const roleName = user?.role_name ? user.role_name.trim().toLowerCase() : "";

  // 3. Verificación de "Super Usuarios" (Acceso Total)
  const isSuperUser =
    roleName === "gamemaster" ||
    roleName === "superadmin" ||
    roleName === "admin";

  // 4. Verificación de Empleados con Permisos (Ej. Cajero, Barman)
  // Si tiene al menos UN permiso asignado, le dejamos entrar al layout principal.
  // (Luego cada página validará si puede hacer cosas específicas)
  const hasAnyPermission = user?.permissions && user.permissions.length > 0;

  // Debug para que veas qué está pasando
  console.log("AdminRoute Check:", {
    roleName,
    isSuperUser,
    hasPermissions: hasAnyPermission,
  });

  // Si no es SuperUser Y no tiene ningún permiso, lo sacamos.
  if (!isSuperUser && !hasAnyPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout />;
};

export default AdminRoute;
