import { useEffect, useState } from "react";
import useStockStore from "../stores/useStockStore";
import InventoryTable from "../components/organisms/InventoryTable";
import InventoryResume from "../components/organisms/InventoryResume";
import Spinner from "../components/atoms/Spinner";
import ViewSwitcher from "../components/molecules/ViewSwitcher";
import SearchBar from "../components/molecules/SearchBar";
import PaginationControls from "../components/molecules/PaginationControls";
import Alert from "../components/atoms/Alert"; // <-- Asegúrate de importar Alert
import { useDebounce } from "../hooks/useDebounce"; // <-- 1. Importar useDebounce

export default function InventoryPage() {
  const {
    fetchAllStockData,
    fetchStock, // <-- 2. Necesitamos fetchStock individualmente ahora
    loadingItems,
    loadingTotals,
    stockSearchQuery,
    setStockSearchQuery,
    stockCurrentPage,
    setStockCurrentPage,
    stockPagination,
    error,
  } = useStockStore();

  const [activeView, setActiveView] = useState("resumen");

  // 3. Aplicar debounce AL TÉRMINO DE BÚSQUEDA DEL STORE aquí en el componente
  const debouncedSearchQuery = useDebounce(stockSearchQuery, 300);

  // Carga inicial (solo se ejecuta una vez al montar)
  useEffect(() => {
    fetchAllStockData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencia vacía para carga inicial

  // 4. Efecto para RECARGAR los items cuando CAMBIA la página O el TÉRMINO DEBUSCADO
  useEffect(() => {
    // No llamamos a fetchAllStockData aquí, solo a fetchStock
    // Pasamos el término debounced a fetchStock
    fetchStock(debouncedSearchQuery);
  }, [stockCurrentPage, debouncedSearchQuery, fetchStock]); // Depende de la página y el término debounced

  const initialLoading = loadingItems && loadingTotals;

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Inventario General</h2>
      <ViewSwitcher activeView={activeView} onViewChange={setActiveView} />

      {activeView === "resumen" && (
        <>
          {loadingTotals && <Spinner />}
          {!loadingTotals && <InventoryResume />}
          {/* Mostramos error si ocurre al cargar totales */}
          {!loadingTotals && error && (
            <div className="mt-4">
              <Alert message={error} />
            </div>
          )}
        </>
      )}

      {activeView === "detalle" && (
        <div className="space-y-4">
          <SearchBar
            searchQuery={stockSearchQuery}
            setSearchQuery={setStockSearchQuery}
            placeholder="Buscar por nombre o categoría..."
          />
          {initialLoading ? ( // Spinner solo en carga inicial completa
            <Spinner />
          ) : (
            <>
              {/* Pasamos loadingItems a InventoryTable como antes */}
              <InventoryTable loading={loadingItems} />
              {/* Mostramos error si ocurre al cargar items */}
              {error && !loadingItems && <Alert message={error} />}

              {/* Controles de paginación */}
              {!loadingItems && stockPagination?.totalPages > 1 && (
                <PaginationControls
                  currentPage={stockCurrentPage}
                  totalPages={stockPagination.totalPages}
                  setCurrentPage={setStockCurrentPage}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
