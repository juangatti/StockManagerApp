import { useState, useEffect, useCallback } from "react";
import api from "../api/api";
import { useDebounce } from "./useDebounce"; // Reutilizamos el hook debounce

export function usePrebatchList(itemsPerPage = 15) {
  const [data, setData] = useState({ prebatches: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0); // Para forzar recarga

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchPrebatches = useCallback(
    async (page, search) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/prebatches", {
          params: {
            page,
            limit: itemsPerPage,
            search,
          },
        });
        setData(response.data);
      } catch (err) {
        console.error("Error al obtener prebatches:", err);
        setError("No se pudieron cargar los lotes.");
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage]
  );

  useEffect(() => {
    const pageToFetch = searchQuery !== debouncedSearch ? 1 : currentPage;
    if (searchQuery !== debouncedSearch) {
      setCurrentPage(1); // Reset page on new search
    }
    fetchPrebatches(pageToFetch, debouncedSearch);
  }, [debouncedSearch, currentPage, fetchPrebatches, searchQuery, refreshKey]); // Añadimos refreshKey

  // Función para llamar externamente y forzar una recarga
  const refreshList = useCallback(() => {
    setRefreshKey((oldKey) => oldKey + 1);
  }, []);

  return {
    ...data,
    loading,
    error,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    refreshList, // Exponemos la función de refresco
  };
}
