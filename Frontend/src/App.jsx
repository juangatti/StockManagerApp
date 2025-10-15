import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useInactivityTimeout } from "./hooks/useInactivityTimeout";

import MainLayout from "./layouts/MainLayout";
import useAuthStore from "./stores/useAuthStore";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import ShoppingPage from "./pages/ShoppingPage";
import AdjustPage from "./pages/AdjustPage";
import HistoricMovementPage from "./pages/HistoricMovementPage";
import PrebatchsPage from "./components/organisms/PrebatchsManager";
import SalesPage from "./pages/SalesPage";
import AdminPage from "./pages/AdminPage";

const AuthRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />;
};

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

function App() {
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      logout();
    }
  }, [isAuthenticated, user, logout]);

  const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // 3. ¡Activa el hook! Esta línea pone en marcha todo el sistema.
  useInactivityTimeout(handleLogout, INACTIVITY_TIMEOUT);

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

        <Route element={<AuthRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/prebatches" element={<PrebatchsPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/adjust" element={<AdjustPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/historicMovements" element={<HistoricMovementPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
