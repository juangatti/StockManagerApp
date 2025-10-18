// src/components/organisms/PrebatchesTable.jsx
import toast from "react-hot-toast";
import { Edit, Trash2 } from "lucide-react";
import api from "../../api/api"; // Necesitamos api para eliminar
import Spinner from "../atoms/Spinner"; // Necesitamos Spinner

// 1. Recibe 'prebatches', 'loading', y 'onDeleteSuccess' como props
export default function PrebatchesTable({
  prebatches,
  loading,
  isAdmin,
  onEdit,
  onDeleteSuccess, // Función a llamar después de eliminar
}) {
  // 2. Ya no necesitamos el estado interno ni useEffect para fetching

  const handleDelete = (id, name) => {
    if (window.confirm(`¿Seguro que quieres desactivar "${name}"?`)) {
      toast.promise(api.delete(`/prebatches/${id}`), {
        loading: "Desactivando...",
        success: () => {
          onDeleteSuccess(); // 3. Llamar a la función de refresco del padre
          return "Desactivado con éxito.";
        },
        error: "No se pudo desactivar.",
      });
    }
  };

  // (getStatusInfo y formatDate no cambian)
  const getStatusInfo = (estado) => {
    switch (estado) {
      case "ADVERTENCIA":
        return {
          text: "Advertencia",
          className: "bg-yellow-500/20 text-yellow-400",
        };
      case "VENCIDO":
        return { text: "Vencido", className: "bg-red-500/20 text-red-400" };
      default:
        return { text: "Fresco", className: "bg-green-500/20 text-green-400" };
    }
  };
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("es-AR");

  return (
    <div className="overflow-x-auto relative">
      {" "}
      {/* Añadimos relative para el spinner overlay */}
      {/* 4. Indicador de carga sutil */}
      {loading && (
        <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center z-10">
          <Spinner />
        </div>
      )}
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs uppercase bg-slate-700 text-slate-400">
          <tr>
            <th className="py-3 px-6">Nombre del Prebatch</th>
            <th className="py-3 px-6">Fecha Producción</th>
            <th className="py-3 px-6 text-center">Cant. Actual (ml)</th>
            <th className="py-3 px-6 text-center">Estado</th>
            {isAdmin && <th className="py-3 px-6 text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {/* 5. Mensaje si no hay datos */}
          {!loading && prebatches.length === 0 ? (
            <tr>
              <td
                colSpan={isAdmin ? 5 : 4}
                className="text-center py-8 text-slate-500"
              >
                No se encontraron prebatches.
              </td>
            </tr>
          ) : (
            // Usamos los 'prebatches' recibidos por props
            prebatches.map((lote) => {
              const status = getStatusInfo(lote.estado);
              return (
                <tr
                  key={lote.id}
                  className="border-b border-slate-700 hover:bg-slate-600"
                >
                  <td className="py-4 px-6 font-medium text-white">
                    {lote.nombre_prebatch}
                  </td>
                  <td className="py-4 px-6">
                    {formatDate(lote.fecha_produccion)}
                  </td>
                  <td className="py-4 px-6 text-center font-mono">
                    {lote.cantidad_actual_ml.toFixed(0)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${status.className}`}
                    >
                      {status.text}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(lote)} // onEdit no cambia
                          className="p-2 rounded-md hover:bg-slate-700"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5 text-sky-400" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(lote.id, lote.nombre_prebatch)
                          } // handleDelete ahora usa onDeleteSuccess
                          className="p-2 rounded-md hover:bg-slate-700"
                          title="Desactivar"
                        >
                          <Trash2 className="h-5 w-5 text-red-500 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
