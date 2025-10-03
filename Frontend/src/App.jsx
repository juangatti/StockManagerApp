import { Routes, Route, NavLink } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import InventoryPage from "./pages/InventoryPage";
import ShoppingPage from "./pages/ShoppingPage";
import AdjustPage from "./pages/AdjustPage";
import HistoricMovementPage from "./pages/HistoricMovementPage";
import PrebatchsPage from "./pages/PrebatchsPage";
import "./App.css";

function App() {
  const getNavLinkClass = ({ isActive }) => {
    return `text-lg font-medium ${
      isActive ? "text-sky-400" : "text-slate-400 hover:text-sky-400"
    }`;
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen p-4 sm:p-8">
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "",
          style: {
            background: "#1e293b", // bg-slate-800
            color: "#cbd5e1", // text-slate-300
            border: "1px solid #334155", // border-slate-700
          },
        }}
      />

      <header className="max-w-5xl mx-auto text-center mb-10">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
          Gestor de Stock
        </h1>
        <nav className="mt-4 flex justify-center gap-6">
          <NavLink to="/" className={getNavLinkClass}>
            Inventario
          </NavLink>
          <NavLink to="/prebatches" className={getNavLinkClass}>
            Prebatches
          </NavLink>
          <NavLink to="/shopping" className={getNavLinkClass}>
            Registrar Compra
          </NavLink>
          <NavLink to="/adjust" className={getNavLinkClass}>
            Ajustar Stock
          </NavLink>
          <NavLink to="/historicMovements" className={getNavLinkClass}>
            Historial de Movimientos
          </NavLink>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto">
        <Routes>
          <Route path="/" element={<InventoryPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/adjust" element={<AdjustPage />} />
          <Route path="/historicMovements" element={<HistoricMovementPage />} />
          <Route path="/prebatches" element={<PrebatchsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
