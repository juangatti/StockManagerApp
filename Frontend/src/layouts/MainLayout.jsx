// src/layouts/MainLayout.jsx
import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  LogOut,
  X,
  Bell,
  Mail,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import Sidebar from "../components/molecules/SideBar";

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
      className="flex items-center gap-3 p-2 rounded-lg mb-2 text-left w-full hover:bg-secondary transition-colors group"
      title="Ir a Mi Perfil"
      onClick={onClick} // Para cerrar el menú móvil al navegar
    >
      {/* Avatar Circular con Iniciales */}
      <div className="shrink-0 bg-primary rounded-full h-9 w-9 flex items-center justify-center font-bold text-white text-sm shadow-sm">
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
    <div className="flex min-h-screen bg-background text-text-primary overflow-hidden">
      {/* ... sidebar and header code ... */}
      <aside className="hidden md:flex flex-col w-[280px] bg-secondary-dark border-r border-secondary shadow-xl shrink-0">
        <header className="p-6 border-b border-secondary">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 text-white hover:text-primary-light transition-colors"
          >
            <ClipboardList className="h-8 w-8 text-primary" />
            <span className="text-2xl font-black font-display uppercase tracking-tighter">
              SMA
            </span>
          </Link>
        </header>

        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <Sidebar />
        </nav>

        <footer className="p-4 border-t border-secondary">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
          <p className="text-[10px] text-center text-gray-600 mt-4 leading-relaxed uppercase font-bold tracking-tighter">
            Created by Juan Gatti ® 2026
          </p>
        </footer>
      </aside>

      {/* --- WRAPPER FOR HEADER + CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* --- TOP HEADER BAR --- */}
        <header className="bg-white border-b border-gray-200 shadow-sm z-20">
          <div className="flex items-center justify-between px-4 md:px-8 py-3">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-1 md:gap-3">
              {/* Theme Toggle (Functional placeholder icon) */}
              <button
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cambiar Tema"
              >
                <Sun className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <button
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full border-2 border-white"></span>
              </button>

              {/* Inbox/Messages */}
              <button
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Mensajes"
              >
                <Mail className="h-5 w-5" />
              </button>

              <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

              {/* User Profile Dropdown */}
              <Link
                to="/profile"
                className="flex items-center gap-3 pl-2 pr-1 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="hidden lg:block font-bold text-gray-800">
                  {user.display_name || user.username}
                </span>
                <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-bold border-2 border-white shadow-sm ring-1 ring-gray-100">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* --- MOBILE SIDEBAR MENU --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative flex flex-col w-72 max-w-[calc(100%-3rem)] bg-secondary-dark border-r border-secondary shadow-2xl animate-in slide-in-from-left duration-300">
            <header className="p-6 border-b border-secondary flex justify-between items-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-3 text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ClipboardList className="h-7 w-7 text-primary" />
                <span className="text-xl font-bold font-display uppercase">
                  SMA
                </span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </header>

            <nav className="flex-1 p-4 overflow-y-auto">
              <Sidebar />
            </nav>

            <footer className="p-4 border-t border-secondary">
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
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
