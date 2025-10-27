// src/components/organisms/MovementTable.jsx
import { useNavigate } from "react-router-dom";
import Spinner from "../atoms/Spinner";
import Alert from "../atoms/Alert";
import SearchBar from "../molecules/SearchBar";
import PaginationControls from "../molecules/PaginationControls";
import { useMovementHistory } from "../../hooks/useMovementHistory";
// 1. Importar el icono Hammer
import { Hammer } from "lucide-react";

export default function MovementTable() {
  const {
    eventos,
    pagination,
    loading,
    error,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
  } = useMovementHistory(20);

  const navigate = useNavigate();

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  // 2. Modificar getTypeClass para incluir 'PRODUCCION'
  const getTypeClass = (type) => {
    switch (type) {
      case "COMPRA":
        return "bg-green-500/20 text-green-400";
      case "VENTA":
        return "bg-red-500/20 text-red-400";
      case "AJUSTE":
        return "bg-amber-500/20 text-amber-400";
      // Añadir caso para PRODUCCION
      case "PRODUCCION":
        return "bg-blue-500/20 text-blue-400"; // Azul para producción
      // Añadir caso para CONSUMO_PRODUCCION (si aparece directamente en eventos)
      // Aunque normalmente estará dentro del detalle de un evento PRODUCCION
      case "CONSUMO_PRODUCCION":
        return "bg-purple-500/20 text-purple-400"; // Púrpura para consumo interno
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  // 3. Modificar getIconForType (NUEVA FUNCIÓN) para mostrar un icono
  const getIconForType = (type) => {
    switch (type) {
      case "COMPRA":
        return null; // O un icono de compra si lo deseas
      case "VENTA":
        return null; // O icono de venta
      case "AJUSTE":
        return null; // O icono de ajuste
      case "PRODUCCION":
        return <Hammer className="h-3 w-3 inline-block mr-1" />; // Icono para Producción
      case "CONSUMO_PRODUCCION":
        return null; // El consumo se ve en el detalle
      default:
        return null;
    }
  };

  const handleViewDetails = (eventoId) => {
    navigate(`/historicMovements/${eventoId}`);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Buscar por descripción del evento..."
      />

      {error && <Alert message={error} />}
      {loading && eventos.length === 0 && <Spinner />}

      <div className="overflow-x-auto relative">
        {loading && eventos.length > 0 && (
          <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center z-10">
            <Spinner />
          </div>
        )}
        <table className="w-full min-w-[600px] text-sm text-left text-slate-300">
          <thead className="text-xs uppercase bg-slate-700 text-slate-400 hidden md:table-header-group">
            <tr>
              <th className="py-3 px-6 whitespace-nowrap">Fecha</th>
              <th className="py-3 px-6 whitespace-nowrap">Tipo</th>
              <th className="py-3 px-6 whitespace-nowrap">Descripción</th>
              <th className="py-3 px-6 text-center whitespace-nowrap hidden md:table-cell">
                Items Afectados
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading && eventos.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  {searchQuery
                    ? "No se encontraron eventos."
                    : "No hay eventos para mostrar."}
                </td>
              </tr>
            ) : (
              eventos.map((evento) => (
                <tr
                  key={evento.evento_id}
                  className="block md:table-row border-b border-slate-700 mb-2 md:mb-0 bg-slate-800/50 md:bg-transparent rounded-lg md:rounded-none overflow-hidden md:overflow-visible shadow-md md:shadow-none cursor-pointer hover:bg-slate-700/50 md:hover:bg-slate-600/50"
                  onClick={() => handleViewDetails(evento.evento_id)}
                >
                  {/* Celda Fecha */}
                  <td
                    data-label="Fecha"
                    className="block md:table-cell py-2 px-4 md:py-4 md:px-6 text-slate-400 md:whitespace-nowrap border-b md:border-b-0 border-slate-700"
                  >
                    <span className="md:hidden font-semibold text-slate-500 mr-2">
                      Fecha:{" "}
                    </span>
                    {formatFecha(evento.fecha_evento)}
                  </td>
                  {/* Celda Tipo */}
                  <td
                    data-label="Tipo"
                    className="block md:table-cell py-2 px-4 md:py-4 md:px-6 border-b md:border-b-0 border-slate-700 md:whitespace-nowrap"
                  >
                    <span className="md:hidden font-semibold text-slate-500 mr-2">
                      Tipo:{" "}
                    </span>
                    {/* 4. Usar getIconForType y getTypeClass */}
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getTypeClass(
                        evento.tipo_evento
                      )}`}
                    >
                      {getIconForType(evento.tipo_evento)}
                      {evento.tipo_evento.replace("_", " ")}{" "}
                      {/* Reemplazar guion bajo */}
                    </span>
                  </td>
                  {/* Celda Descripción */}
                  <td
                    data-label="Descripción"
                    className="block md:table-cell py-2 px-4 md:py-4 md:px-6 font-medium text-white border-b md:border-b-0 border-slate-700 md:truncate"
                    title={evento.evento_descripcion}
                  >
                    <span className="md:hidden font-semibold text-slate-500 mr-2">
                      Descripción:{" "}
                    </span>
                    {evento.evento_descripcion}
                  </td>
                  {/* Celda Items Afectados */}
                  <td
                    data-label="Items Afectados"
                    className="hidden md:table-cell py-2 px-4 md:py-4 md:px-6 text-center font-mono"
                  >
                    {evento.items_afectados}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && pagination?.totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
}
