// src/pages/MovementDetailPage.jsx
import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import Spinner from "../components/atoms/Spinner";
import { ArrowLeft, Package, Droplet, ShoppingCart } from "lucide-react";

// --- 1. Componente de Botón de Toggle (CORREGIDO) ---
// (Error de sintaxis de comillas arreglado)
const ViewToggleButton = ({ onClick, isActive, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors ${
      isActive
        ? "bg-[var(--color-primary)] text-white"
        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
    }`}
  >
    {children}
  </button>
);

// --- 2. Componente DetailTable (Sin cambios) ---
// Esta tabla muestra los *ingredientes* de un grupo
function DetailTable({ movimientos, viewAs }) {
  const keySuffix = viewAs === "ml" ? "_ml" : "_unid";
  const unitLabel = viewAs === "ml" ? "ml" : "env.";

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "--";
    return viewAs === "ml" ? num.toFixed(0) : num.toFixed(3);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-inner overflow-x-auto">
      <table className="w-full text-sm text-left text-[var(--color-text-secondary)]">
        <thead className="text-xs uppercase bg-gray-50 text-gray-400">
          <tr>
            <th className="py-3 px-6">Ingrediente Consumido</th>
            <th className="py-3 px-6 text-center">
              Cant. Movida ({unitLabel})
            </th>
            <th className="py-3 px-6 text-center">
              Stock Anterior ({unitLabel})
            </th>
            <th className="py-3 px-6 text-center">Stock Nuevo ({unitLabel})</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((mov) => {
            const cantidad = mov[`cantidad_movida${keySuffix}`];
            const anterior = mov[`stock_anterior${keySuffix}`];
            const nuevo = mov[`stock_nuevo${keySuffix}`];

            return (
              <tr key={mov.id} className="border-b border-gray-50">
                <td className="py-4 px-6 font-medium text-[var(--color-text-primary)]">
                  {mov.nombre_item}
                </td>
                <td
                  className={`py-4 px-6 text-center font-mono font-bold ${
                    mov.cantidad_movida_ml > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {mov.cantidad_movida_ml > 0 ? "+" : ""}
                  {formatNumber(cantidad)} {unitLabel}
                </td>
                <td className="py-4 px-6 text-center font-mono">
                  {formatNumber(anterior)} {unitLabel}
                </td>
                <td className="py-4 px-6 text-center font-mono">
                  {formatNumber(nuevo)} {unitLabel}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- 3. Componente EventSummary (Sin cambios) ---
// (Ya estaba correcto)
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
      case "PRODUCCION":
        return "bg-blue-500/20 text-blue-400";
      case "CONSUMO":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  return (
    <div className="bg-[var(--color-surface)] p-6 rounded-lg shadow-[var(--shadow-card)] border-l-4 border-[var(--color-primary)]">
      <div className="flex justify-between items-center mb-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeClass(
            evento.tipo_evento,
          )}`}
        >
          {evento.tipo_evento.replace("_", " ")}
        </span>
        <span className="text-sm text-slate-400">
          {formatFecha(evento.fecha_evento)}
        </span>
      </div>
      <p className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
        {evento.evento_descripcion}
      </p>
      <div className="flex items-center text-[var(--color-text-muted)]">
        <Package className="h-4 w-4 mr-2" />
        <span>{evento.movimientos?.length || 0} ingredientes afectados</span>
      </div>
    </div>
  );
}

// --- 4. Función groupMovements (CORREGIDA) ---
// (Añadida validación para descripciones nulas)
function groupMovements(movements) {
  if (!movements || movements.length === 0) {
    return {};
  }

  const ventaRegex = /^(Venta: \d+x [^()]+)\s\(/;

  return movements.reduce((acc, mov) => {
    let groupKey = "Movimientos Generales";

    // --- CORRECCIÓN AQUÍ ---
    // Verificar que la descripción exista antes de usar .match() o .split()
    if (mov.descripcion_movimiento) {
      if (mov.tipo_ingrediente) {
        // Es un ingrediente (ITEM o PREBATCH)
        const match = mov.descripcion_movimiento.match(ventaRegex);
        if (match && match[1]) {
          groupKey = match[1].trim(); // ej. "Venta: 5x NEGRONI"
        } else {
          // Fallback (ej. "Producción Semanal (Consumo: ...)")
          groupKey =
            mov.descripcion_movimiento.split("(")[0].trim() || groupKey;
        }
      } else {
        // Es un movimiento sin tipo (ej. Compra, Ajuste)
        groupKey = mov.descripcion_movimiento;
      }
    }
    // --- FIN CORRECCIÓN ---

    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(mov);
    return acc;
  }, {});
}

// --- 5. Componente Principal (Sin cambios) ---
export default function MovementDetailPage() {
  const { id } = useParams();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewAs, setViewAs] = useState("unid"); // Default en 'unid'

  useEffect(() => {
    setLoading(true);
    api
      .get(`/stock/historic-movement/${id}`)
      .then((response) => setEvento(response.data))
      .catch((error) => console.error("Error al obtener detalle:", error))
      .finally(() => setLoading(false));
  }, [id]);

  const groupedMovements = useMemo(() => {
    if (!evento?.movimientos) return {};
    return groupMovements(evento.movimientos);
  }, [evento]);

  if (loading) return <Spinner />;
  if (!evento) return <p>No se encontró el evento.</p>;

  const groupKeys = Object.keys(groupedMovements);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] font-display uppercase tracking-wide">
          Detalle del Movimiento
        </h2>
        <Link
          to="/historicMovements"
          className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:opacity-80"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Historial
        </Link>
      </div>

      <EventSummary evento={evento} />

      {/* Toggle de Unidades */}
      {evento.movimientos && evento.movimientos.length > 0 && (
        <div className="flex justify-end items-center gap-2">
          <span className="text-sm text-[var(--color-text-muted)]">
            Ver en:
          </span>
          <ViewToggleButton
            onClick={() => setViewAs("unid")}
            isActive={viewAs === "unid"}
          >
            <Package className="h-4 w-4" /> Envases (env.)
          </ViewToggleButton>
          <ViewToggleButton
            onClick={() => setViewAs("ml")}
            isActive={viewAs === "ml"}
          >
            <Droplet className="h-4 w-4" /> Mililitros (ml)
          </ViewToggleButton>
        </div>
      )}

      {/* Lista de Grupos de Movimiento */}
      <div className="space-y-6">
        {groupKeys.length === 0 && (
          <p className="text-slate-500 text-center py-4">
            No hay movimientos de ingredientes asociados a este evento.
          </p>
        )}

        {groupKeys.map((groupKey) => (
          <div
            key={groupKey}
            className="bg-[var(--color-surface)] p-4 rounded-lg shadow-[var(--shadow-card)] border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-3 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {groupKey}
            </h3>
            <DetailTable
              movimientos={groupedMovements[groupKey]}
              viewAs={viewAs}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
