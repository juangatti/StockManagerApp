// src/components/organisms/MarcaManager.jsx
import React, { useState, useEffect, useCallback, useRef } from "react"; // 1. Importar hooks necesarios y React
import api from "../../api/api";
import toast from "react-hot-toast";
import { BookPlus, Edit, Trash2, RotateCcw, Eye, EyeOff } from "lucide-react";
import MarcaForm from "./MarcaForm";
import SearchBar from "../molecules/SearchBar"; // 2. Importar SearchBar
import PaginationControls from "../molecules/PaginationControls"; // 3. Importar PaginationControls
import Spinner from "../atoms/Spinner"; // 4. Importar Spinner
import Alert from "../atoms/Alert"; // 5. Importar Alert
import { useDebounce } from "../../hooks/useDebounce"; // 6. Importar useDebounce

export default function MarcaManager() {
  const [marcas, setMarcas] = useState([]);
  const [editingMarca, setEditingMarca] = useState(null);
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

  // 9. fetchMarcas actualizado
  const fetchMarcas = useCallback(async (page, search, inactiveMode) => {
    setLoading(true);
    setError(null);
    const endpoint = inactiveMode ? "/admin/marcas/inactive" : "/admin/marcas";
    try {
      const response = await api.get(endpoint, {
        params: { page, limit: 15, search },
      });
      setMarcas(response.data.marcas); // Ajustar al nombre devuelto por la API
      setPaginationData(response.data.pagination);
    } catch (err) {
      toast.error(
        `No se pudieron cargar las marcas ${
          inactiveMode ? "desactivadas" : "activas"
        }.`,
      );
      setError(`Error al cargar marcas: ${err.message || "Error desconocido"}`);
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
      fetchMarcas(pageToFetch, debouncedSearch, viewingInactive);
    }

    previousViewingInactive.current = viewingInactive;
  }, [viewingInactive, currentPage, debouncedSearch, fetchMarcas, searchQuery]);

  // 11. Función de refresco y actualización de handlers
  const refreshCurrentView = useCallback(() => {
    fetchMarcas(currentPage, debouncedSearch, viewingInactive);
  }, [currentPage, debouncedSearch, viewingInactive, fetchMarcas]);

  const handleDelete = (marcaId, marcaName) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres desactivar la marca "${marcaName}"?`,
      )
    ) {
      const promise = api.delete(`/admin/marcas/${marcaId}`);
      toast.promise(promise, {
        loading: "Desactivando...",
        success: () => {
          refreshCurrentView(); // Refrescar
          return "Marca desactivada.";
        },
        error: (err) => err.response?.data?.message || "No se pudo desactivar.",
      });
    }
  };

  const handleRestore = (marcaId, marcaName) => {
    if (
      window.confirm(`¿Seguro que quieres restaurar la marca "${marcaName}"?`)
    ) {
      const promise = api.put(`/admin/marcas/${marcaId}/restore`);
      toast.promise(promise, {
        loading: "Restaurando...",
        success: () => {
          refreshCurrentView(); // Refrescar
          return "Marca restaurada.";
        },
        error: "No se pudo restaurar.",
      });
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingMarca(null);
    if (currentPage !== 1) {
      setCurrentPage(1); // Ir a página 1 después de crear/editar
    } else {
      refreshCurrentView(); // Si ya está en pág 1, solo refrescar
    }
  };

  const handleEdit = (marca) => {
    setEditingMarca(marca);
    setShowForm(true);
  };
  const handleCreate = () => {
    setEditingMarca(null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <MarcaForm
        marcaToEdit={editingMarca}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-100">
      {" "}
      {/* Padding ajustado */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-text-primary font-display uppercase tracking-wide">
          {viewingInactive ? "Marcas Desactivadas" : "Gestionar Marcas"}
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
              <BookPlus className="mr-2 h-5 w-5" /> Crear Nueva
            </button>
          )}
        </div>
      </div>
      {/* 12. SearchBar */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Buscar por nombre de marca..."
      />
      {error && <Alert message={error} />}
      {loading && marcas.length === 0 && <Spinner />}
      {/* 13. Lista */}
      <div className="min-h-[300px] relative mt-6">
        {loading && marcas.length > 0 && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
            <Spinner />
          </div>
        )}
        {!loading && marcas.length === 0 ? (
          <p className="text-center text-text-muted py-12 italic font-medium">
            {searchQuery
              ? "No se encontraron marcas."
              : "No hay marcas para mostrar."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-50 border border-gray-100 rounded-lg overflow-hidden shadow-sm">
            {marcas.map((marca) => (
              <li
                key={marca.id}
                className="px-5 py-4 flex justify-between items-center bg-white hover:bg-gray-50/50 transition-colors"
              >
                <div>
                  <span className="text-text-primary font-bold font-display uppercase tracking-tight">
                    {marca.nombre}
                  </span>
                  {/* Mostramos categoría solo si estamos en vista activa */}
                  {!viewingInactive && marca.categoria_nombre && (
                    <span className="text-xs text-text-muted ml-3 bg-gray-100 px-2.5 py-1 rounded-full font-bold border border-gray-200 uppercase tracking-tighter">
                      {marca.categoria_nombre}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {viewingInactive ? (
                    <button
                      onClick={() => handleRestore(marca.id, marca.nombre)}
                      title="Restaurar"
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <RotateCcw className="h-5 w-5 text-green-600" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(marca)}
                        title="Editar"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Edit className="h-5 w-5 text-primary" />
                      </button>
                      <button
                        onClick={() => handleDelete(marca.id, marca.nombre)}
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
