// src/components/organisms/MovementTable.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <-- 1. Importar useNavigate
import api from "../../api/api";
import Spinner from "../atoms/Spinner";
import { Eye } from "lucide-react"; // <-- Ícono de "ver"

export default function MovementTable() {
  const [eventos, setEventos] = useState([]); // Guardamos eventos
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // <-- 2. Hook para navegar

  useEffect(() => {
    api
      .get("/stock/historic-movement") // Esta es la API de la lista
      .then((response) => setEventos(response.data))
      .catch((error) => console.error("Error al obtener eventos:", error))
      .finally(() => setLoading(false));
  }, []);

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getTypeClass = (type) => {
    switch (type) {
      case "COMPRA":
        return "bg-green-500/20 text-green-400";
      case "VENTA":
        return "bg-red-500/20 text-red-400";
      case "AJUSTE":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  // 3. Función para navegar al detalle
  const handleViewDetails = (eventoId) => {
    navigate(`/historicMovements/${eventoId}`);
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs uppercase bg-slate-700 text-slate-400">
          <tr>
            <th className="py-3 px-6">Fecha</th>
            <th className="py-3 px-6">Tipo</th>
            <th className="py-3 px-6">Descripción del Evento</th>
            <th className="py-3 px-6 text-center">Items Afectados</th>
            <th className="py-3 px-6 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {eventos.map((evento) => (
            <tr
              key={evento.evento_id}
              className="border-b border-slate-700 hover:bg-slate-600/50 cursor-pointer"
              onClick={() => handleViewDetails(evento.evento_id)} // 4. Fila clickeable
            >
              <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                {formatFecha(evento.fecha_evento)}
              </td>
              <td className="py-4 px-6">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeClass(
                    evento.tipo_evento
                  )}`}
                >
                  {evento.tipo_evento}
                </span>
              </td>
              <td className="py-4 px-6 font-medium text-white">
                {evento.evento_descripcion}
              </td>
              <td className="py-4 px-6 text-center font-mono">
                {evento.items_afectados}
              </td>
              <td className="py-4 px-6 text-right">
                {/* 5. Botón visual de "Ver" */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que el clic de la fila se dispare también
                    handleViewDetails(evento.evento_id);
                  }}
                  className="p-2 rounded-md hover:bg-slate-700"
                  title="Ver detalle"
                >
                  <Eye className="h-5 w-5 text-sky-400" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
