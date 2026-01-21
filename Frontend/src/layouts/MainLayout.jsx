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
      className="flex items-center gap-3 p-2 rounded-lg mb-2 text-left w-full hover:bg-[var(--color-secondary)] transition-colors group"
      title="Ir a Mi Perfil"
      onClick={onClick} // Para cerrar el menú móvil al navegar
    >
      {/* Avatar Circular con Iniciales */}
      <div className="shrink-0 bg-[var(--color-primary)] rounded-full h-9 w-9 flex items-center justify-center font-bold text-white text-sm shadow-sm">
        {initials}
      </div>

      {/* Nombre y Rol */}
      <div className="overflow-hidden">
        <span className="text-sm font-bold text-gray-200 truncate block font-display tracking-wide">
          {displayName}
        </span>
        <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
          Ver Perfil
        </span>
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
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* --- BARRA LATERAL PARA ESCRITORIO (PC) --- */}
      <div className="hidden md:flex flex-col bg-[var(--color-secondary-dark)] border-r border-[var(--color-secondary)] overflow-hidden shadow-xl z-10">
        <header className="p-6 text-center border-b border-[var(--color-secondary)]">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-3 text-white hover:text-[var(--color-primary-light)] transition-colors"
          >
            <ClipboardList className="h-8 w-8 text-[var(--color-primary)]" />
            <span className="text-2xl font-bold font-display uppercase tracking-wider">
              Mauer Bar
            </span>
          </Link>
        </header>

        {/* --- 1. UBICACIÓN NUEVA (ESCRITORIO) --- */}
        {/* Lo movimos del footer a aquí */}
        <div className="p-4 border-b border-[var(--color-secondary)]">
          <UserProfileLink user={user} />
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Sidebar />
        </nav>

        {/* 2. FOOTER (ESCRITORIO) LIMPIO --- */}
        {/* (Quitamos el UserProfileLink de aquí) */}
        <footer className="p-4 border-t border-[var(--color-secondary)]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
          <p className="text-xs text-center text-gray-600 mt-4">
            Created by Juan Gatti ®
          </p>
        </footer>
      </div>

      {/* --- BARRA LATERAL PARA MÓVIL (Menú Desplegable) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative flex flex-col w-72 max-w-[calc(100%-3rem)] bg-[var(--color-secondary-dark)] border-r border-[var(--color-secondary)] shadow-2xl">
            <header className="p-6 text-center border-b border-[var(--color-secondary)] flex justify-between items-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-3 text-white hover:text-[var(--color-primary-light)] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ClipboardList className="h-8 w-8 text-[var(--color-primary)]" />
                <span className="text-xl font-bold font-display uppercase">
                  Mauer
                </span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white p-2 hover:bg-[var(--color-secondary)] rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </header>

            {/* --- 3. UBICACIÓN NUEVA (MÓVIL) --- */}
            <div className="p-4 border-b border-[var(--color-secondary)]">
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
            <footer className="p-4 border-t border-[var(--color-secondary)]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
              <p className="text-xs text-center text-gray-600 mt-4">
                Created by Juan Gatti ®
              </p>
            </footer>
          </div>
        </div>
      )}

      {/* --- CONTENIDO PRINCIPAL (sin cambios) --- */}
      <div className="flex flex-col overflow-hidden max-h-screen">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="p-4 md:p-8 overflow-y-auto flex-1 bg-[var(--color-background)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
