import { useState, useEffect } from "react"; // 1. Importar useState
import api from "../../api/api"; //
import StatCard from "../atoms/StatCard"; //
import Spinner from "../atoms/Spinner"; //
import PaginationControls from "../molecules/PaginationControls"; // 2. Importar PaginationControls

const ITEMS_PER_PAGE = 8; // 3. Definir items por página

export default function PrebatchesResume() {
  const [totales, setTotales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // 4. Estado para página actual

  useEffect(() => {
    setLoading(true); // Asegurarse de mostrar carga al inicio
    api
      .get("/prebatches/totals") //
      .then((response) => {
        setTotales(response.data);
        setCurrentPage(1); // Resetear a página 1 si los datos cambian
      })
      .catch((error) => {
        console.error("Error fetching prebatch totals:", error);
        // Aquí podrías añadir manejo de error, como mostrar un mensaje
      })
      .finally(() => setLoading(false));
  }, []); // Cargar solo al montar

  if (loading) return <Spinner />; //
  if (totales.length === 0)
    return (
      <p className="text-center text-slate-500 py-4">
        No hay totales de prebatches para mostrar.
      </p>
    ); // Mensaje si no hay datos

  // 5. Calcular paginación
  const totalPages = Math.ceil(totales.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTotals = totales.slice(startIndex, endIndex);

  return (
    // 6. Envolver en div
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        {" "}
        {/* Ajustar mb */}
        {/* 7. Mapear sobre 'currentTotals' */}
        {currentTotals.map((item) => (
          <StatCard
            key={item.nombre_prebatch}
            label={item.nombre_prebatch}
            value={item.total_litros.toFixed(2)}
            unit="Lts"
          /> //
        ))}
      </div>
      {/* 8. Añadir controles de paginación */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        /> //
      )}
    </div>
  );
}
