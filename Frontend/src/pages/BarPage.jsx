// src/pages/BarraPage.jsx
import { useState, useEffect } from "react";
import useStockStore from "../stores/useStockStore"; //
import { usePrebatchList } from "../hooks/usePrebatchList"; //
import InventoryTable from "../components/organisms/InventoryTable"; //
import PrebatchesTable from "../components/organisms/PrebatchesTable"; //
import SearchBar from "../components/molecules/SearchBar"; //
import PaginationControls from "../components/molecules/PaginationControls"; //
import Spinner from "../components/atoms/Spinner"; //
import Alert from "../components/atoms/Alert"; //
import { useDebounce } from "../hooks/useDebounce"; //
import useAuthStore from "../stores/useAuthStore"; // Necesario para isAdmin en PrebatchesTable //

// Botones de Pestaña
const TabButton = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 focus:outline-none transition-colors duration-200 ${
      isActive
        ? "border-sky-500 text-sky-400"
        : "border-transparent text-slate-400 hover:text-white hover:border-slate-500"
    }`}
  >
    {children}
  </button>
);

export default function BarPage() {
  const [activeTab, setActiveTab] = useState("bebidas"); // 'bebidas' o 'prebatches'
  const { user } = useAuthStore(); //

  // --- Lógica de Inventario (Bebidas) ---
  const {
    fetchStock,
    stockItems,
    loadingItems: loadingInventory,
    stockSearchQuery,
    setStockSearchQuery,
    stockCurrentPage,
    setStockCurrentPage,
    stockPagination,
    error: inventoryError,
  } = useStockStore(); //
  const debouncedInventorySearch = useDebounce(stockSearchQuery, 300); //

  // Cargar/Recargar inventario
  useEffect(() => {
    if (activeTab === "bebidas") {
      fetchStock(debouncedInventorySearch);
    }
  }, [stockCurrentPage, debouncedInventorySearch, fetchStock, activeTab]);

  // --- Lógica de Prebatches ---
  const {
    prebatches,
    pagination: prebatchPagination,
    loading: loadingPrebatches,
    error: prebatchError,
    currentPage: prebatchCurrentPage,
    setCurrentPage: setPrebatchCurrentPage,
    searchQuery: prebatchSearchQuery,
    setSearchQuery: setPrebatchSearchQuery,
    refreshList: refreshPrebatches, // Necesario para editar/eliminar
  } = usePrebatchList(15); //
  // NOTA: El hook usePrebatchList se ejecutará siempre, pero solo mostraremos sus datos cuando activeTab === 'prebatches'

  // --- Handlers Prebatches (necesarios si se edita/elimina desde aquí) ---
  // TODO: Añadir lógica para mostrar PrebatchForm si se quiere editar desde aquí
  const handleEditPrebatch = (prebatch) => {
    console.warn(
      "Editar prebatch no implementado directamente en BarraPage aún",
      prebatch
    );
    // Aquí podrías implementar un modal o navegar a una ruta de edición
  };
  const handleDeletePrebatchSuccess = () => {
    refreshPrebatches(); // Refresca la lista en el hook
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Barra - Stock Actual</h2>

      {/* Pestañas */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <TabButton
            isActive={activeTab === "bebidas"}
            onClick={() => setActiveTab("bebidas")}
          >
            Bebidas (Inventario)
          </TabButton>
          <TabButton
            isActive={activeTab === "prebatches"}
            onClick={() => setActiveTab("prebatches")}
          >
            Prebatches
          </TabButton>
        </nav>
      </div>

      {/* Contenido Condicional */}
      <div>
        {activeTab === "bebidas" && (
          <div className="space-y-4">
            <SearchBar
              searchQuery={stockSearchQuery}
              setSearchQuery={setStockSearchQuery}
              placeholder="Buscar por nombre, variación o categoría..."
            />{" "}
            {/* */}
            {loadingInventory && stockItems.length === 0 ? ( // Mostrar spinner solo en carga inicial
              <Spinner /> //
            ) : inventoryError ? (
              <Alert message={inventoryError} /> //
            ) : (
              <>
                <InventoryTable loading={loadingInventory} /> {/* */}
                {!loadingInventory && stockPagination?.totalPages > 1 && (
                  <PaginationControls
                    currentPage={stockCurrentPage}
                    totalPages={stockPagination.totalPages}
                    setCurrentPage={setStockCurrentPage}
                  /> /* */
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "prebatches" && (
          <div className="space-y-4">
            <SearchBar
              searchQuery={prebatchSearchQuery}
              setSearchQuery={setPrebatchSearchQuery}
              placeholder="Buscar por nombre de prebatch..."
            />{" "}
            {/* */}
            {loadingPrebatches && prebatches.length === 0 ? ( // Spinner solo en carga inicial
              <Spinner /> //
            ) : prebatchError ? (
              <Alert message={prebatchError} /> //
            ) : (
              <div className="bg-slate-800 p-0 md:p-6 rounded-lg shadow-xl">
                {" "}
                {/* Añadido contenedor opcional */}
                <PrebatchesTable
                  prebatches={prebatches}
                  loading={loadingPrebatches}
                  isAdmin={user.role === "admin"}
                  onEdit={handleEditPrebatch} // Usar handler local
                  onDeleteSuccess={handleDeletePrebatchSuccess} // Usar handler local
                />{" "}
                {/* */}
                {!loadingPrebatches && prebatchPagination?.totalPages > 1 && (
                  <PaginationControls
                    currentPage={prebatchCurrentPage}
                    totalPages={prebatchPagination.totalPages}
                    setCurrentPage={setPrebatchCurrentPage}
                  /> /* */
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
