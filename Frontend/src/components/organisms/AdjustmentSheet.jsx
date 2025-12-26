// src/components/organisms/AdjustmentSheet.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, Edit, CheckSquare, FileText } from "lucide-react";
// Solo importamos fetchStock para el refresco final
import useStockStore from "../../stores/useStockStore";
import api from "../../api/api";
import Spinner from "../atoms/Spinner";
import ConfirmationModal from "../molecules/ConfirmationModal";
import Alert from "../atoms/Alert"; // Importación correcta de Alert

export default function AdjustmentSheet() {
  // Estados locales para la lista de items y su carga
  const [localStockItems, setLocalStockItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Estados existentes
  const [conteo, setConteo] = useState({});
  const [descripcion, setDescripcion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Carga del modal
  const [editingRowId, setEditingRowId] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [changesToConfirm, setChangesToConfirm] = useState([]);
  const [itemsAjustadosPayload, setItemsAjustadosPayload] = useState([]);

  // Solo traemos fetchStock del store para refrescar la vista de Inventario al final
  const { fetchStock } = useStockStore();

  // useEffect para cargar TODOS los items al montar
  useEffect(() => {
    const loadAllItems = async () => {
      setIsLoadingItems(true);
      setLoadError(null);
      setLocalStockItems([]); // Limpiar por si acaso
      setConteo({}); // Limpiar conteo previo
      try {
        const response = await api.get("/admin/stock-items/all-for-adjustment");
        if (Array.isArray(response.data)) {
          setLocalStockItems(response.data);
          // Inicializar conteo basado en los items cargados
          const initialCounts = response.data.reduce((acc, item) => {
            acc[item.id] = item.stock_unidades.toFixed(2);
            return acc;
          }, {});
          setConteo(initialCounts);
        } else {
          console.error("Respuesta inesperada:", response.data);
          setLoadError("Error: La respuesta de la API no es válida.");
        }
      } catch (err) {
        console.error("Error loading items for adjustment sheet:", err);
        setLoadError("No se pudieron cargar los items para ajustar.");
      } finally {
        setIsLoadingItems(false);
      }
    };
    loadAllItems();
  }, []); // Cargar solo una vez al montar

  // Ya NO necesitamos el useEffect que dependía de stockItems del store para setConteo

  const handleInputChange = (itemId, nuevoValor) => {
    setConteo((prevConteo) => ({
      ...prevConteo,
      [itemId]: nuevoValor,
    }));
  };

  const handleConfirmEdit = (itemId) => {
    setEditingRowId(null);
  };

  // handleSubmit ahora usa 'localStockItems'
  const handleSubmit = () => {
    if (!descripcion.trim()) {
      toast.error("Debes añadir un motivo...");
      return;
    }
    // Usa localStockItems para comparar
    const itemsConCambios = localStockItems
      .filter((item) => {
        // Comprobar si el conteo existe para este item y es diferente
        const currentCount = conteo[item.id];
        return (
          currentCount !== undefined &&
          parseFloat(currentCount) !== item.stock_unidades
        );
      })
      .map((item) => ({
        id: item.id,
        nombre_completo: item.nombre_completo,
        stock_anterior: item.stock_unidades,
        conteo_nuevo: parseFloat(conteo[item.id]),
      }));

    if (itemsConCambios.length === 0) {
      toast.success("No hay cambios en el conteo para guardar.");
      return;
    }
    const payloadParaApi = itemsConCambios.map((item) => ({
      itemId: item.id,
      conteoReal: item.conteo_nuevo,
    }));
    setChangesToConfirm(itemsConCambios);
    setItemsAjustadosPayload(payloadParaApi);
    setShowConfirmationModal(true);
  };

  // handleConfirmSubmit llama a fetchStock() del store al final
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      descripcion: descripcion.trim(),
      ajustes: itemsAjustadosPayload,
    };
    try {
      await api.post("/stock/mass-adjustment", payload);
      toast.success("Ajustes guardados con éxito.");
      setShowConfirmationModal(false);
      setEditingRowId(null);
      setDescripcion("");

      // Refrescamos la lista local y TAMBIÉN el store
      const loadAllItems = async () => {
        setIsLoadingItems(true); // Mostrar carga mientras se refresca localmente
        try {
          const response = await api.get(
            "/admin/stock-items/all-for-adjustment"
          );
          setLocalStockItems(response.data || []);
          const initialCounts = (response.data || []).reduce((acc, item) => {
            acc[item.id] = item.stock_unidades.toFixed(2);
            return acc;
          }, {});
          setConteo(initialCounts);
        } catch (err) {
          setLoadError("Error al recargar items tras guardar.");
        } finally {
          setIsLoadingItems(false);
        }
      };
      loadAllItems(); // Recarga local
      fetchStock(); // Refresca el store paginado (para la vista Inventario)
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Error al guardar los ajustes."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmationModal(false);
  };

  // Usar isLoadingItems para el spinner principal
  if (isLoadingItems) return <Spinner />;

  return (
    <>
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
        {/* Mostramos error si hubo al cargar */}
        {loadError && <Alert message={loadError} />}

        <div className="overflow-x-auto relative">
          {/* Spinner overlay para recarga post-submit */}
          {isLoadingItems && localStockItems.length > 0 && (
            <div className="absolute inset-0 bg-slate-800/70 flex items-center justify-center z-10">
              <Spinner />
            </div>
          )}

          <table className="w-full min-w-125 text-sm text-left text-slate-300">
            <thead className="text-xs uppercase bg-slate-700 text-slate-400">
              <tr>
                <th className="py-3 px-6">Item</th>
                <th className="py-3 px-6 text-center">Stock Actual / Conteo</th>
              </tr>
            </thead>
            <tbody>
              {/* Usar localStockItems y mostrar mensaje si está vacío */}
              {!isLoadingItems && localStockItems.length === 0 && !loadError ? (
                <tr>
                  <td colSpan={2} className="text-center py-8 text-slate-500">
                    No hay items activos para ajustar.
                  </td>
                </tr>
              ) : (
                localStockItems.map(
                  (
                    item // Mapear sobre localStockItems
                  ) => (
                    <tr key={item.id} className="border-b border-slate-700">
                      <td className="py-4 px-6 font-medium text-white">
                        {item.nombre_completo}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {editingRowId === item.id ? (
                          // ... (input y botón CheckSquare)
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={conteo[item.id] || ""}
                              onChange={(e) =>
                                handleInputChange(item.id, e.target.value)
                              }
                              className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg w-full max-w-25 p-2 text-center font-mono focus:ring-sky-500 focus:border-sky-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleConfirmEdit(item.id)}
                              className="p-2 rounded-md hover:bg-slate-700 shrink-0"
                              title="Confirmar cambio"
                            >
                              <CheckSquare className="h-5 w-5 text-green-400" />
                            </button>
                          </div>
                        ) : (
                          // ... (span y botón Edit)
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono">
                              {conteo[item.id] !== undefined
                                ? conteo[item.id]
                                : item.stock_unidades.toFixed(2)}
                            </span>
                            <button
                              onClick={() => setEditingRowId(item.id)}
                              className="p-2 rounded-md hover:bg-slate-700 shrink-0"
                              title="Habilitar edición"
                            >
                              <Edit className="h-5 w-5 text-sky-400" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* ... (Descripción y Botón Guardar) ... */}
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
            disabled={!descripcion || editingRowId !== null || isLoadingItems}
            className="flex items-center justify-center text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            <Save className="mr-2 h-5 w-5" />
            Revisar y Guardar Ajustes
          </button>
        </div>
      </div>

      {/* Modal (sin cambios) */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        title="Confirmar Ajuste Masivo"
        changes={changesToConfirm}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
        confirmText="Guardar Cambios"
        isSubmitting={isSubmitting}
      />
    </>
  );
}
