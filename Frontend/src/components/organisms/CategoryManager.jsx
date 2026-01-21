// src/components/organisms/CategoryManager.jsx
import React, { useState, useEffect, useCallback, useRef } from "react"; // <-- MOVIDO AL PRINCIPIO Y COMBINADO
import api from "../../api/api";
import toast from "react-hot-toast";
import { FolderPlus, Edit, Trash2, RotateCcw, Eye, EyeOff } from "lucide-react";
import CategoryForm from "./CategoryForm";
import SearchBar from "../molecules/SearchBar";
import PaginationControls from "../molecules/PaginationControls";
import Spinner from "../atoms/Spinner";
import Alert from "../atoms/Alert";
import { useDebounce } from "../../hooks/useDebounce";

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingInactive, setViewingInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationData, setPaginationData] = useState({});
  const debouncedSearch = useDebounce(searchQuery, 300);
  const previousViewingInactive = useRef(viewingInactive); // useRef necesita React

  const fetchCategories = useCallback(async (page, search, inactiveMode) => {
    setLoading(true);
    setError(null);
    const endpoint = inactiveMode
      ? "/admin/categories/inactive"
      : "/admin/categories";
    try {
      const response = await api.get(endpoint, {
        params: { page, limit: 15, search },
      });
      setCategories(response.data.categories);
      setPaginationData(response.data.pagination);
    } catch (err) {
      toast.error(
        `No se pudieron cargar las categorías ${
          inactiveMode ? "desactivadas" : "activas"
        }.`,
      );
      setError(
        `Error al cargar categorías: ${err.message || "Error desconocido"}`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isSearchChanged = searchQuery !== debouncedSearch;
    const isModeChanged = viewingInactive !== previousViewingInactive.current;

    const pageToFetch = isSearchChanged || isModeChanged ? 1 : currentPage;

    if (pageToFetch === 1 && currentPage !== 1) {
      setCurrentPage(1); // Actualiza si reseteamos, el efecto se re-ejecutará con la página 1
    } else {
      // Solo llama a fetch si la página es la correcta o si no hubo reseteo
      fetchCategories(pageToFetch, debouncedSearch, viewingInactive);
    }

    // Siempre actualizamos la ref al final
    previousViewingInactive.current = viewingInactive;
  }, [
    viewingInactive,
    currentPage,
    debouncedSearch,
    fetchCategories,
    searchQuery,
  ]);

  const refreshCurrentView = useCallback(() => {
    // Usamos currentPage y debouncedSearch del estado actual al refrescar
    fetchCategories(currentPage, debouncedSearch, viewingInactive);
  }, [currentPage, debouncedSearch, viewingInactive, fetchCategories]); // Dependencias para useCallback

  const handleDelete = (categoryId, categoryName) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres desactivar la categoría "${categoryName}"?`,
      )
    ) {
      const promise = api.delete(`/admin/categories/${categoryId}`);
      toast.promise(promise, {
        loading: "Desactivando...",
        success: () => {
          refreshCurrentView();
          return "Categoría desactivada.";
        },
        error: "No se pudo desactivar.",
      });
    }
  };

  const handleRestore = (categoryId, categoryName) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres restaurar la categoría "${categoryName}"?`,
      )
    ) {
      const promise = api.put(`/admin/categories/${categoryId}/restore`);
      toast.promise(promise, {
        loading: "Restaurando...",
        success: () => {
          refreshCurrentView();
          return "Categoría restaurada.";
        },
        error: "No se pudo restaurar.",
      });
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingCategory(null);
    // Forzamos ir a la página 1 después de crear/editar por si el nuevo/editado
    // elemento cambia el orden o pertenece a otra página con los filtros actuales.
    // También es más simple que intentar calcular la página correcta.
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      // Si ya estábamos en la página 1, solo refrescamos.
      refreshCurrentView();
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };
  const handleCreate = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <CategoryForm
        categoryToEdit={editingCategory}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-text-primary font-display uppercase tracking-wide">
          {viewingInactive ? "Categorías Desactivadas" : "Gestionar Categorías"}
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewingInactive(!viewingInactive)}
            title={viewingInactive ? "Ver activas" : "Ver desactivadas"}
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
              <FolderPlus className="mr-2 h-5 w-5" /> Crear Nueva
            </button>
          )}
        </div>
      </div>

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Buscar por nombre de categoría..."
      />

      {error && <Alert message={error} />}
      {loading && categories.length === 0 && <Spinner />}

      <div className="min-h-[300px] relative mt-6">
        {loading && categories.length > 0 && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
            <Spinner />
          </div>
        )}
        {!loading && categories.length === 0 ? (
          <p className="text-center text-text-muted py-12 italic font-medium">
            {searchQuery
              ? "No se encontraron categorías."
              : "No hay categorías para mostrar."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-50 border border-gray-100 rounded-lg overflow-hidden shadow-sm">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="px-5 py-4 flex justify-between items-center bg-white hover:bg-gray-50/50 transition-colors"
              >
                <span className="text-text-primary font-bold font-display uppercase tracking-tight">
                  {cat.nombre}
                </span>
                <div className="flex items-center gap-2">
                  {viewingInactive ? (
                    <button
                      onClick={() => handleRestore(cat.id, cat.nombre)}
                      title="Restaurar"
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <RotateCcw className="h-5 w-5 text-green-600" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(cat)}
                        title="Editar"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Edit className="h-5 w-5 text-primary" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.nombre)}
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
