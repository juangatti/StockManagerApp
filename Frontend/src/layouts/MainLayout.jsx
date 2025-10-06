import { Outlet, Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import Sidebar from "../components/molecules/SideBar";

export default function MainLayout() {
  return (
    <div className="grid grid-cols-[280px_1fr] min-h-screen bg-slate-900 text-slate-100">
      {/* Columna de la Sidebar */}
      <div className="flex flex-col">
        <header className="p-6 text-center border-b border-slate-700">
          <Link
            to="/"
            className="inline-flex items-center gap-3 text-white hover:text-sky-400 transition-colors"
          >
            <ClipboardList className="h-8 w-8" />
            <span className="text-xl font-bold">Gestor de Stock</span>
          </Link>
        </header>
        <Sidebar />
      </div>

      {/* Columna del Contenido Principal */}
      <main className="p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
