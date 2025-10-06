import { LayoutGrid, List } from "lucide-react";

export default function ViewSwitcher({ activeView, onViewChange }) {
  const buttonClass = (type) =>
    `flex items-center justify-center w-full px-4 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors duration-200 ${
      activeView === type
        ? "bg-sky-600 border-sky-500 text-white"
        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
    }`;

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <button
        onClick={() => onViewChange("resumen")}
        className={buttonClass("resumen")}
      >
        <LayoutGrid className="mr-2 h-4 w-4" />
        Vista Resumen (Totales)
      </button>
      <button
        onClick={() => onViewChange("detalle")}
        className={buttonClass("detalle")}
      >
        <List className="mr-2 h-4 w-4" />
        Vista Detallada (Listado)
      </button>
    </div>
  );
}
