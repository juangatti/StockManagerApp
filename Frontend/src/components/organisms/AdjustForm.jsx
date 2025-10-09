import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SlidersHorizontal } from "lucide-react";
import useStockStore from "../../stores/useStockStore";

export default function AdjustForm() {
  const { stockItems, fetchStock } = useStockStore();
  const [itemIdSeleccionado, setItemIdSeleccionado] = useState("");
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [conteoReal, setConteoReal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (itemIdSeleccionado) {
      const item = stockItems.find(
        (item) => item.id === parseInt(itemIdSeleccionado)
      );
      setItemSeleccionado(item);
      setConteoReal(item ? item.stock_unidades.toFixed(2) : "");
    } else {
      setItemSeleccionado(null);
      setConteoReal("");
    }
  }, [itemIdSeleccionado, stockItems]);

  const handleSubmit = (e) => {
    // ... (la lógica de envío no cambia)
    e.preventDefault();
    if (!itemIdSeleccionado || conteoReal === "") {
      toast.error("Selecciona un item y especifica el conteo real.");
      return;
    }

    const payload = {
      itemId: parseInt(itemIdSeleccionado),
      conteoReal: parseFloat(conteoReal),
      descripcion: `Ajuste por conteo físico - ${new Date().toLocaleDateString()}`,
    };

    setIsSubmitting(true);
    const promise = axios.post(
      "http://localhost:5000/api/stock/adjust",
      payload
    );

    toast.promise(promise, {
      loading: "Registrando ajuste...",
      success: (response) => {
        setIsSubmitting(false);
        setItemIdSeleccionado("");
        fetchStock(); // Refrescamos el estado global
        return "¡Ajuste registrado con éxito!";
      },
      error: (err) => {
        setIsSubmitting(false);
        console.error("Error al registrar el ajuste:", err);
        return "Error al registrar el ajuste. Intenta de nuevo.";
      },
    });
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="item"
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            Item a Ajustar
          </label>
          <select
            id="item"
            value={itemIdSeleccionado}
            onChange={(e) => setItemIdSeleccionado(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
          >
            <option value="">Selecciona un item...</option>
            {stockItems.map((item) => (
              // 1. CORRECCIÓN: Usar 'nombre_completo'
              <option key={item.id} value={item.id}>
                {item.nombre_completo}
              </option>
            ))}
          </select>
        </div>
        {/* ... (el resto del JSX no cambia) ... */}
        {itemSeleccionado && (
          <div className="bg-slate-900 p-4 rounded-lg flex justify-between items-center">
            <span className="text-slate-400">Stock actual en sistema:</span>
            <span className="font-bold text-white text-lg">
              {itemSeleccionado.stock_unidades.toFixed(2)} unidades
            </span>
          </div>
        )}
        <div>
          <label
            htmlFor="conteoReal"
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            Conteo Físico Real (unidades)
          </label>
          <input
            type="number"
            id="conteoReal"
            value={conteoReal}
            onChange={(e) => setConteoReal(e.target.value)}
            step="0.01"
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
            placeholder="Ej: 12.5"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !itemIdSeleccionado}
            className="flex items-center justify-center text-white bg-amber-600 hover:bg-amber-700 focus:ring-4 focus:ring-amber-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            <SlidersHorizontal className="mr-2 h-5 w-5" />
            {isSubmitting ? "Ajustando..." : "Confirmar Ajuste"}
          </button>
        </div>
      </form>
    </div>
  );
}
