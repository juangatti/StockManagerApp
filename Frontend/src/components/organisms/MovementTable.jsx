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
        return "bg-green-100 text-green-700 border-green-200";
      case "VENTA":
        return "bg-red-100 text-red-700 border-red-200";
      case "AJUSTE":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "PRODUCCION":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "CONSUMO_PRODUCCION":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-text-muted border-gray-200";
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
    <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-100">
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Buscar por descripción del evento..."
      />

      {error && <Alert message={error} />}
      {loading && eventos.length === 0 && <Spinner />}

      <div className="overflow-x-auto relative">
        {loading && eventos.length > 0 && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
            <Spinner />
          </div>
        )}
        <table className="w-full min-w-[600px] text-sm text-left text-text-secondary">
          <thead className="text-xs uppercase bg-gray-50 text-text-muted hidden md:table-header-group border-b border-gray-100 font-display tracking-wider font-bold">
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
                <td
                  colSpan={4}
                  className="text-center py-12 text-text-muted font-medium italic"
                >
                  {searchQuery
                    ? "No se encontraron eventos."
                    : "No hay eventos para mostrar."}
                </td>
              </tr>
            ) : (
              eventos.map((evento) => (
                <tr
                  key={evento.evento_id}
                  className="block md:table-row border-b border-gray-50 mb-4 md:mb-0 bg-gray-50 md:bg-transparent rounded-lg md:rounded-none overflow-hidden md:overflow-visible shadow-sm md:shadow-none cursor-pointer hover:bg-gray-100/50 transition-colors"
                  onClick={() => handleViewDetails(evento.evento_id)}
                >
                  {/* Celda Fecha */}
                  <td
                    data-label="Fecha"
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 text-text-muted md:whitespace-nowrap border-b md:border-b-0 border-gray-100 font-medium"
                  >
                    <span className="md:hidden font-bold text-text-secondary mr-2 uppercase text-xs">
                      Fecha:{" "}
                    </span>
                    {formatFecha(evento.fecha_evento)}
                  </td>
                  {/* Celda Tipo */}
                  <td
                    data-label="Tipo"
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 border-b md:border-b-0 border-gray-100 md:whitespace-nowrap"
                  >
                    <span className="md:hidden font-bold text-text-secondary mr-2 uppercase text-xs">
                      Tipo:{" "}
                    </span>
                    {/* 4. Usar getIconForType y getTypeClass */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getTypeClass(
                        evento.tipo_evento,
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
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 font-bold text-text-primary border-b md:border-b-0 border-gray-100 md:truncate font-display uppercase tracking-tight"
                    title={evento.evento_descripcion}
                  >
                    <span className="md:hidden font-bold text-text-secondary mr-2 uppercase text-xs">
                      Descripción:{" "}
                    </span>
                    {evento.evento_descripcion}
                  </td>
                  {/* Celda Items Afectados */}
                  <td
                    data-label="Items Afectados"
                    className="hidden md:table-cell py-2 px-4 md:py-4 md:px-6 text-center font-mono font-bold text-text-primary"
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
