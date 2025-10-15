// src/components/organisms/PrebatchesTable.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import Spinner from "../atoms/Spinner";
import toast from "react-hot-toast";
import { Edit, Trash2 } from "lucide-react";

// Aceptamos las props que vienen del PrebatchManager
export default function PrebatchesTable({
  isAdmin,
  onEdit,
  refreshDependency,
}) {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPrebatches = () => {
    setLoading(true);
    api
      .get("/prebatches")
      .then((response) => setLotes(response.data))
      .catch(() => toast.error("No se pudieron cargar los lotes."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrebatches();
  }, [refreshDependency]); // Se refresca cuando la 'key' del padre cambia

  const handleDelete = (id, name) => {
    if (window.confirm(`¿Seguro que quieres desactivar "${name}"?`)) {
      toast.promise(api.delete(`/prebatches/${id}`), {
        loading: "Desactivando...",
        success: () => {
          fetchPrebatches();
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
      // AQUÍ ESTÁ LA CORRECCIÓN: Añadimos un 'default' para manejar "FRESCO" y cualquier otro caso.
      default:
        return { text: "Fresco", className: "bg-green-500/20 text-green-400" };
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("es-AR");

  if (loading) return <Spinner />;

  return (
    <div className="overflow-x-auto">
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
          {lotes.map((lote) => {
            const status = getStatusInfo(lote.estado); // Ahora 'status' nunca será undefined
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
                        onClick={() => onEdit(lote)}
                        className="p-2 rounded-md hover:bg-slate-700"
                      >
                        <Edit className="h-5 w-5 text-sky-400" />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(lote.id, lote.nombre_prebatch)
                        }
                        className="p-2 rounded-md hover:bg-slate-700"
                      >
                        <Trash2 className="h-5 w-5 text-red-500 hover:text-red-400" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
