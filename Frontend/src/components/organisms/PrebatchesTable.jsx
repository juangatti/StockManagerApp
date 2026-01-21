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
          className: "bg-amber-100 text-amber-700 border-amber-200",
        };
      case "VENCIDO":
        return {
          text: "Vencido",
          className: "bg-red-100 text-red-700 border-red-200",
        };
      default:
        return {
          text: "Fresco",
          className: "bg-green-100 text-green-700 border-green-200",
        };
    }
  };
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("es-AR");

  return (
    <div className="overflow-x-auto relative rounded-lg border border-gray-100 shadow-sm">
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
          <Spinner /> {/* */}
        </div>
      )}
      <table className="w-full text-sm text-left text-text-secondary">
        <thead className="text-xs uppercase bg-gray-50 text-text-muted hidden md:table-header-group border-b border-gray-100 font-display font-bold tracking-wider">
          <tr>
            <th className="py-4 px-6">Nombre del Prebatch</th>
            <th className="py-4 px-6">Categoría</th>
            <th className="py-4 px-6">Fecha Prod.</th>
            <th className="py-4 px-6 text-center">Cant. Actual (ml)</th>
            <th className="py-4 px-6 text-center">Estado</th>
            {isAdmin && <th className="py-4 px-6 text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {!loading && prebatches.length === 0 ? (
            <tr>
              <td
                colSpan={isAdmin ? 6 : 5}
                className="text-center py-12 text-text-muted italic font-medium"
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
                  className="block md:table-row border-b border-gray-50 mb-4 md:mb-0 bg-gray-50 md:bg-transparent rounded-lg md:rounded-none overflow-hidden md:overflow-visible shadow-sm md:shadow-none hover:bg-gray-100/30 transition-colors"
                >
                  <td
                    data-label="Nombre"
                    className="block md:table-cell py-4 px-6 font-bold text-text-primary border-b md:border-b-0 border-gray-100 font-display uppercase tracking-tight"
                  >
                    <span className="md:hidden font-bold text-text-secondary mr-2 uppercase text-xs">
                      Nombre:
                    </span>
                    {lote.nombre_prebatch}
                  </td>

                  <td
                    data-label="Categoría"
                    className="block md:table-cell py-4 px-6 text-xs text-text-muted border-b md:border-b-0 border-gray-100 whitespace-nowrap"
                  >
                    <span className="md:hidden font-bold text-text-secondary mr-2 uppercase text-xs">
                      Categoría:
                    </span>
                    {lote.categoria_nombre ? (
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-md text-text-primary font-bold shadow-sm">
                        <Tag className="h-3 w-3 text-primary" />
                        {lote.categoria_nombre}
                      </span>
                    ) : (
                      <span className="italic text-text-muted">--</span>
                    )}
                  </td>

                  <td
                    data-label="Producción"
                    className="block md:table-cell py-4 px-6 border-b md:border-b-0 border-gray-100 text-text-secondary font-medium"
                  >
                    <span className="md:hidden font-bold text-text-secondary mr-2 uppercase text-xs">
                      Producción:
                    </span>
                    {formatDate(lote.fecha_produccion)}
                  </td>

                  <td
                    data-label="Cantidad"
                    className="block md:table-cell py-4 px-6 text-left md:text-center font-mono border-b md:border-b-0 border-gray-100 font-bold text-text-primary"
                  >
                    <span className="md:hidden font-bold text-text-secondary mr-2 uppercase text-xs">
                      Cantidad:
                    </span>
                    {lote.cantidad_actual_ml.toFixed(0)}{" "}
                    <span className="md:hidden text-xs text-text-muted">
                      ml
                    </span>
                  </td>

                  <td
                    data-label="Estado"
                    className="block md:table-cell py-4 px-6 text-left md:text-center border-b md:border-b-0 border-gray-100"
                  >
                    <span className="md:hidden font-bold text-text-secondary mr-2 uppercase text-xs">
                      Estado:
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${status.className}`}
                    >
                      {status.text}
                    </span>
                  </td>

                  {isAdmin && (
                    <td
                      data-label="Acciones"
                      className="block md:table-cell py-4 px-6 text-left md:text-right"
                    >
                      <div className="flex items-center justify-start md:justify-end gap-2">
                        <span className="md:hidden font-bold text-text-secondary mr-2 uppercase text-xs">
                          Acciones:
                        </span>
                        <button
                          onClick={() => onEdit(lote)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-all text-text-muted hover:text-primary"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(lote.id, lote.nombre_prebatch)
                          }
                          className="p-2 rounded-lg hover:bg-red-50 transition-all text-text-muted hover:text-primary"
                          title="Desactivar"
                        >
                          <Trash2 className="h-5 w-5" />
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
