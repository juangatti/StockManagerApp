// src/layouts/MainLayout.jsx
import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { ClipboardList, LogOut, X } from "lucide-react";
import Sidebar from "../components/molecules/SideBar";
import MobileHeader from "../components/molecules/MobileHeader";
import useAuthStore from "../stores/useAuthStore";

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    // 1. CAMBIO: Volvemos a 'min-h-screen' para más flexibilidad.
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-screen bg-slate-900 text-slate-100">
      {/* --- BARRA LATERAL PARA ESCRITORIO (PC) --- */}
      <div className="hidden md:flex flex-col bg-slate-800 border-r border-slate-700 overflow-hidden">
        {/* ... (código interno sin cambios) ... */}
        <header className="p-6 text-center border-b border-slate-700">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-3 text-white hover:text-sky-400 transition-colors"
          >
            <ClipboardList className="h-8 w-8" />
            <span className="text-xl font-bold">Gestor de Stock</span>
          </Link>
        </header>
        <nav className="flex-1 p-4 overflow-y-auto">
          <Sidebar />
        </nav>
        <footer className="p-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2">
            Sesión:{" "}
            <span className="font-bold text-slate-200">{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </footer>
      </div>

      {/* --- BARRA LATERAL PARA MÓVIL (Menú Desplegable) --- */}
      {isMobileMenuOpen && (
        // ... (código interno sin cambios) ...
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative flex flex-col w-72 max-w-[calc(100%-3rem)] bg-slate-800 border-r border-slate-700">
            <header className="p-6 text-center border-b border-slate-700 flex justify-between items-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-3 text-white hover:text-sky-400 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ClipboardList className="h-8 w-8" />
                <span className="text-xl font-bold">Gestor</span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </header>
            <nav className="flex-1 p-4 overflow-y-auto">
              <Sidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
            </nav>
            <footer className="p-4 border-t border-slate-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* --- CONTENIDO PRINCIPAL --- */}
      {/* 2. CAMBIO: Añadimos 'overflow-hidden' para que el contenedor calcule bien su altura. */}
      <div className="flex flex-col overflow-hidden">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="p-4 md:p-8 overflow-y-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
