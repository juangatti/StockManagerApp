// src/components/organisms/InventoryResume.jsx
import { useState } from "react"; // 1. Importar useState
import StatCard from "../atoms/StatCard"; //
import useStockStore from "../../stores/useStockStore"; //
import PaginationControls from "../molecules/PaginationControls"; // 2. Importar PaginationControls

const ITEMS_PER_PAGE = 24; // 3. Definir cuántos cards mostrar por página

export default function InventoryResume() {
  const { stockTotals, loading } = useStockStore(); //
  const [currentPage, setCurrentPage] = useState(1); // 4. Estado para la página actual

  if (loading) return null; // Mantenemos la lógica de carga

  // 5. Calcular paginación
  const totalPages = Math.ceil(stockTotals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTotals = stockTotals.slice(startIndex, endIndex); // Obtener solo los items para la página actual

  return (
    // 6. Envolver en un div para añadir controles debajo
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        {" "}
        {/* Ajustar mb */}
        {/* 7. Mapear sobre 'currentTotals' en lugar de 'stockTotals' */}
        {currentTotals.map((item) => (
          <StatCard
            key={item.display_nombre}
            label={item.display_nombre}
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
