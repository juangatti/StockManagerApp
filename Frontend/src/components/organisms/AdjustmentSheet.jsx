// src/components/organisms/AdjustmentSheet.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, Edit, CheckSquare, FileText } from "lucide-react"; // 1. Importar FileText
import useStockStore from "../../stores/useStockStore";
import api from "../../api/api";
import Spinner from "../atoms/Spinner";

export default function AdjustmentSheet() {
  const { stockItems, loading, fetchStock } = useStockStore();
  const [conteo, setConteo] = useState({});
  const [descripcion, setDescripcion] = useState(""); // 2. Nuevo estado para la descripción general
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    // 3. Validar la descripción
    if (!descripcion.trim()) {
      toast.error(
        "Debes añadir un motivo o descripción para el ajuste masivo."
      );
      return;
    }

    const itemsAjustados = stockItems
      .filter((item) => parseFloat(conteo[item.id]) !== item.stock_unidades)
      .map((item) => ({
        itemId: item.id,
        conteoReal: parseFloat(conteo[item.id]),
        // La descripción individual ya no es necesaria aquí, usaremos la general
      }));

    if (itemsAjustados.length === 0) {
      toast.success("No hay cambios en el conteo para guardar.");
      return;
    }

    setIsSubmitting(true);

    // 4. Crear el nuevo payload como un objeto
    const payload = {
      descripcion: descripcion.trim(),
      ajustes: itemsAjustados,
    };

    const promise = api.post("/stock/mass-adjustment", payload); // Enviamos el objeto

    toast.promise(promise, {
      loading: "Guardando ajustes...",
      success: () => {
        setIsSubmitting(false);
        setEditingRowId(null);
        setDescripcion(""); // 5. Limpiamos la descripción
        fetchStock(); // Esto recargará los conteos desde la DB
        return "Ajustes guardados con éxito.";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Error al guardar los ajustes.";
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
                    disabled={editingRowId !== item.id}
                    className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg w-full p-2 text-center font-mono focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-800 disabled:text-slate-400"
                  />
                </td>
                <td className="py-4 px-6 text-right">
                  {editingRowId === item.id ? (
                    <button
                      onClick={() => setEditingRowId(null)}
                      className="p-2 rounded-md hover:bg-slate-700"
                      title="Confirmar cambio"
                    >
                      <CheckSquare className="h-5 w-5 text-green-400" />
                    </button>
                  ) : (
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

      {/* --- 6. NUEVO CAMPO DE DESCRIPCIÓN --- */}
      <div className="mt-8 border-t border-slate-700 pt-6">
        <label
          htmlFor="descripcion-masiva"
          className="block mb-2 text-sm font-medium text-slate-300"
        >
          Motivo del Ajuste Masivo (Obligatorio)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FileText className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            id="descripcion-masiva"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 pl-10"
            placeholder="Ej: Conteo semanal barra principal, Cierre de mes"
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !descripcion} // Deshabilitado si no hay descripción
          className="flex items-center justify-center text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500 disabled:cursor-not-allowed"
        >
          <Save className="mr-2 h-5 w-5" />
          {isSubmitting ? "Guardando..." : "Guardar Todos los Ajustes"}
        </button>
      </div>
    </div>
  );
}
