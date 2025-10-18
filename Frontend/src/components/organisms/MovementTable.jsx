// src/components/organisms/MovementTable.jsx
import { useNavigate } from "react-router-dom";
import Spinner from "../atoms/Spinner";
import Alert from "../atoms/Alert";
import SearchBar from "../molecules/SearchBar"; // <-- 1. Importar SearchBar
import PaginationControls from "../molecules/PaginationControls"; // <-- 2. Importar PaginationControls
import { Eye } from "lucide-react";
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

  // (Las funciones formatFecha, getTypeClass y handleViewDetails no cambian)
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

  const handleViewDetails = (eventoId) => {
    navigate(`/historicMovements/${eventoId}`);
  };

  return (
    // Ajustamos el padding aquí en el contenedor principal del organismo
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
      {/* 3. Usar SearchBar */}
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
            {!loading && eventos.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-slate-500">
                  {searchQuery
                    ? "No se encontraron eventos."
                    : "No hay eventos para mostrar."}
                </td>
              </tr>
            ) : (
              eventos.map((evento) => (
                <tr
                  key={evento.evento_id}
                  className="border-b border-slate-700 hover:bg-slate-600/50 cursor-pointer"
                  onClick={() => handleViewDetails(evento.evento_id)}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(evento.evento_id);
                      }}
                      className="p-2 rounded-md hover:bg-slate-700"
                      title="Ver detalle"
                    >
                      <Eye className="h-5 w-5 text-sky-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Usar PaginationControls */}
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
