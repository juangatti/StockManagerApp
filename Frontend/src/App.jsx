// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainLayout from "./layouts/MainLayout";
import InventoryPage from "./pages/InventoryPage";
import ShoppingPage from "./pages/ShoppingPage";
import AdjustPage from "./pages/AdjustPage";
import HistoricMovementPage from "./pages/HistoricMovementPage";
import PrebatchsPage from "./pages/PrebatchsPage";
import DashboardPage from "./pages/DashboardPage";
import SalesPage from "./pages/SalesPage";
import AdminPage from "./pages/AdminPage";

function App() {
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
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
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
