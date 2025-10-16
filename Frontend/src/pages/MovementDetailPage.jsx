import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import Spinner from "../components/atoms/Spinner";
import { ArrowLeft, Package } from "lucide-react";

// Componente de la tabla de detalle (solo para este archivo)
function DetailTable({ movimientos }) {
  const formatNumber = (num) => num.toFixed(2);
  return (
    <div className="bg-slate-800 rounded-lg shadow-xl overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs uppercase bg-slate-700 text-slate-400">
          <tr>
            <th className="py-3 px-6">Item</th>
            <th className="py-3 px-6 text-center">Cantidad Movida</th>
            <th className="py-3 px-6 text-center">Stock Anterior</th>
            <th className="py-3 px-6 text-center">Stock Nuevo</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((mov) => (
            <tr key={mov.id} className="border-b border-slate-700">
              <td className="py-4 px-6 font-medium text-white">
                {mov.nombre_item}
              </td>
              <td
                className={`py-4 px-6 text-center font-mono font-bold ${
                  mov.cantidad_movida > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {mov.cantidad_movida > 0 ? "+" : ""}
                {formatNumber(mov.cantidad_movida)}
              </td>
              <td className="py-4 px-6 text-center font-mono">
                {formatNumber(mov.stock_anterior)}
              </td>
              <td className="py-4 px-6 text-center font-mono">
                {formatNumber(mov.stock_nuevo)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente de la tarjeta de resumen del evento
function EventSummary({ evento }) {
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-AR", {
      dateStyle: "full",
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

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border-l-4 border-sky-500">
      <div className="flex justify-between items-center mb-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeClass(
            evento.tipo_evento
          )}`}
        >
          {evento.tipo_evento}
        </span>
        <span className="text-sm text-slate-400">
          {formatFecha(evento.fecha_evento)}
        </span>
      </div>
      <p className="text-xl font-semibold text-white mb-2">
        {evento.evento_descripcion}
      </p>
      <div className="flex items-center text-slate-400">
        <Package className="h-4 w-4 mr-2" />
        <span>{evento.movimientos.length} items afectados</span>
      </div>
    </div>
  );
}

// Página principal de detalle
export default function MovementDetailPage() {
  const { id } = useParams();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/stock/historic-movement/${id}`)
      .then((response) => setEvento(response.data))
      .catch((error) => console.error("Error al obtener detalle:", error))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!evento) return <p>No se encontró el evento.</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">
          Detalle del Movimiento
        </h2>
        <Link
          to="/historicMovements"
          className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Historial
        </Link>
      </div>

      <EventSummary evento={evento} />
      <DetailTable movimientos={evento.movimientos} />
    </div>
  );
}
