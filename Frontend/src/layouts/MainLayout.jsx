// src/layouts/MainLayout.jsx
import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { ClipboardList, LogOut, X } from "lucide-react";
import Sidebar from "../components/molecules/SideBar";
import MobileHeader from "../components/molecules/MobileHeader";
import useAuthStore from "../stores/useAuthStore";
import { getInitials } from "../utils/initials.js";

const UserProfileLink = ({ user, onClick }) => {
  // 3. Obtenemos los datos del store
  // (Asumimos que el store ya provee 'full_name' y 'display_name'
  // gracias a los cambios del backend)
  const initials = getInitials(user?.full_name, user?.username);
  const displayName = user?.display_name || user?.username;

  return (
    <Link
      to="/profile"
      className="flex items-center gap-3 p-2 rounded-lg mb-2 text-left w-full hover:bg-slate-700 transition-colors group"
      title="Ir a Mi Perfil"
      onClick={onClick} // Para cerrar el menú móvil al navegar
    >
      {/* Avatar Circular con Iniciales */}
      <div className="flex-shrink-0 bg-sky-600 rounded-full h-9 w-9 flex items-center justify-center font-bold text-white text-sm">
        {initials}
      </div>

      {/* Nombre y Rol */}
      <div className="overflow-hidden">
        <span className="text-sm font-bold text-slate-200 truncate block">
          {displayName}
        </span>
        <span className="text-xs text-slate-400">Ver Perfil</span>
      </div>
    </Link>
  );
};

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
        <header className="p-6 text-center border-b border-slate-700">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-3 text-white hover:text-sky-400 transition-colors"
          >
            <ClipboardList className="h-8 w-8" />
            <span className="text-xl font-bold">Gestor de Stock</span>
          </Link>
        </header>

        {/* --- 1. UBICACIÓN NUEVA (ESCRITORIO) --- */}
        {/* Lo movimos del footer a aquí */}
        <div className="p-4 border-b border-slate-700">
          <UserProfileLink user={user} />
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Sidebar />
        </nav>

        {/* 2. FOOTER (ESCRITORIO) LIMPIO --- */}
        {/* (Quitamos el UserProfileLink de aquí) */}
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

      {/* --- BARRA LATERAL PARA MÓVIL (Menú Desplegable) --- */}
      {isMobileMenuOpen && (
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

            {/* --- 3. UBICACIÓN NUEVA (MÓVIL) --- */}
            <div className="p-4 border-b border-slate-700">
              <UserProfileLink
                user={user}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            </div>

            <nav className="flex-1 p-4 overflow-y-auto">
              <Sidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
            </nav>

            {/* 4. FOOTER (MÓVIL) LIMPIO --- */}
            {/* (Quitamos el UserProfileLink de aquí) */}
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

      {/* --- CONTENIDO PRINCIPAL (sin cambios) --- */}
      <div className="flex flex-col overflow-hidden">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="p-4 md:p-8 overflow-y-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
