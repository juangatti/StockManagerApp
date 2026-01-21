// src/components/organisms/ItemManager.jsx
import React, { useState, useEffect, useCallback, useRef } from "react"; // 1. Hooks y React
import api from "../../api/api";
import toast from "react-hot-toast";
import {
  PackagePlus,
  Edit,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
// Ya NO importamos useStockStore aquí
import ItemForm from "./ItemForm";
import SearchBar from "../molecules/SearchBar"; // 2. Importar
import PaginationControls from "../molecules/PaginationControls"; // 3. Importar
import Spinner from "../atoms/Spinner"; // 4. Importar
import Alert from "../atoms/Alert"; // 5. Importar
import { useDebounce } from "../../hooks/useDebounce"; // 6. Importar

export default function ItemManager() {
  const [items, setItems] = useState([]); // Estado local para items
  // const [inactiveItems, setInactiveItems] = useState([]); // Cambiamos esto
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingInactive, setViewingInactive] = useState(false);

  // 7. Nuevos estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationData, setPaginationData] = useState({});

  // 8. Debounce
  const debouncedSearch = useDebounce(searchQuery, 300);
  const previousViewingInactive = useRef(viewingInactive);

  // 9. fetchItems (reemplaza fetchInactiveItems y la dependencia del store)
  const fetchItems = useCallback(async (page, search, inactiveMode) => {
    setLoading(true);
    setError(null);
    // Usamos las nuevas rutas del adminController
    const endpoint = inactiveMode
      ? "/admin/stock-items/inactive"
      : "/admin/stock-items";
    try {
      const response = await api.get(endpoint, {
        params: { page, limit: 15, search },
      });
      setItems(response.data.items); // La API devuelve 'items'
      setPaginationData(response.data.pagination);
    } catch (err) {
      toast.error(
        `No se pudieron cargar los items ${
          inactiveMode ? "desactivados" : "activos"
        }.`,
      );
      setError(`Error al cargar items: ${err.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // 10. useEffect actualizado
  useEffect(() => {
    const isSearchChanged = searchQuery !== debouncedSearch;
    const isModeChanged = viewingInactive !== previousViewingInactive.current;
    const pageToFetch = isSearchChanged || isModeChanged ? 1 : currentPage;

    if (pageToFetch === 1 && currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchItems(pageToFetch, debouncedSearch, viewingInactive);
    }
    previousViewingInactive.current = viewingInactive;
  }, [viewingInactive, currentPage, debouncedSearch, fetchItems, searchQuery]);

  // 11. Refresco y actualización de handlers
  const refreshCurrentView = useCallback(() => {
    fetchItems(currentPage, debouncedSearch, viewingInactive);
  }, [currentPage, debouncedSearch, viewingInactive, fetchItems]);

  const handleDelete = (itemId, itemName) => {
    if (window.confirm(`¿Estás seguro de desactivar "${itemName}"?`)) {
      const promise = api.delete(`/admin/stock-items/${itemId}`);
      toast.promise(promise, {
        loading: "Desactivando...",
        success: () => {
          refreshCurrentView(); // Refrescar
          return "Item desactivado.";
        },
        error: "No se pudo desactivar.",
      });
    }
  };

  const handleRestore = (itemId, itemName) => {
    if (window.confirm(`¿Seguro que quieres restaurar "${itemName}"?`)) {
      const promise = api.put(`/admin/stock-items/${itemId}/restore`);
      toast.promise(promise, {
        loading: "Restaurando...",
        success: () => {
          refreshCurrentView(); // Refrescar
          return "Item restaurado.";
        },
        error: "No se pudo restaurar.",
      });
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingItem(null);
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      refreshCurrentView();
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };
  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <ItemForm
        itemToEdit={editingItem}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  // const itemsToList = viewingInactive ? inactiveItems : stockItems; // Ya no necesitamos esto

  return (
    <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-100">
      {" "}
      {/* Padding ajustado */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-text-primary font-display uppercase tracking-wide">
          {viewingInactive ? "Items Desactivados" : "Gestionar Items (Envases)"}
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewingInactive(!viewingInactive)}
            title={viewingInactive ? "Ver activos" : "Ver desactivados"}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {viewingInactive ? (
              <Eye className="h-5 w-5" />
            ) : (
              <EyeOff className="h-5 w-5" />
            )}
          </button>
          {!viewingInactive && (
            <button
              onClick={handleCreate}
              className="flex items-center justify-center text-white bg-primary hover:bg-primary-dark font-bold rounded-lg text-sm px-6 py-2.5 text-center shadow-lg shadow-red-500/10 uppercase tracking-widest transition-all"
            >
              <PackagePlus className="mr-2 h-5 w-5" /> Crear Nuevo
            </button>
          )}
        </div>
      </div>
      {/* 12. SearchBar */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Buscar por marca o categoría..."
      />
      {error && <Alert message={error} />}
      {loading && items.length === 0 && <Spinner />}
      {/* 13. Lista */}
      <div className="min-h-[300px] relative mt-6">
        {loading && items.length > 0 && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
            <Spinner />
          </div>
        )}
        {!loading && items.length === 0 ? (
          <p className="text-center text-text-muted py-12 italic font-medium">
            {searchQuery
              ? "No se encontraron items."
              : "No hay items para mostrar."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-50 border border-gray-100 rounded-lg overflow-hidden shadow-sm">
            {/* Usamos el estado local 'items' */}
            {items.map((item) => (
              <li
                key={item.id}
                className="px-5 py-4 flex justify-between items-center bg-white hover:bg-gray-50/50 transition-colors"
              >
                <div>
                  <span className="text-text-primary font-bold font-display uppercase tracking-tight">
                    {item.nombre_completo}
                  </span>
                  {/* Mostramos categoría siempre (útil para inactivos también) */}
                  <span className="text-xs text-text-muted ml-3 bg-gray-100 px-2.5 py-1 rounded-full font-bold border border-gray-200 uppercase tracking-tighter">
                    {item.nombre_categoria}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {viewingInactive ? (
                    <button
                      onClick={() =>
                        handleRestore(item.id, item.nombre_completo)
                      }
                      title="Restaurar"
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <RotateCcw className="h-5 w-5 text-green-600" />
                    </button>
                  ) : (
                    <>
                      <button
                        // Pasamos el item completo, que ahora incluye prioridad y alerta
                        onClick={() => handleEdit(item)}
                        title="Editar"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Edit className="h-5 w-5 text-primary" />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(item.id, item.nombre_completo)
                        }
                        title="Desactivar"
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-5 w-5 text-gray-400 hover:text-primary transition-colors" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* 14. PaginationControls */}
      {!loading && paginationData?.totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={paginationData.totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
}
