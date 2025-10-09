// src/layouts/MainLayout.jsx
import { Outlet, Link, useNavigate } from "react-router-dom";
import { ClipboardList, LogOut } from "lucide-react";
import Sidebar from "../components/molecules/SideBar";
import useAuthStore from "../stores/useAuthStore";

export default function MainLayout() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="grid grid-cols-[280px_1fr] h-screen bg-slate-900 text-slate-100">
      {/* 1. Cambiamos min-h-screen por h-screen y añadimos overflow-hidden */}
      <div className="flex flex-col bg-slate-800 border-r border-slate-700 overflow-hidden">
        <header className="p-6 text-center border-b border-slate-700">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-3 text-white hover:text-sky-400 transition-colors"
          >
            <ClipboardList className="h-8 w-8" />
            <span className="text-xl font-bold">Bar Manager</span>
          </Link>
        </header>

        {/* 2. Añadimos la clase 'overflow-y-auto' a la navegación */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <Sidebar />
        </nav>

        <footer className="p-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2">
            Sesión iniciada como:{" "}
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

      <main className="p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
