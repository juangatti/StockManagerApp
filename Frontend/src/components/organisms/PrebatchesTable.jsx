import { useState, useEffect } from "react";
import axios from "axios";
import Spinner from "../atoms/Spinner";

export default function PrebatchesTable() {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // La URL ahora es /api/prebatches
    axios
      .get("http://localhost:5000/api/prebatches")
      .then((response) => setLotes(response.data))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <Spinner />;

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs uppercase bg-slate-700 text-slate-400">
          <tr>
            <th className="py-3 px-6">Nombre del Prebatch</th>
            <th className="py-3 px-6">Fecha Producción</th>
            <th className="py-3 px-6 text-center">Cant. Actual (ml)</th>
            <th className="py-3 px-6 text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          {lotes.map((lote) => {
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
