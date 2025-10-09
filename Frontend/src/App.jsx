import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layouts y Rutas Protegidas
import MainLayout from "./layouts/MainLayout";
import useAuthStore from "./stores/useAuthStore";

// Importa todas tus páginas
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import ShoppingPage from "./pages/ShoppingPage";
import AdjustPage from "./pages/AdjustPage";
import HistoricMovementPage from "./pages/HistoricMovementPage";
import PrebatchsPage from "./pages/PrebatchsPage";
import SalesPage from "./pages/SalesPage";
import AdminPage from "./pages/AdminPage";

// --- COMPONENTES DE ENRUTAMIENTO ---

// Componente para proteger rutas que requieren solo autenticación
const AuthRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />;
};

// Componente para proteger rutas que requieren rol de 'admin'
const AdminRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return user.role === "admin" ? (
    <MainLayout />
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

// --- COMPONENTE PRINCIPAL DE LA APP ---

function App() {
  const { isAuthenticated, user, logout } = useAuthStore();

  // Mantenemos tu useEffect para garantizar la consistencia del estado
  useEffect(() => {
    if (isAuthenticated && !user) {
      logout();
    }
  }, [isAuthenticated, user, logout]);

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#cbd5e1",
            border: "1px solid #334155",
          },
        }}
      />
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Rutas para todos los usuarios autenticados (admin y operator) */}
        <Route element={<AuthRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/prebatches" element={<PrebatchsPage />} />
          <Route path="/historicMovements" element={<HistoricMovementPage />} />
        </Route>

        {/* Rutas exclusivas para el rol 'admin' */}
        <Route element={<AdminRoute />}>
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/adjust" element={<AdjustPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
