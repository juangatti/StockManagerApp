// src/components/organisms/RecipeManager.jsx
import React, { useState, useEffect, useCallback, useRef } from "react"; // 1. Hooks y React
import api from "../../api/api";
import toast from "react-hot-toast";
import {
  ClipboardPlus,
  Edit,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import RecipeForm from "./RecipeForm";
import SearchBar from "../molecules/SearchBar"; // 2. Importar
import PaginationControls from "../molecules/PaginationControls"; // 3. Importar
import Spinner from "../atoms/Spinner"; // 4. Importar
import Alert from "../atoms/Alert"; // 5. Importar
import { useDebounce } from "../../hooks/useDebounce"; // 6. Importar

export default function RecipeManager() {
  const [products, setProducts] = useState([]); // El estado se mantiene igual
  const [editingRecipe, setEditingRecipe] = useState(null);
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

  // 9. fetchProducts actualizado
  const fetchProducts = useCallback(async (page, search, inactiveMode) => {
    setLoading(true);
    setError(null);
    const endpoint = inactiveMode
      ? "/admin/products/inactive"
      : "/admin/products";
    try {
      const response = await api.get(endpoint, {
        params: { page, limit: 15, search },
      });
      setProducts(response.data.products); // La API devuelve 'products'
      setPaginationData(response.data.pagination);
    } catch (err) {
      toast.error(
        `No se pudieron cargar los productos ${
          inactiveMode ? "desactivados" : "activos"
        }.`
      );
      setError(
        `Error al cargar productos: ${err.message || "Error desconocido"}`
      );
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
      fetchProducts(pageToFetch, debouncedSearch, viewingInactive);
    }
    previousViewingInactive.current = viewingInactive;
  }, [
    viewingInactive,
    currentPage,
    debouncedSearch,
    fetchProducts,
    searchQuery,
  ]);

  // 11. Refresco y actualización de handlers
  const refreshCurrentView = useCallback(() => {
    fetchProducts(currentPage, debouncedSearch, viewingInactive);
  }, [currentPage, debouncedSearch, viewingInactive, fetchProducts]);

  const handleDelete = (productId, productName) => {
    if (window.confirm(`¿Estás seguro de desactivar "${productName}"?`)) {
      const promise = api.delete(`/admin/products/${productId}`);
      toast.promise(promise, {
        loading: "Desactivando...",
        success: () => {
          refreshCurrentView(); // Refrescar
          return "Producto desactivado.";
        },
        error: (err) => err.response?.data?.message || "No se pudo desactivar.",
      });
    }
  };

  const handleRestore = (productId, productName) => {
    if (window.confirm(`¿Seguro que quieres restaurar "${productName}"?`)) {
      const promise = api.put(`/admin/products/${productId}/restore`);
      toast.promise(promise, {
        loading: "Restaurando...",
        success: () => {
          refreshCurrentView(); // Refrescar
          return "Producto restaurado.";
        },
        error: "No se pudo restaurar.",
      });
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingRecipe(null);
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      refreshCurrentView();
    }
  };

  // handleEdit necesita obtener los detalles de la receta antes de mostrar el form
  const handleEdit = (product) => {
    // Mostramos un loading temporal mientras se carga la receta completa
    const loadingToast = toast.loading("Cargando receta para editar...");
    api
      .get(`/admin/recipes/${product.id}`) // Endpoint que devuelve producto + reglas
      .then((res) => {
        toast.dismiss(loadingToast); // Ocultar loading
        setEditingRecipe(res.data); // Guardamos producto + reglas
        setShowForm(true);
      })
      .catch(() => {
        toast.dismiss(loadingToast);
        toast.error("No se pudo cargar la receta para editar.");
      });
  };

  const handleCreate = () => {
    setEditingRecipe(null); // Aseguramos que no haya datos previos
    setShowForm(true);
  };

  if (showForm) {
    return (
      <RecipeForm
        recipeToEdit={editingRecipe}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
      {" "}
      {/* Padding ajustado */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          {viewingInactive ? "Recetas Desactivadas" : "Gestionar Recetas"}
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewingInactive(!viewingInactive)}
            title={viewingInactive ? "Ver activas" : "Ver desactivadas"}
            className="flex items-center gap-2 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700"
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
              className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              <ClipboardPlus className="mr-2 h-5 w-5" /> Crear Nueva Receta
            </button>
          )}
        </div>
      </div>
      {/* 12. SearchBar */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Buscar por nombre de producto..."
      />
      {error && <Alert message={error} />}
      {loading && products.length === 0 && <Spinner />}
      {/* 13. Lista */}
      <div className="min-h-75 relative">
        {loading && products.length > 0 && (
          <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center z-10">
            <Spinner />
          </div>
        )}
        {!loading && products.length === 0 ? (
          <p className="text-center text-slate-500 py-10">
            {searchQuery
              ? "No se encontraron productos."
              : "No hay productos para mostrar."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-700">
            {/* Usamos el estado local 'products' */}
            {products.map((prod) => (
              <li
                key={prod.id}
                className="py-3 flex justify-between items-center"
              >
                <span className="text-white">{prod.nombre_producto_fudo}</span>
                <div className="flex items-center gap-2">
                  {viewingInactive ? (
                    <button
                      onClick={() =>
                        handleRestore(prod.id, prod.nombre_producto_fudo)
                      }
                      title="Restaurar"
                      className="p-2 rounded-md hover:bg-slate-700"
                    >
                      <RotateCcw className="h-5 w-5 text-green-400" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(prod)}
                        title="Editar"
                        className="p-2 rounded-md hover:bg-slate-700"
                      >
                        <Edit className="h-5 w-5 text-sky-400" />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(prod.id, prod.nombre_producto_fudo)
                        }
                        title="Desactivar"
                        className="p-2 rounded-md hover:bg-slate-700"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
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
