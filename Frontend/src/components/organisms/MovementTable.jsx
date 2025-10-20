// src/components/organisms/MovementTable.jsx
import { useNavigate } from "react-router-dom";
import Spinner from "../atoms/Spinner";
import Alert from "../atoms/Alert";
import SearchBar from "../molecules/SearchBar";
import PaginationControls from "../molecules/PaginationControls";
import { useMovementHistory } from "../../hooks/useMovementHistory";

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

  const handleViewDetails = (eventoId) => {
    navigate(`/historicMovements/${eventoId}`);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Buscar por descripción del evento..." // Mantenemos búsqueda por descripción
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
              {/* 1. Tipo ahora va segundo */}
              <th className="py-3 px-6 whitespace-nowrap">Tipo</th>
              {/* 2. Descripción ahora va tercero */}
              <th className="py-3 px-6 whitespace-nowrap">Descripción</th>
              <th className="py-3 px-6 text-center whitespace-nowrap hidden md:table-cell">
                Items Afectados
              </th>
              {/* Columna Acciones eliminada */}
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
                // TR como tarjeta en móvil, fila en escritorio
                <tr
                  key={evento.evento_id}
                  className="block md:table-row border-b border-slate-700 mb-2 md:mb-0 bg-slate-800/50 md:bg-transparent rounded-lg md:rounded-none overflow-hidden md:overflow-visible shadow-md md:shadow-none cursor-pointer hover:bg-slate-700/50 md:hover:bg-slate-600/50"
                  onClick={() => handleViewDetails(evento.evento_id)}
                >
                  {/* Celda Fecha (igual) */}
                  <td
                    data-label="Fecha"
                    className="block md:table-cell py-2 px-4 md:py-4 md:px-6 text-slate-400 md:whitespace-nowrap border-b md:border-b-0 border-slate-700"
                  >
                    <span className="md:hidden font-semibold text-slate-500 mr-2">
                      Fecha:{" "}
                    </span>
                    {formatFecha(evento.fecha_evento)}
                  </td>
                  {/* 3. Celda Tipo (ahora segunda) */}
                  <td
                    data-label="Tipo"
                    className="block md:table-cell py-2 px-4 md:py-4 md:px-6 border-b md:border-b-0 border-slate-700 md:whitespace-nowrap" // Añadido whitespace-nowrap
                  >
                    <span className="md:hidden font-semibold text-slate-500 mr-2">
                      Tipo:{" "}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeClass(
                        evento.tipo_evento
                      )}`}
                    >
                      {evento.tipo_evento}
                    </span>
                  </td>
                  {/* 4. Celda Descripción (ahora tercera) */}
                  <td
                    data-label="Descripción"
                    // Permitimos que se trunque si es muy larga en escritorio
                    className="block md:table-cell py-2 px-4 md:py-4 md:px-6 font-medium text-white border-b md:border-b-0 border-slate-700 md:truncate"
                    title={evento.evento_descripcion} // Tooltip con descripción completa
                  >
                    <span className="md:hidden font-semibold text-slate-500 mr-2">
                      Descripción:{" "}
                    </span>
                    {evento.evento_descripcion}
                  </td>
                  {/* Celda Items Afectados (oculta en móvil, igual) */}
                  <td
                    data-label="Items Afectados"
                    className="hidden md:table-cell py-2 px-4 md:py-4 md:px-6 text-center font-mono"
                  >
                    {evento.items_afectados}
                  </td>
                  {/* Celda Acciones eliminada */}
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
