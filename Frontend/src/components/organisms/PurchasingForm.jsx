import { useState } from "react";
import api from "../../api/api";
import { PlusCircle, ShoppingCart, Send } from "lucide-react";
import toast from "react-hot-toast";
import useStockStore from "../../stores/useStockStore";

export default function PurchasingForm() {
  const { stockItems, fetchStock } = useStockStore();

  const [compraActual, setCompraActual] = useState([]);
  const [itemIdSeleccionado, setItemIdSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!itemIdSeleccionado || !cantidad) {
      alert("Por favor, selecciona un item y especifica la cantidad.");
      return;
    }

    // Usamos 'stockItems' del store en lugar de 'listaItems' del estado local
    const itemDetails = stockItems.find(
      (item) => item.id === parseInt(itemIdSeleccionado)
    );

    const nuevoItem = {
      itemId: parseInt(itemIdSeleccionado),
      nombre: itemDetails.nombre_item,
      cantidad: parseFloat(cantidad),
      descripcion: `Compra ${new Date().toLocaleDateString()}`,
    };

    setCompraActual([...compraActual, nuevoItem]);
    setItemIdSeleccionado("");
    setCantidad("");
  };

  const handleSubmitCompra = () => {
    if (compraActual.length === 0) return;

    setIsSubmitting(true);
    const promise = api.post("/stock/purchases", compraActual);

    toast.promise(promise, {
      loading: "Registrando compra...",
      success: () => {
        setCompraActual([]);
        setIsSubmitting(false);
        fetchStock(); // <-- 3. Refrescamos el estado global
        return "¡Compra registrada con éxito!";
      },
      error: (err) => {
        setIsSubmitting(false);
        return "Error al registrar la compra. Intenta de nuevo.";
      },
    });
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      {/* --- FORMULARIO PARA AÑADIR UN ITEM --- */}
      <form
        onSubmit={handleAddItem}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8"
      >
        {/* Selector de Item */}
        <div className="md:col-span-2">
          <label
            htmlFor="item"
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            Item
          </label>
          <select
            id="item"
            value={itemIdSeleccionado}
            onChange={(e) => setItemIdSeleccionado(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
          >
            <option value="">Selecciona un item...</option>
            {stockItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre_item}
              </option>
            ))}
          </select>
        </div>

        {/* Input de Cantidad */}
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
          />
        </div>

        {/* Botón para Agregar */}
        <button
          type="submit"
          className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:outline-none focus:ring-sky-800 font-medium rounded-lg text-sm w-full px-5 py-2.5 text-center"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Agregar Item
        </button>
      </form>
      {/* --- LISTA DE ITEMS EN LA COMPRA ACTUAL --- */}
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
                key={index}
                className="py-3 sm:py-4 flex justify-between items-center"
              >
                <div>
                  <p className="text-md font-medium text-white">
                    {item.nombre}
                  </p>
                  <p className="text-sm text-slate-400">{item.descripcion}</p>
                </div>
                <p className="text-md font-semibold text-white">
                  {item.cantidad.toFixed(2)} unidades
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* --- BOTÓN FINAL PARA REGISTRAR COMPRA --- */}
      {compraActual.length > 0 && (
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSubmitCompra}
            disabled={isSubmitting}
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
