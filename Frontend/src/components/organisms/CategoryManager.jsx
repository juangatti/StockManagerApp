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
        }.`
      );
      setError(
        `Error al cargar categorías: ${err.message || "Error desconocido"}`
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
        `¿Estás seguro de que quieres desactivar la categoría "${categoryName}"?`
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
        `¿Estás seguro de que quieres restaurar la categoría "${categoryName}"?`
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
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          {viewingInactive ? "Categorías Desactivadas" : "Gestionar Categorías"}
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

      <div className="min-h-[300px] relative">
        {loading && categories.length > 0 && (
          <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center z-10">
            <Spinner />
          </div>
        )}
        {!loading && categories.length === 0 ? (
          <p className="text-center text-slate-500 py-10">
            {searchQuery
              ? "No se encontraron categorías."
              : "No hay categorías para mostrar."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-700">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="py-3 flex justify-between items-center"
              >
                <span className="text-white">{cat.nombre}</span>
                <div className="flex items-center gap-2">
                  {viewingInactive ? (
                    <button
                      onClick={() => handleRestore(cat.id, cat.nombre)}
                      title="Restaurar"
                      className="p-2 rounded-md hover:bg-slate-700"
                    >
                      <RotateCcw className="h-5 w-5 text-green-400" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(cat)}
                        title="Editar"
                        className="p-2 rounded-md hover:bg-slate-700"
                      >
                        <Edit className="h-5 w-5 text-sky-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.nombre)}
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
