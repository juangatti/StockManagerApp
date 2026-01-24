// src/components/molecules/SideBar.jsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileClock,
  ClipboardList,
  UploadCloud,
  PlusCircle,
  SlidersHorizontal,
  Settings,
  Hammer,
  CalendarDays,
  Clock,
  Beer,
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

const NavItem = ({ to, icon: Icon, children, onLinkClick }) => {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-[var(--color-primary)] text-white shadow-md font-bold tracking-wide"
        : "text-gray-400 hover:bg-[var(--color-secondary)] hover:text-white hover:translate-x-1"
    }`;

  return (
    <NavLink to={to} className={navLinkClass} onClick={onLinkClick}>
      <Icon
        className={`h-4 w-4 ${({ isActive }) => (isActive ? "text-white" : "")}`}
      />
      {children}
    </NavLink>
  );
};

export default function Sidebar({ onLinkClick }) {
  const user = useAuthStore((state) => state.user);

  // --- FUNCIÓN HELPER PARA VERIFICAR PERMISOS ---
  const hasPermission = (perm) => {
    // 1. Si es un rol con "Superpoderes", acceso total siempre
    if (
      user?.role_name === "SuperAdmin" ||
      user?.role_name === "GameMaster" || // Tu rol actual
      user?.role_name === "admin"
    ) {
      return true;
    }
    // 2. Si no, buscamos en la lista de permisos granulares
    return user?.permissions?.includes(perm);
  };

  // Lógica para mostrar grupos enteros solo si tiene algún permiso dentro
  const showOperationsGroup =
    hasPermission("sales:upload") ||
    hasPermission("purchases:create") ||
    hasPermission("stock:adjust") ||
    hasPermission("production:create");

  const showAdminGroup =
    hasPermission("catalog:manage") ||
    hasPermission("users:manage") ||
    hasPermission("roles:manage") ||
    hasPermission("history:view");

  return (
    <aside className="flex flex-col gap-8">
      {/* --- GRUPO ANÁLISIS Y REPORTES (Visible para todos) --- */}
      <NavGroup title="Análisis y Reportes">
        <NavItem
          to="/dashboard"
          icon={LayoutDashboard}
          onLinkClick={onLinkClick}
        >
          Escritorio
        </NavItem>
        <NavItem
          to="/financial-dashboard"
          icon={FileClock}
          onLinkClick={onLinkClick}
        >
          Gastos y Compras
        </NavItem>
        <NavItem to="/bar" icon={ClipboardList} onLinkClick={onLinkClick}>
          Barra (Stock)
        </NavItem>
        <NavItem to="/keg-report" icon={Beer} onLinkClick={onLinkClick}>
          Barriles
        </NavItem>
      </NavGroup>

      {/* --- GRUPO OPERACIONES --- */}
      {showOperationsGroup && (
        <NavGroup title="Operaciones de Stock">
          {hasPermission("sales:upload") && (
            <NavItem to="/sales" icon={UploadCloud} onLinkClick={onLinkClick}>
              Cargar Ventas
            </NavItem>
          )}

          {hasPermission("purchases:create") && (
            <NavItem to="/shopping" icon={PlusCircle} onLinkClick={onLinkClick}>
              Registrar Compra
            </NavItem>
          )}

          {hasPermission("stock:adjust") && (
            <NavItem
              to="/adjust"
              icon={SlidersHorizontal}
              onLinkClick={onLinkClick}
            >
              Ajustar Stock
            </NavItem>
          )}

          {hasPermission("production:create") && (
            <NavItem to="/production" icon={Hammer} onLinkClick={onLinkClick}>
              Registrar Producción
            </NavItem>
          )}
        </NavGroup>
      )}

      {/* --- GRUPO AGENDA --- */}
      {(hasPermission("reservations:view") ||
        hasPermission("schedules:view")) && (
        <NavGroup title="Recepción">
          {hasPermission("reservations:view") && (
            <NavItem
              to="/reservations"
              icon={CalendarDays}
              onLinkClick={onLinkClick}
            >
              Agenda y Reservas
            </NavItem>
          )}
          {hasPermission("schedules:view") && (
            <NavItem to="/cronograma" icon={Clock} onLinkClick={onLinkClick}>
              Horarios
            </NavItem>
          )}
        </NavGroup>
      )}

      {/* --- GRUPO ADMINISTRACIÓN --- */}
      {showAdminGroup && (
        <NavGroup title="Administración">
          {/* El link a /admin se muestra si tiene CUALQUIER permiso de gestión */}
          {(hasPermission("catalog:manage") ||
            hasPermission("users:manage") ||
            hasPermission("roles:manage")) && (
            <NavItem to="/admin" icon={Settings} onLinkClick={onLinkClick}>
              Administración
            </NavItem>
          )}

          {hasPermission("history:view") && (
            <NavItem
              to="/historicMovements"
              icon={FileClock}
              onLinkClick={onLinkClick}
            >
              Historial
            </NavItem>
          )}
        </NavGroup>
      )}
    </aside>
  );
}
