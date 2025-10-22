// src/components/organisms/ProductionForm.jsx
import { useState } from "react";
import { Hammer, Send } from "lucide-react"; // O iconos relevantes
import toast from "react-hot-toast";
// Importar AutocompleteInput si se usa
// import AutocompleteInput from "../molecules/AutocompleteInput";
// import api from "../../api/api";

export default function ProductionForm() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const productAutocompleteRef = useRef(); // Si usas Autocomplete

  const handleProductSelection = (product) => {
    setSelectedProduct(product);
    // Aquí podrías hacer una llamada API para obtener la receta y mostrar vista previa
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || !description.trim()) {
      toast.error(
        "Selecciona un producto, indica la cantidad y añade una descripción."
      );
      return;
    }
    setIsSubmitting(true);
    console.log("Payload para API:", {
      productId: selectedProduct.id, // Suponiendo que el selector devuelve { id, nombre }
      quantityProduced: parseFloat(quantity),
      description: description.trim(),
    });

    // --- TODO: Implementar llamada a la API POST /api/stock/production ---
    // const promise = api.post("/stock/production", { /* payload */ });
    // toast.promise(promise, { ... });

    // Simulación temporal:
    setTimeout(() => {
      toast.success("Simulación: Producción registrada (API no implementada)");
      setSelectedProduct(null);
      setQuantity("");
      setDescription("");
      // productAutocompleteRef.current?.clear(); // Limpiar autocomplete
      setIsSubmitting(false);
    }, 1500);
  };

  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500";

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <Hammer className="text-sky-400" />
        Registrar Producción
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Selector de Producto (Placeholder - Implementar con Select o Autocomplete) */}
        <div>
          <label
            htmlFor="product-select"
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            Producto a Producir (*)
          </label>
          {/* <AutocompleteInput ref={productAutocompleteRef} ... onItemSelected={handleProductSelection} /> */}
          <select
            id="product-select"
            value={selectedProduct?.id || ""}
            onChange={(e) => {
              // Simulación, necesitarás cargar productos reales
              if (e.target.value) {
                handleProductSelection({
                  id: e.target.value,
                  nombre: e.target.options[e.target.selectedIndex].text,
                });
              } else {
                handleProductSelection(null);
              }
            }}
            className={commonInputClass}
            required
          >
            <option value="">Selecciona un producto de producción...</option>
            {/* TODO: Cargar aquí los productos desde la API (filtrar por nombre "PRODUCCION:"?) */}
            <option value="1">PRODUCCION: Negroni Base 1L (Ejemplo)</option>
            <option value="2">PRODUCCION: Syrup Simple 1L (Ejemplo)</option>
          </select>
        </div>

        {/* 2. Cantidad Producida */}
        <div>
          <label
            htmlFor="quantity"
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            Cantidad a Producir (*)
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={commonInputClass}
            required
            min="0.01" // Producir al menos algo
            step="any" // Permitir decimales
            placeholder="Ej: 5 (según unidad de la receta)"
            disabled={!selectedProduct}
          />
        </div>

        {/* 3. Descripción */}
        <div>
          <label
            htmlFor="description"
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            Descripción / Motivo (*)
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={commonInputClass}
            required
            placeholder="Ej: Producción semanal Negroni, Batch para evento"
            disabled={!selectedProduct}
          />
        </div>

        {/* (Opcional) Vista Previa de Consumo */}
        {selectedProduct && quantity && (
          <div className="bg-slate-900 p-4 rounded text-sm text-slate-400">
            <p className="font-semibold mb-2 text-slate-300">
              Consumo estimado:
            </p>
            {/* TODO: Mostrar aquí los ingredientes y cantidades calculadas */}
            <p> - Ingrediente A: X.XX unidades</p>
            <p> - Ingrediente B: Y.YY unidades</p>
            <p className="mt-2 text-xs italic">
              (Esta es una vista previa, el stock real se verificará al guardar)
            </p>
          </div>
        )}

        {/* Botón Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={
              isSubmitting || !selectedProduct || !quantity || !description
            }
            className="flex items-center justify-center text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            <Send className="mr-2 h-5 w-5" />
            {isSubmitting ? "Registrando..." : "Registrar Producción"}
          </button>
        </div>
      </form>
    </div>
  );
}
