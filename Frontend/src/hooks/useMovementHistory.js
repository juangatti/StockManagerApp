import { useState, useEffect, useCallback } from "react";
import api from "../api/api";
import { useDebounce } from "./useDebounce"; // <-- 1. IMPORTAR EL HOOK

// --- Hook de Debounce ---
// (EL CÓDIGO DEL HOOK DEBOUNCE SE ELIMINA DE AQUÍ)
// --- Fin del hook de Debounce ---

export function useMovementHistory(itemsPerPage = 20) {
  const [data, setData] = useState({ eventos: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Usamos el debounce importado
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchEventos = useCallback(
    async (page, search) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/stock/historic-movement", {
          params: {
            page,
            limit: itemsPerPage,
            search,
          },
        });
        setData(response.data);
      } catch (err) {
        console.error("Error al obtener eventos:", err);
        setError("No se pudieron cargar los movimientos.");
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage]
  );

  // (El resto del hook no cambia)
  useEffect(() => {
    const pageToFetch = searchQuery !== debouncedSearch ? 1 : currentPage;
    if (searchQuery !== debouncedSearch) {
      setCurrentPage(1);
    }
    fetchEventos(pageToFetch, debouncedSearch);
  }, [debouncedSearch, currentPage, fetchEventos, searchQuery]);

  return {
    ...data,
    loading,
    error,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
  };
}
