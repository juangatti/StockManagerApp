import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useInactivityTimeout } from "./hooks/useInactivityTimeout";
import MainLayout from "./layouts/MainLayout";
import useAuthStore from "./stores/useAuthStore";
import BarPage from "./pages/BarPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ShoppingPage from "./pages/ShoppingPage";
import ReservationsPage from "./pages/ReservationsPage";
import AdjustPage from "./pages/AdjustPage";
import HistoricMovementPage from "./pages/HistoricMovementPage";
import ProductionPage from "./pages/ProductionPage";
import SalesPage from "./pages/SalesPage";
import AdminPage from "./pages/AdminPage";
import MovementDetailPage from "./pages/MovementDetailPage";
import ProfilePage from "./pages/ProfilePage";
import AdminRoute from "./layouts/AdminRoute";

const AuthRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
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
          <Route path="/bar" element={<BarPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/adjust" element={<AdjustPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/historicMovements" element={<HistoricMovementPage />} />
          <Route
            path="/historicMovements/:id"
            element={<MovementDetailPage />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
