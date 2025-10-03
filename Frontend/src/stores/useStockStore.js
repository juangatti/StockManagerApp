import { create } from "zustand";
import axios from "axios";

const useStockStore = create((set) => ({
  // --- ESTADO INICIAL ---
  stockItems: [], // Para la tabla detallada
  stockTotals: [], // Para las tarjetas de resumen
  loading: true, // Un único estado de carga para todo
  error: null,

  // --- ACCIONES (FUNCIONES QUE MODIFICAN EL ESTADO) ---

  // Acción para buscar TODOS los datos del stock
  fetchStock: async () => {
    try {
      set({ loading: true, error: null });

      // Hacemos las dos llamadas a la API en paralelo para más eficiencia
      const [itemsResponse, totalsResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/stock"),
        axios.get("http://localhost:5000/api/stock/totals"),
      ]);

      // Una vez que ambas terminan, actualizamos el estado
      set({
        stockItems: itemsResponse.data,
        stockTotals: totalsResponse.data,
        loading: false,
      });
    } catch (err) {
      console.error("Error al obtener datos del stock:", err);
      set({
        error: "No se pudieron cargar los datos del inventario.",
        loading: false,
      });
    }
  },
}));

export default useStockStore;
