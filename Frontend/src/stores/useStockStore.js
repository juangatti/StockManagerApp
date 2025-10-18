import { create } from "zustand";
import api from "../api/api";
// NO importamos useDebounce aquí

// ELIMINAMOS useDebouncedSearch

const useStockStore = create((set, get) => ({
  // --- ESTADO INICIAL --- (sin cambios)
  stockItems: [],
  stockTotals: [],
  stockPagination: {},
  stockCurrentPage: 1,
  stockSearchQuery: "", // Mantenemos el estado para el input
  loadingItems: true,
  loadingTotals: true,
  error: null,

  // --- ACCIONES ---

  // Setters sin cambios
  setStockCurrentPage: (page) => set({ stockCurrentPage: page }),
  setStockSearchQuery: (query) =>
    set({ stockSearchQuery: query, stockCurrentPage: 1 }),

  // MODIFICADO: fetchStock ahora recibe el término de búsqueda
  fetchStock: async (searchTerm = "") => {
    // Acepta el término como argumento
    const { stockCurrentPage } = get();
    // Ya NO usamos useDebouncedSearch aquí

    try {
      set({ loadingItems: true, error: null });
      const response = await api.get("/stock", {
        params: {
          page: stockCurrentPage,
          limit: 25,
          search: searchTerm, // Usamos el argumento recibido
        },
      });

      set({
        stockItems: response.data.items,
        stockPagination: response.data.pagination,
        loadingItems: false,
      });
    } catch (err) {
      console.error("Error al obtener items del stock:", err);
      set({
        error: "No se pudieron cargar los datos del inventario.",
        loadingItems: false,
      });
    }
  },

  // fetchStockTotals sin cambios
  fetchStockTotals: async () => {
    try {
      set({ loadingTotals: true });
      const totalsResponse = await api.get("/stock/totals");
      set({
        stockTotals: totalsResponse.data,
        loadingTotals: false,
      });
    } catch (err) {
      console.error("Error al obtener totales del stock:", err);
      set({
        error: "No se pudieron cargar los totales del inventario.",
        loadingTotals: false,
      });
    }
  },

  // MODIFICADO: fetchAllStockData ahora pasa el search query inicial
  fetchAllStockData: async () => {
    const { stockSearchQuery } = get(); // Obtenemos el search actual (probablemente vacío al inicio)
    // Pasamos el término de búsqueda actual a fetchStock
    await Promise.all([
      get().fetchStock(stockSearchQuery),
      get().fetchStockTotals(),
    ]);
  },
}));

export default useStockStore;
