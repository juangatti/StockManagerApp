// src/components/molecules/SideBar.jsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  // Package, // <-- Eliminado
  FileClock,
  // CookingPot, // <-- Eliminado
  ClipboardList, // <-- Usaremos este para Barra
  UploadCloud,
  PlusCircle,
  SlidersHorizontal,
  Settings,
  Hammer, // <-- Icono para Producción (ejemplo)
} from "lucide-react";
import useAuthStore from "../../stores/useAuthStore"; //

// ... (NavGroup y NavItem sin cambios) ...
const NavGroup = ({ title, children }) => (
  <div>
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">
      {title}
    </h3>
    <div className="space-y-1">{children}</div>
  </div>
);

const NavItem = ({ to, icon: Icon, children, onLinkClick }) => {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-sky-500/10 text-sky-400"
        : "text-slate-300 hover:bg-slate-700 hover:text-white"
    }`;

  return (
    <NavLink to={to} className={navLinkClass} onClick={onLinkClick}>
      <Icon className="h-4 w-4" />
      {children}
    </NavLink>
  );
};

export default function Sidebar({ onLinkClick }) {
  const user = useAuthStore((state) => state.user); //

  return (
    <aside className="flex flex-col gap-8">
      {/* --- GRUPO ANÁLISIS Y REPORTES --- */}
      <NavGroup title="Análisis y Reportes">
        <NavItem
          to="/dashboard"
          icon={LayoutDashboard}
          onLinkClick={onLinkClick}
        >
          Dashboard
        </NavItem>
        {/* <NavItem to="/inventory" icon={Package} onLinkClick={onLinkClick}> Inventario </NavItem> */}{" "}
        {/* <-- Eliminado */}
        {/* <NavItem to="/prebatches" icon={CookingPot} onLinkClick={onLinkClick}> Prebatches </NavItem> */}{" "}
        {/* <-- Eliminado */}
        {/* Nuevo NavItem para Barra */}
        <NavItem to="/bar" icon={ClipboardList} onLinkClick={onLinkClick}>
          Barra (Stock)
        </NavItem>
      </NavGroup>

      {/* --- GRUPO OPERACIONES --- */}
      {user?.role === "admin" && (
        <NavGroup title="Operaciones de Stock">
          <NavItem to="/sales" icon={UploadCloud} onLinkClick={onLinkClick}>
            Cargar Ventas
          </NavItem>
          <NavItem to="/shopping" icon={PlusCircle} onLinkClick={onLinkClick}>
            Registrar Compra
          </NavItem>
          <NavItem
            to="/adjust"
            icon={SlidersHorizontal}
            onLinkClick={onLinkClick}
          >
            Ajustar Stock
          </NavItem>
          {/* Nuevo NavItem para Producción */}
          <NavItem to="/production" icon={Hammer} onLinkClick={onLinkClick}>
            Registrar Producción
          </NavItem>
        </NavGroup>
      )}

      {/* --- GRUPO ADMINISTRACIÓN --- */}
      {user?.role === "admin" && (
        <NavGroup title="Administración">
          <NavItem to="/admin" icon={Settings} onLinkClick={onLinkClick}>
            Gestionar Catálogo
          </NavItem>
          <NavItem
            to="/historicMovements"
            icon={FileClock}
            onLinkClick={onLinkClick}
          >
            Historial
          </NavItem>
        </NavGroup>
      )}
    </aside>
  );
}
