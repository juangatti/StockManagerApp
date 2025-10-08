import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
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

// Componente para proteger las rutas
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    // Si no está autenticado, lo redirige al login
    return <Navigate to="/login" replace />;
  }
  // Si está autenticado, muestra el layout principal
  return <MainLayout />;
};

function App() {
  const { isAuthenticated } = useAuthStore();

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

        {/* Ruta principal: redirige según si está logueado o no */}
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

        {/* Aquí anidamos todas las rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/adjust" element={<AdjustPage />} />
          <Route path="/historicMovements" element={<HistoricMovementPage />} />
          <Route path="/prebatches" element={<PrebatchsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
