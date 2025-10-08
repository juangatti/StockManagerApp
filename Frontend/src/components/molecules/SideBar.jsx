import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Package,
  FileClock,
  GitPullRequest,
  PlusCircle,
  Settings,
  SlidersHorizontal,
  UploadCloud,
  CookingPot,
  GlassWater,
} from "lucide-react";
import useAuthStore from "../../stores/useAuthStore";

const NavGroup = ({ title, children }) => (
  <div>
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">
      {title}
    </h3>
    <div className="space-y-1">{children}</div>
  </div>
);

const NavItem = ({ to, icon: Icon, children }) => {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-sky-500/10 text-sky-400"
        : "text-slate-300 hover:bg-slate-700 hover:text-white"
    }`;

  return (
    <NavLink to={to} className={navLinkClass}>
      <Icon className="h-4 w-4" />
      {children}
    </NavLink>
  );
};

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  return (
    <aside className="bg-slate-800/50 border-r border-slate-700 p-4 flex flex-col gap-8">
      <NavGroup title="Principal">
        <NavItem to="/" icon={LayoutDashboard}>
          Home
        </NavItem>
      </NavGroup>

      <NavGroup title="Vistas de Stock">
        <NavItem to="/inventory" icon={Package}>
          Inventario
        </NavItem>
        <NavItem to="/prebatches" icon={CookingPot}>
          Prebatches
        </NavItem>
        <NavItem to="/historicMovements" icon={FileClock}>
          Historial
        </NavItem>
      </NavGroup>

      <NavGroup title="Operaciones">
        <NavItem to="/sales" icon={UploadCloud}>
          Cargar Ventas
        </NavItem>
        <NavItem to="/shopping" icon={PlusCircle}>
          Registrar Compra
        </NavItem>
        <NavItem to="/adjust" icon={SlidersHorizontal}>
          Ajustar Stock
        </NavItem>
      </NavGroup>
      {user?.role === "admin" && (
        <NavGroup title="Administración">
          <NavItem to="/admin" icon={Settings}>
            Gestionar Catálogo
          </NavItem>
        </NavGroup>
      )}
    </aside>
  );
}
