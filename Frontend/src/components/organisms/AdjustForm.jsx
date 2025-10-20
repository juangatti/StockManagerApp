// src/components/organisms/AdjustmentSheet.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, Edit, CheckSquare, FileText } from "lucide-react";
import useStockStore from "../../stores/useStockStore";
import api from "../../api/api";
import Spinner from "../atoms/Spinner";
import ConfirmationModal from "../molecules/ConfirmationModal"; // 1. Importar el modal

export default function AdjustmentSheet() {
  const { stockItems, loading, fetchStock } = useStockStore();
  const [conteo, setConteo] = useState({});
  const [descripcion, setDescripcion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Ahora indica carga DENTRO del modal
  const [editingRowId, setEditingRowId] = useState(null);

  // 2. Nuevos estados para el modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [changesToConfirm, setChangesToConfirm] = useState([]); // Guardará { id, nombre_completo, stock_anterior, conteo_nuevo }
  const [itemsAjustadosPayload, setItemsAjustadosPayload] = useState([]); // Guardará el payload para la API

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

  const handleConfirmEdit = (itemId) => {
    setEditingRowId(null);
  };

  // 3. Modificar handleSubmit para MOSTRAR el modal
  const handleSubmit = () => {
    if (!descripcion.trim()) {
      toast.error(
        "Debes añadir un motivo o descripción para el ajuste masivo."
      );
      return;
    }

    // Calcular qué items cambiaron
    const itemsConCambios = stockItems
      .filter((item) => parseFloat(conteo[item.id]) !== item.stock_unidades)
      .map((item) => ({
        id: item.id, // Necesario para la key en el modal
        nombre_completo: item.nombre_completo,
        stock_anterior: item.stock_unidades,
        conteo_nuevo: parseFloat(conteo[item.id]), // Usamos el valor del estado 'conteo'
      }));

    if (itemsConCambios.length === 0) {
      toast.success("No hay cambios en el conteo para guardar.");
      return;
    }

    // Preparar payload para la API (solo id y conteoReal)
    const payloadParaApi = itemsConCambios.map((item) => ({
      itemId: item.id,
      conteoReal: item.conteo_nuevo,
    }));

    // Guardar los cambios y el payload en el estado y mostrar modal
    setChangesToConfirm(itemsConCambios);
    setItemsAjustadosPayload(payloadParaApi); // Guardamos el payload que necesita la API
    setShowConfirmationModal(true);
    // Ya NO llamamos a la API aquí
  };

  // 4. Nueva función para confirmar desde el modal
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true); // Activar spinner en el botón del modal
    const payload = {
      descripcion: descripcion.trim(),
      ajustes: itemsAjustadosPayload, // Usamos el payload guardado
    };

    try {
      await api.post("/stock/mass-adjustment", payload);
      toast.success("Ajustes guardados con éxito.");
      setShowConfirmationModal(false); // Cerrar modal
      setEditingRowId(null);
      setDescripcion("");
      fetchStock(); // Recargar datos
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Error al guardar los ajustes."
      );
      // Mantenemos el modal abierto en caso de error para que el usuario vea
    } finally {
      setIsSubmitting(false); // Desactivar spinner del modal
    }
  };

  // 5. Nueva función para cancelar desde el modal
  const handleCancelSubmit = () => {
    setShowConfirmationModal(false);
    // No reseteamos nada, los cambios en 'conteo' y 'descripcion' se mantienen
  };

  if (loading && Object.keys(conteo).length === 0) return <Spinner />; // Spinner inicial

  return (
    <>
      {" "}
      {/* 6. Envolver en Fragment para el modal */}
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
        <div className="overflow-x-auto">
          {/* Tabla (sin cambios internos) */}
          <table className="w-full min-w-[500px] text-sm text-left text-slate-300">
            <thead className="text-xs uppercase bg-slate-700 text-slate-400">
              <tr>
                <th className="py-3 px-6">Item</th>
                <th className="py-3 px-6 text-center">Stock Actual / Conteo</th>
              </tr>
            </thead>
            <tbody>
              {stockItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-700">
                  <td className="py-4 px-6 font-medium text-white">
                    {item.nombre_completo}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {editingRowId === item.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={conteo[item.id] || ""}
                          onChange={(e) =>
                            handleInputChange(item.id, e.target.value)
                          }
                          className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg w-full max-w-[100px] p-2 text-center font-mono focus:ring-sky-500 focus:border-sky-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleConfirmEdit(item.id)}
                          className="p-2 rounded-md hover:bg-slate-700 flex-shrink-0"
                          title="Confirmar cambio"
                        >
                          <CheckSquare className="h-5 w-5 text-green-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono">
                          {conteo[item.id] !== undefined
                            ? conteo[item.id]
                            : item.stock_unidades.toFixed(2)}
                        </span>
                        <button
                          onClick={() => setEditingRowId(item.id)}
                          className="p-2 rounded-md hover:bg-slate-700 flex-shrink-0"
                          title="Habilitar edición"
                        >
                          <Edit className="h-5 w-5 text-sky-400" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Campo Descripción (sin cambios) */}
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

        {/* Botón Guardar (AHORA llama a handleSubmit, que muestra el modal) */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit} // Llama a la función que abre el modal
            // Ya no usamos isSubmitting aquí, el modal lo maneja
            disabled={!descripcion || editingRowId !== null} // Deshabilitar si se está editando una fila o no hay descripción
            className="flex items-center justify-center text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            <Save className="mr-2 h-5 w-5" />
            Revisar y Guardar Ajustes
          </button>
        </div>
      </div>
      {/* 7. Renderizar el Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        title="Confirmar Ajuste Masivo"
        changes={changesToConfirm}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
        confirmText="Guardar Cambios"
        isSubmitting={isSubmitting} // Pasamos el estado de carga al modal
      />
    </>
  );
}
