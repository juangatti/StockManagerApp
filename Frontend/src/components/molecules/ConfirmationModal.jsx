import React from "react";
import { AlertTriangle, Check, X } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  title,
  changes, // Array: { id, nombre_completo, stock_anterior, conteo_nuevo }
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isSubmitting = false, // Para mostrar estado de carga en el botón confirmar
}) {
  if (!isOpen) return null;

  return (
    // Fondo oscuro semi-transparente
    <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4">
      {/* Contenedor del Modal */}
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-slate-700">
        {/* Encabezado */}
        <div className="p-4 border-b border-slate-700 flex items-center bg-slate-700/50">
          <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>

        {/* Cuerpo con la lista de cambios */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-300 mb-4">
            Por favor, revisa los siguientes cambios antes de guardar:
          </p>
          <ul className="space-y-2 text-sm">
            {changes.map((change) => (
              <li
                key={change.id}
                className="flex justify-between items-center p-2 bg-slate-900/50 rounded"
              >
                <span className="text-slate-200 mr-2">
                  {change.nombre_completo}:
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400">
                    {change.stock_anterior.toFixed(2)}
                  </span>
                  <span className="text-white mx-1">→</span>
                  <span
                    className={`font-bold ${
                      parseFloat(change.conteo_nuevo) > change.stock_anterior
                        ? "text-green-400"
                        : parseFloat(change.conteo_nuevo) <
                          change.stock_anterior
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {parseFloat(change.conteo_nuevo).toFixed(2)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pie con botones */}
        <div className="p-4 border-t border-slate-700 flex justify-end gap-4 bg-slate-700/50">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium rounded-md text-slate-300 bg-slate-600 hover:bg-slate-500 disabled:opacity-50"
          >
            <X className="inline h-4 w-4 mr-1" />
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-500 disabled:cursor-wait flex items-center"
          >
            {isSubmitting ? (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Check className="inline h-4 w-4 mr-1" />
            )}
            {isSubmitting ? "Guardando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
