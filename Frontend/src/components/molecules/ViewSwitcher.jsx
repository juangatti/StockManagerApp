// src/components/molecules/ViewSwitcher.jsx
import { LayoutGrid, List } from "lucide-react";

export default function ViewSwitcher({ activeView, onViewChange }) {
  // Determina la vista a la que se cambiará y el icono/texto correspondiente
  const isResumenActive = activeView === "resumen";
  const nextView = isResumenActive ? "detalle" : "resumen";
  const ButtonIcon = isResumenActive ? List : LayoutGrid;
  const buttonText = isResumenActive
    ? "Ver Vista Detallada"
    : "Ver Vista Resumen";

  // Función para cambiar a la siguiente vista
  const handleToggleView = () => {
    onViewChange(nextView);
  };

  // Clase base del botón
  const buttonClass =
    "flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors duration-200";

  return (
    // Contenedor que ocupa el ancho completo, botón centrado si es necesario
    <div className="mb-8 flex justify-center">
      {/* Botón único que alterna la vista */}
      <button onClick={handleToggleView} className={buttonClass}>
        <ButtonIcon className="h-4 w-4" />
        {buttonText}
      </button>
    </div>
  );
}
