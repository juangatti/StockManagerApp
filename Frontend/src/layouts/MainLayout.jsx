// src/layouts/MainLayout.jsx
import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { ClipboardList, LogOut, X, Bell, Mail, Menu } from "lucide-react";
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
    <div className="flex flex-col min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* --- TOP HEADER BAR (Desktop & Mobile) --- */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-20 sticky top-0">
        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo/Title (hidden on mobile, shown on desktop) */}
          <div className="hidden md:block">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-3 text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <ClipboardList className="h-7 w-7 text-[var(--color-primary)]" />
              <span className="text-xl font-bold font-display uppercase tracking-wider">
                Stock Manager App
              </span>
            </Link>
          </div>

          {/* Spacer for mobile */}
          <div className="md:hidden flex-1"></div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Notifications */}
            <button
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Notificaciones"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-[var(--color-primary)] rounded-full"></span>
            </button>

            {/* Inbox/Messages */}
            <button
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Mensajes"
            >
              <Mail className="h-5 w-5" />
            </button>

            {/* User Profile Dropdown */}
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">
                {user.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="hidden md:block font-bold">
                {user.display_name || user.username}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* --- SIDEBAR FOR DESKTOP --- */}
        <div className="hidden md:flex flex-col w-[280px] bg-[var(--color-secondary-dark)] border-r border-[var(--color-secondary)] overflow-hidden shadow-xl">
          <nav className="flex-1 p-4 overflow-y-auto">
            <Sidebar />
          </nav>

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

        {/* --- MOBILE SIDEBAR MENU --- */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="flex-1 bg-black/50"
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
                    Stock Manager
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white p-2 hover:bg-[var(--color-secondary)] rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </header>

              <nav className="flex-1 p-4 overflow-y-auto">
                <Sidebar />
              </nav>

              <footer className="p-4 border-t border-[var(--color-secondary)]">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
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

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[var(--color-background)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Componente Mobile Header (ya no se necesita por separado)
function MobileHeader({ onMenuClick }) {
  return null; // Removido porque ahora tenemos un header unificado
}
