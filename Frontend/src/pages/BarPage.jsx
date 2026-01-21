// src/pages/BarPage.jsx
import { useState, useEffect } from "react";
import useStockStore from "../stores/useStockStore";
import { usePrebatchList } from "../hooks/usePrebatchList";
import InventoryTable from "../components/organisms/InventoryTable";
import PrebatchesTable from "../components/organisms/PrebatchesTable";
import SearchBar from "../components/molecules/SearchBar";
import PaginationControls from "../components/molecules/PaginationControls";
import Spinner from "../components/atoms/Spinner";
import Alert from "../components/atoms/Alert";
import { useDebounce } from "../hooks/useDebounce";
import useAuthStore from "../stores/useAuthStore";
// Importar PrebatchForm
import PrebatchForm from "../components/organisms/PrebatchForm";
// Quitar CookingPot si ya no se usa
// import { CookingPot } from "lucide-react";

// Botones de Pestaña (sin cambios)
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
  const [activeTab, setActiveTab] = useState("bebidas");
  const { user } = useAuthStore();

  // --- 1. Añadir Estado para el Formulario de Edición ---
  const [showPrebatchForm, setShowPrebatchForm] = useState(false);
  const [editingPrebatch, setEditingPrebatch] = useState(null); // Guarda el prebatch a editar

  // --- Lógica de Inventario (Bebidas - sin cambios) ---
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
  } = useStockStore();
  const debouncedInventorySearch = useDebounce(stockSearchQuery, 300);
  useEffect(() => {
    if (activeTab === "bebidas") {
      fetchStock(debouncedInventorySearch);
    }
  }, [stockCurrentPage, debouncedInventorySearch, fetchStock, activeTab]);

  // --- Lógica de Prebatches (sin cambios) ---
  const {
    prebatches,
    pagination: prebatchPagination,
    loading: loadingPrebatches,
    error: prebatchError,
    currentPage: prebatchCurrentPage,
    setCurrentPage: setPrebatchCurrentPage,
    searchQuery: prebatchSearchQuery,
    setSearchQuery: setPrebatchSearchQuery,
    refreshList: refreshPrebatches,
  } = usePrebatchList(15);

  // --- 2. Implementar Handlers para Edición ---
  const handleEditPrebatch = (prebatch) => {
    // console.warn("Editar prebatch NO implementado...", prebatch); // Ya no es placeholder
    setEditingPrebatch(prebatch); // Guarda el prebatch que se clickeó
    setShowPrebatchForm(true); // Muestra el formulario
  };

  // --- 3. Implementar Handlers para el Formulario ---
  const handlePrebatchFormSubmit = () => {
    setShowPrebatchForm(false); // Oculta el formulario
    setEditingPrebatch(null); // Limpia el estado de edición
    refreshPrebatches(); // Refresca la lista de prebatches
  };

  const handleCancelPrebatchForm = () => {
    setShowPrebatchForm(false); // Oculta el formulario
    setEditingPrebatch(null); // Limpia el estado de edición
  };

  // Handler para Delete (sin cambios)
  const handleDeletePrebatchSuccess = () => {
    refreshPrebatches();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[var(--color-text-primary)] font-display uppercase tracking-wide">
        Barra - Stock Actual
      </h2>

      {/* Pestañas (Añadir ocultar form al cambiar) */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <TabButton
            isActive={activeTab === "bebidas"}
            // Ocultar form si cambiamos a Bebidas
            onClick={() => {
              setShowPrebatchForm(false);
              setActiveTab("bebidas");
            }}
          >
            Bebidas (Inventario)
          </TabButton>
          <TabButton
            isActive={activeTab === "prebatches"}
            // Ocultar form si ya estábamos en Prebatches (para volver a la lista)
            onClick={() => {
              setShowPrebatchForm(false);
              setActiveTab("prebatches");
            }}
          >
            Prebatches
          </TabButton>
        </nav>
      </div>

      {/* Contenido Condicional */}
      <div>
        {activeTab === "bebidas" && (
          <div className="space-y-4">
            {/* ... Contenido Pestaña Bebidas (SearchBar, InventoryTable, Pagination) ... */}
            <SearchBar
              searchQuery={stockSearchQuery}
              setSearchQuery={setStockSearchQuery}
              placeholder="Buscar por nombre, variación o categoría..."
            />
            {loadingInventory && stockItems.length === 0 ? (
              <Spinner />
            ) : inventoryError ? (
              <Alert message={inventoryError} />
            ) : (
              <>
                <InventoryTable loading={loadingInventory} />
                {!loadingInventory && stockPagination?.totalPages > 1 && (
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

        {/* --- 4. Renderizado Condicional para Prebatches --- */}
        {activeTab === "prebatches" && (
          <>
            {showPrebatchForm ? (
              // Si estamos editando, mostrar el PrebatchForm
              <PrebatchForm
                prebatchToEdit={editingPrebatch} // Pasar el prebatch a editar
                onFormSubmit={handlePrebatchFormSubmit} // Handler para cuando se guarda
                onCancel={handleCancelPrebatchForm} // Handler para cancelar
              />
            ) : (
              // Si no, mostrar la lista de Prebatches
              <div className="space-y-4">
                {/* --- 5. Botón Crear ELIMINADO --- */}
                {/* Ya no hay botón para crear desde aquí */}

                <SearchBar
                  searchQuery={prebatchSearchQuery}
                  setSearchQuery={setPrebatchSearchQuery}
                  placeholder="Buscar por nombre de prebatch..."
                />
                {loadingPrebatches && prebatches.length === 0 ? (
                  <Spinner />
                ) : prebatchError ? (
                  <Alert message={prebatchError} />
                ) : (
                  <div className="bg-[var(--color-surface)] p-0 md:p-6 rounded-lg shadow-[var(--shadow-card)] border border-gray-100">
                    <PrebatchesTable
                      prebatches={prebatches}
                      loading={loadingPrebatches}
                      isAdmin={user.role === "admin"}
                      onEdit={handleEditPrebatch} // Pasar el handler correcto
                      onDeleteSuccess={handleDeletePrebatchSuccess}
                    />
                    {!loadingPrebatches &&
                      prebatchPagination?.totalPages > 1 && (
                        <PaginationControls
                          currentPage={prebatchCurrentPage}
                          totalPages={prebatchPagination.totalPages}
                          setCurrentPage={setPrebatchCurrentPage}
                        />
                      )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
