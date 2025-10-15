// src/components/organisms/AdjustmentSheet.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, Edit, CheckSquare } from "lucide-react"; // 1. Importar nuevos íconos
import useStockStore from "../../stores/useStockStore";
import api from "../../api/api"; // Asegúrate de importar tu instancia de api
import Spinner from "../atoms/Spinner";

export default function AdjustmentSheet() {
  const { stockItems, loading, fetchStock } = useStockStore();
  const [conteo, setConteo] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Nuevo estado para controlar qué fila está en modo de edición
  const [editingRowId, setEditingRowId] = useState(null);

  useEffect(() => {
    if (stockItems.length > 0) {
      const initialCounts = stockItems.reduce((acc, item) => {
        acc[item.id] = item.stock_unidades.toFixed(2);
        return acc;
      }, {});
      setConteo(initialCounts);
    }
  }, [stockItems]);

  const handleInputChange = (itemId, nuevoValor) => {
    setConteo((prevConteo) => ({
      ...prevConteo,
      [itemId]: nuevoValor,
    }));
  };

  const handleSubmit = () => {
    // La lógica de guardado masivo no cambia
    const itemsAjustados = stockItems
      .filter((item) => parseFloat(conteo[item.id]) !== item.stock_unidades)
      .map((item) => ({
        itemId: item.id,
        conteoReal: parseFloat(conteo[item.id]),
      }));

    if (itemsAjustados.length === 0) {
      toast.success("No hay ajustes para guardar.");
      return;
    }

    setIsSubmitting(true);
    const promise = api.post("/stock/mass-adjustment", itemsAjustados);

    toast.promise(promise, {
      loading: "Guardando ajustes...",
      success: () => {
        setIsSubmitting(false);
        setEditingRowId(null); // Salimos del modo edición después de guardar
        fetchStock();
        return "Ajustes guardados con éxito.";
      },
      error: () => {
        setIsSubmitting(false);
        return "Error al guardar los ajustes.";
      },
    });
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs uppercase bg-slate-700 text-slate-400">
            <tr>
              <th className="py-3 px-6">Item</th>
              <th className="py-3 px-6 text-center">Stock Sistema</th>
              <th className="py-3 px-6 text-center">Conteo Físico Real</th>
              {/* 3. Nueva columna para las acciones */}
              <th className="py-3 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {stockItems.map((item) => (
              <tr key={item.id} className="border-b border-slate-700">
                <td className="py-4 px-6 font-medium text-white">
                  {item.nombre_completo}
                </td>
                <td className="py-4 px-6 text-center font-mono">
                  {item.stock_unidades.toFixed(2)}
                </td>
                <td className="py-4 px-6">
                  <input
                    type="number"
                    step="0.01"
                    value={conteo[item.id] || ""}
                    onChange={(e) => handleInputChange(item.id, e.target.value)}
                    // 4. El input está deshabilitado si no es la fila que estamos editando
                    disabled={editingRowId !== item.id}
                    className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg w-full p-2 text-center font-mono focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-800 disabled:text-slate-400"
                  />
                </td>
                {/* 5. Celda con los botones condicionales */}
                <td className="py-4 px-6 text-right">
                  {editingRowId === item.id ? (
                    // Si estamos editando esta fila, mostramos el botón de "Confirmar"
                    <button
                      onClick={() => setEditingRowId(null)}
                      className="p-2 rounded-md hover:bg-slate-700"
                      title="Confirmar cambio"
                    >
                      <CheckSquare className="h-5 w-5 text-green-400" />
                    </button>
                  ) : (
                    // Si no, mostramos el botón de "Editar"
                    <button
                      onClick={() => setEditingRowId(item.id)}
                      className="p-2 rounded-md hover:bg-slate-700"
                      title="Habilitar edición"
                    >
                      <Edit className="h-5 w-5 text-sky-400" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-8">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center justify-center text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500 disabled:cursor-not-allowed"
        >
          <Save className="mr-2 h-5 w-5" />
          {isSubmitting ? "Guardando..." : "Guardar Todos los Ajustes"}
        </button>
      </div>
    </div>
  );
}
