// src/components/organisms/PurchasingForm.jsx
import React, { useState, useRef } from "react"; // 1. Importar useRef
import api from "../../api/api";
import { PlusCircle, ShoppingCart, Send, FileText } from "lucide-react";
import toast from "react-hot-toast";
import useStockStore from "../../stores/useStockStore";
import AutocompleteInput from "../molecules/AutocompleteInput"; // 2. Importar AutocompleteInput

export default function PurchasingForm() {
  const { fetchStock } = useStockStore(); // Ya no necesitamos stockItems aquí
  const [compraActual, setCompraActual] = useState([]);
  const [cantidad, setCantidad] = useState("");
  const [descripcionCompra, setDescripcionCompra] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. Nuevo estado para el item seleccionado en el autocomplete
  const [selectedItemToAdd, setSelectedItemToAdd] = useState(null); // { id, nombre_completo } | null
  const autocompleteRef = useRef(); // 4. Ref para el AutocompleteInput

  // 5. Callback para el AutocompleteInput
  const handleItemSelectionToAdd = (item) => {
    setSelectedItemToAdd(item);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    // 6. Validar usando selectedItemToAdd
    if (!selectedItemToAdd || !cantidad) {
      toast.error("Selecciona un item y especifica la cantidad.");
      return;
    }

    const nuevoItem = {
      itemId: selectedItemToAdd.id,
      nombre: selectedItemToAdd.nombre_completo,
      cantidad: parseFloat(cantidad),
    };

    setCompraActual([...compraActual, nuevoItem]);

    // 7. Limpiar campos y el AutocompleteInput
    setCantidad("");
    setSelectedItemToAdd(null); // Limpiar estado local
    if (autocompleteRef.current) {
      autocompleteRef.current.clear(); // Limpiar el input del componente hijo
    }
  };

  const handleSubmitCompra = () => {
    if (compraActual.length === 0) {
      toast.error("Agrega al menos un item a la compra.");
      return;
    }
    if (!descripcionCompra.trim()) {
      toast.error("Añade un detalle o motivo para la compra.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      descripcion: descripcionCompra.trim(),
      itemsComprados: compraActual,
    };

    const promise = api.post("/stock/purchases", payload);

    toast.promise(promise, {
      loading: "Registrando compra...",
      success: (response) => {
        setCompraActual([]);
        setDescripcionCompra("");
        setIsSubmitting(false);
        // fetchStock() puede ser necesario si la tabla de inventario está visible
        // o si otros componentes dependen de ella actualizada inmediatamente.
        // Si no, se actualizará la próxima vez que se navegue a Inventario.
        // Por ahora lo dejamos para mantener consistencia.
        fetchStock();
        return "¡Compra registrada con éxito!";
      },
      error: (err) => {
        console.error("Error al registrar la compra:", err);
        setIsSubmitting(false);
        return (
          err.response?.data?.message ||
          "Error al registrar la compra. Intenta de nuevo."
        );
      },
    });
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <form
        onSubmit={handleAddItem}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8"
      >
        {/* 8. Reemplazar <select> con <AutocompleteInput> */}
        <div className="md:col-span-2">
          <AutocompleteInput
            ref={autocompleteRef} // Asignar ref
            label="Item"
            placeholder="Escribe para buscar item..."
            onItemSelected={handleItemSelectionToAdd}
          />
        </div>
        <div>
          <label
            htmlFor="cantidad"
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            Cantidad (unidades)
          </label>
          <input
            type="number"
            id="cantidad"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            step="0.01"
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
            // Deshabilitar cantidad si no hay item seleccionado
            disabled={!selectedItemToAdd}
          />
        </div>
        <button
          type="submit"
          // Deshabilitar botón si no hay item o cantidad
          disabled={!selectedItemToAdd || !cantidad}
          className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:outline-none focus:ring-sky-800 font-medium rounded-lg text-sm w-full px-5 py-2.5 text-center disabled:bg-slate-500 disabled:opacity-70"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Agregar Item
        </button>
      </form>

      {/* Campo de Descripción (sin cambios) */}
      <div className="mb-6">
        <label
          htmlFor="descripcion-compra"
          className="block mb-2 text-sm font-medium text-slate-300"
        >
          Detalle de la Compra (Obligatorio)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FileText className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            id="descripcion-compra"
            value={descripcionCompra}
            onChange={(e) => setDescripcionCompra(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 pl-10"
            placeholder="Ej: Compra Proveedor X, Factura Nro. 12345"
          />
        </div>
      </div>

      {/* Lista de Items en Compra (sin cambios) */}
      <h3 className="text-xl font-semibold text-white mb-4 border-t border-slate-700 pt-6">
        <ShoppingCart className="inline-block mr-3 h-6 w-6" />
        Items en esta Compra
      </h3>
      <div className="bg-slate-900 rounded-lg p-4 min-h-[150px]">
        {compraActual.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            Aún no has agregado items a la compra.
          </p>
        ) : (
          <ul className="divide-y divide-slate-700">
            {compraActual.map((item, index) => (
              <li
                key={index} // Considera usar item.itemId si no permites duplicados o una key más robusta
                className="py-3 sm:py-4 flex justify-between items-center"
              >
                <div>
                  <p className="text-md font-medium text-white">
                    {item.nombre}
                  </p>
                </div>
                <p className="text-md font-semibold text-white">
                  {item.cantidad.toFixed(2)} unidades
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Botón Registrar Compra (sin cambios en lógica, solo validación) */}
      {compraActual.length > 0 && (
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSubmitCompra}
            disabled={isSubmitting || !descripcionCompra}
            className="flex items-center justify-center text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            <Send className="mr-2 h-5 w-5" />
            {isSubmitting ? "Registrando..." : "Registrar Compra Completa"}
          </button>
        </div>
      )}
    </div>
  );
}
