// src/components/organisms/AdjustForm.jsx
import { useState, useEffect } from "react";
import api from "../../api/api"; // Asegúrate que la ruta a api.js sea correcta
import toast from "react-hot-toast";
import { SlidersHorizontal } from "lucide-react";
// Ya NO necesitamos useStockStore aquí para obtener la lista
// import useStockStore from "../../stores/useStockStore";
import AutocompleteInput from "../molecules/AutocompleteInput";
import Spinner from "../atoms/Spinner"; // Importar Spinner para la carga del stock

export default function AdjustForm() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockActualSistema, setStockActualSistema] = useState(null);
  const [conteoReal, setConteoReal] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStock, setIsLoadingStock] = useState(false); // Estado para cargar stock individual

  // Ya no necesitamos traer stockItems ni fetchStock del store aquí
  // const { fetchStock, stockItems } = useStockStore();

  // --- useEffect MODIFICADO ---
  // Ahora llama a la API para obtener el stock del item seleccionado
  useEffect(() => {
    // Si no hay item seleccionado, limpiar todo
    if (!selectedItem) {
      setStockActualSistema(null);
      setConteoReal("");
      setDescripcion("");
      setIsLoadingStock(false); // Asegurarse que no esté cargando
      return; // Salir temprano
    }

    // Si hay un item seleccionado, buscar su stock actual en la API
    const fetchItemStock = async () => {
      setIsLoadingStock(true); // Indicar que estamos cargando el stock
      setStockActualSistema(null); // Limpiar valor anterior mientras carga
      setConteoReal("");
      setDescripcion("");
      try {
        // Usamos la ruta específica del admin controller para obtener un item por ID
        const response = await api.get(`/admin/stock-items/${selectedItem.id}`);
        if (response.data && response.data.stock_unidades !== undefined) {
          const stock = response.data.stock_unidades.toFixed(2);
          setStockActualSistema(stock);
          setConteoReal(stock); // Pre-llenar conteo
        } else {
          console.error(
            `Respuesta inesperada para el item ID ${selectedItem.id}:`,
            response.data,
          );
          setStockActualSistema("Error");
          toast.error("No se pudo obtener el stock actual del item.");
        }
      } catch (error) {
        console.error(
          `Error fetching stock for item ID ${selectedItem.id}:`,
          error,
        );
        setStockActualSistema("Error");
        toast.error("Error de red al obtener el stock del item.");
      } finally {
        setIsLoadingStock(false); // Terminar carga
      }
    };

    fetchItemStock();
  }, [selectedItem]); // Depende solo del item seleccionado

  const handleItemSelection = (item) => {
    setSelectedItem(item);
  };

  const handleSubmit = (e) => {
    // ... (lógica handleSubmit sin cambios) ...
    e.preventDefault();
    if (!selectedItem || conteoReal === "" || !descripcion.trim()) {
      toast.error(
        "Selecciona un item, especifica el conteo real y añade un motivo.",
      );
      return;
    }
    // Asegurarse que el stock se haya cargado correctamente antes de permitir guardar
    if (
      stockActualSistema === null ||
      stockActualSistema === "Error" ||
      stockActualSistema === "N/A"
    ) {
      toast.error(
        "Espera a que cargue el stock actual o selecciona un item válido.",
      );
      return;
    }

    const payload = {
      itemId: selectedItem.id,
      conteoReal: parseFloat(conteoReal),
      descripcion: descripcion.trim(),
    };

    setIsSubmitting(true);
    const promise = api.post("/stock/adjust", payload);

    toast.promise(promise, {
      loading: "Registrando ajuste...",
      success: (response) => {
        setIsSubmitting(false);
        setSelectedItem(null); // Limpia selección y campos asociados
        // Quizás llamar a fetchStock() del store si es necesario actualizar la tabla principal
        // useStockStore.getState().fetchStock(); // Llamada directa al store si es necesario
        return "¡Ajuste registrado con éxito!";
      },
      error: (err) => {
        setIsSubmitting(false);
        console.error("Error al registrar el ajuste:", err);
        return err.response?.data?.message || "Error al registrar el ajuste.";
      },
    });
  };

  return (
    <div className="bg-surface p-8 rounded-lg shadow-(--shadow-card) border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        <AutocompleteInput
          label="Item a Ajustar"
          placeholder="Escribe para buscar item..."
          onItemSelected={handleItemSelection}
          // Necesitamos una forma de limpiar el AutocompleteInput programáticamente
          // cuando setSelectedItem(null) se llama desde handleSubmit.
          // Esto requiere usar forwardRef y useImperativeHandle en AutocompleteInput
          // y pasarle una ref desde aquí. (PENDIENTE si no se hizo)
        />

        {/* Mostrar stock actual o spinner */}
        {selectedItem && (
          <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center min-h-[60px] border border-gray-100 shadow-inner">
            <span className="text-text-secondary font-medium">
              Stock actual en sistema:
            </span>
            {isLoadingStock ? (
              <Spinner />
            ) : (
              <span
                className={`font-bold text-lg ${
                  stockActualSistema === "Error"
                    ? "text-primary"
                    : "text-text-primary"
                }`}
              >
                {stockActualSistema}{" "}
                {stockActualSistema !== "Error" && stockActualSistema !== "N/A"
                  ? "unidades"
                  : ""}
              </span>
            )}
          </div>
        )}

        {/* Campo Conteo Real */}
        <div>
          <label
            htmlFor="conteoReal"
            className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider"
          >
            Conteo Físico Real (unidades)
          </label>
          <input
            type="number"
            id="conteoReal"
            value={conteoReal}
            onChange={(e) => setConteoReal(e.target.value)}
            step="0.01"
            className="bg-white border border-gray-300 text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition-all shadow-sm placeholder:text-gray-400"
            placeholder="Ej: 12.5"
            disabled={!selectedItem || isLoadingStock} // Deshabilitar mientras carga stock
          />
        </div>

        {/* Campo Motivo */}
        <div>
          <label
            htmlFor="descripcion"
            className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider"
          >
            Motivo del Ajuste
          </label>
          <input
            type="text"
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="bg-white border border-gray-300 text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition-all shadow-sm placeholder:text-gray-400"
            placeholder="Ej: Rotura de botella, Conteo físico semanal"
            disabled={!selectedItem || isLoadingStock} // Deshabilitar mientras carga stock
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedItem ||
              isLoadingStock ||
              stockActualSistema === "Error"
            } // Deshabilitar si carga o hay error
            className="flex items-center justify-center text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:ring-red-100 font-bold rounded-lg text-sm px-8 py-3 text-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/10 uppercase tracking-widest"
          >
            <SlidersHorizontal className="mr-2 h-5 w-5" />
            {isSubmitting ? "Ajustando..." : "Confirmar Ajuste"}
          </button>
        </div>
      </form>
    </div>
  );
}
