// src/components/organisms/TablaMovimientos.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import Spinner from "../atoms/Spinner";

export default function MovementTable() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/stock/historic-movement")
      .then((response) => setMovimientos(response.data))
      .catch((error) => console.error("Error al obtener movimientos:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-AR");
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
    <div className="bg-slate-800 rounded-lg shadow-xl overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs uppercase bg-slate-700 text-slate-400">
          <tr>
            <th className="py-3 px-6">Fecha</th>
            <th className="py-3 px-6">Item</th>
            <th className="py-3 px-6">Tipo</th>
            <th className="py-3 px-6 text-center">Cantidad Movida</th>
            <th className="py-3 px-6 text-center">Stock Anterior</th>
            <th className="py-3 px-6 text-center">Stock Nuevo</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((mov) => (
            <tr
              key={mov.id}
              className="border-b border-slate-700 hover:bg-slate-600"
            >
              <td className="py-4 px-6 text-slate-400">
                {formatFecha(mov.fecha_movimiento)}
              </td>
              <td className="py-4 px-6 font-medium text-white">
                {mov.nombre_item}
              </td>
              <td className="py-4 px-6">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeClass(
                    mov.tipo_movimiento
                  )}`}
                >
                  {mov.tipo_movimiento}
                </span>
              </td>
              <td
                className={`py-4 px-6 text-center font-mono font-bold ${
                  mov.cantidad_unidades_movidas > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {mov.cantidad_unidades_movidas > 0 ? "+" : ""}
                {mov.cantidad_unidades_movidas.toFixed(2)}
              </td>
              <td className="py-4 px-6 text-center font-mono">
                {mov.stock_anterior.toFixed(2)}
              </td>
              <td className="py-4 px-6 text-center font-mono">
                {mov.stock_nuevo.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
