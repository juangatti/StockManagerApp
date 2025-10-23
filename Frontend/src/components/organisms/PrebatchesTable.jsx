import toast from "react-hot-toast";
import { Edit, Trash2, Tag } from "lucide-react";
import api from "../../api/api"; //
import Spinner from "../atoms/Spinner"; //

export default function PrebatchesTable({
  prebatches,
  loading,
  isAdmin,
  onEdit,
  onDeleteSuccess,
}) {
  const handleDelete = (id, name) => {
    if (window.confirm(`¿Seguro que quieres desactivar "${name}"?`)) {
      toast.promise(api.delete(`/prebatches/${id}`), {
        //
        loading: "Desactivando...",
        success: () => {
          onDeleteSuccess();
          return "Desactivado con éxito.";
        },
        error: "No se pudo desactivar.",
      });
    }
  };

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
      {loading && (
        <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center z-10">
          <Spinner /> {/* */}
        </div>
      )}
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs uppercase bg-slate-700 text-slate-400 hidden md:table-header-group">
          <tr>
            <th className="py-3 px-6">Nombre del Prebatch</th>
            <th className="py-3 px-6">Categoría</th>
            <th className="py-3 px-6">Fecha Prod.</th>
            <th className="py-3 px-6 text-center">Cant. Actual (ml)</th>
            <th className="py-3 px-6 text-center">Estado</th>
            {isAdmin && <th className="py-3 px-6 text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {!loading && prebatches.length === 0 ? (
            <tr>
              <td
                colSpan={isAdmin ? 6 : 5}
                className="text-center py-8 text-slate-500"
              >
                No se encontraron prebatches.
              </td>
            </tr>
          ) : (
            prebatches.map((lote) => {
              const status = getStatusInfo(lote.estado);
              return (
                <tr
                  key={lote.id}
                  className="block md:table-row border-b border-slate-700 mb-2 md:mb-0 bg-slate-800/50 md:bg-transparent rounded-lg md:rounded-none overflow-hidden md:overflow-visible shadow-md md:shadow-none"
                >
                  <td
                    data-label="Nombre"
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 font-medium text-white border-b md:border-b-0 border-slate-700"
                  >
                    <span className="md:hidden font-semibold text-slate-400 mr-2">
                      Nombre:
                    </span>
                    {lote.nombre_prebatch}
                  </td>

                  <td
                    data-label="Categoría"
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 text-xs text-slate-400 border-b md:border-b-0 border-slate-700 whitespace-nowrap"
                  >
                    <span className="md:hidden font-semibold text-slate-400 mr-2">
                      Categoría:
                    </span>
                    {lote.categoria_nombre ? (
                      <span className="inline-flex items-center gap-1 bg-slate-700 px-2 py-0.5 rounded">
                        <Tag className="h-3 w-3" />
                        {lote.categoria_nombre}
                      </span>
                    ) : (
                      <span className="italic text-slate-500">--</span>
                    )}
                  </td>

                  <td
                    data-label="Producción"
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 border-b md:border-b-0 border-slate-700"
                  >
                    <span className="md:hidden font-semibold text-slate-400 mr-2">
                      Producción:
                    </span>
                    {formatDate(lote.fecha_produccion)}
                  </td>

                  <td
                    data-label="Cantidad"
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 text-left md:text-center font-mono border-b md:border-b-0 border-slate-700"
                  >
                    <span className="md:hidden font-semibold text-slate-400 mr-2">
                      Cantidad:
                    </span>
                    {lote.cantidad_actual_ml.toFixed(0)}{" "}
                    <span className="md:hidden text-xs text-slate-400">ml</span>
                  </td>

                  <td
                    data-label="Estado"
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 text-left md:text-center border-b md:border-b-0 border-slate-700"
                  >
                    <span className="md:hidden font-semibold text-slate-400 mr-2">
                      Estado:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${status.className}`}
                    >
                      {status.text}
                    </span>
                  </td>

                  {isAdmin && (
                    <td
                      data-label="Acciones"
                      className="block md:table-cell py-3 px-4 md:py-4 md:px-6 text-left md:text-right"
                    >
                      <div className="flex items-center justify-start md:justify-end gap-2">
                        <span className="md:hidden font-semibold text-slate-400 mr-2">
                          Acciones:
                        </span>
                        <button
                          onClick={() => onEdit(lote)}
                          className="p-2 rounded-md hover:bg-slate-700"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5 text-sky-400" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(lote.id, lote.nombre_prebatch)
                          }
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
