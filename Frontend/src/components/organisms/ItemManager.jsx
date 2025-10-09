// src/components/organisms/ItemManager.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { PackagePlus, Edit } from "lucide-react";
import useStockStore from "../../stores/useStockStore"; // Usaremos el store para la lista

// --- Componente interno para el Formulario ---
const ItemForm = ({ itemToEdit, onFormSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    marca_id: "",
    equivalencia_ml: "",
    prioridad_consumo: "1",
    alerta_stock_bajo: "",
  });
  const [marcas, setMarcas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar las marcas para el desplegable
  useEffect(() => {
    api
      .get("/admin/marcas")
      .then((res) => setMarcas(res.data))
      .catch(() => toast.error("No se pudieron cargar las marcas."));
  }, []);

  // Rellenar el formulario si estamos editando
  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        marca_id: itemToEdit.marca_id || "",
        equivalencia_ml: itemToEdit.equivalencia_ml || "",
        prioridad_consumo: itemToEdit.prioridad_consumo || "1",
        alerta_stock_bajo: itemToEdit.alerta_stock_bajo || "",
      });
    } else {
      setFormData({
        marca_id: "",
        equivalencia_ml: "",
        prioridad_consumo: "1",
        alerta_stock_bajo: "",
      });
    }
  }, [itemToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.marca_id ||
      !formData.equivalencia_ml ||
      !formData.alerta_stock_bajo
    ) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    setIsSubmitting(true);
    const payload = { ...formData };
    const isEditing = !!itemToEdit?.id;

    const promise = isEditing
      ? api.put(`/admin/stock-items/${itemToEdit.id}`, payload)
      : api.post("/admin/stock-items", payload);

    toast.promise(promise, {
      loading: isEditing ? "Actualizando item..." : "Creando item...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit();
        return `¡Item ${isEditing ? "actualizado" : "creado"} con éxito!`;
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Ocurrió un error.";
      },
    });
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <PackagePlus className="text-sky-400" />
        {itemToEdit?.id ? "Editar Item de Stock" : "Crear Nuevo Item de Stock"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            name="marca_id"
            value={formData.marca_id}
            onChange={(e) =>
              setFormData({ ...formData, marca_id: e.target.value })
            }
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
          >
            <option value="">Selecciona una marca...</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="equivalencia_ml"
            placeholder="Equivalencia (ml)"
            value={formData.equivalencia_ml}
            onChange={(e) =>
              setFormData({ ...formData, equivalencia_ml: e.target.value })
            }
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
          />
          <input
            type="number"
            name="prioridad_consumo"
            placeholder="Prioridad de Consumo"
            value={formData.prioridad_consumo}
            onChange={(e) =>
              setFormData({ ...formData, prioridad_consumo: e.target.value })
            }
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
          />
          <input
            type="number"
            step="0.01"
            name="alerta_stock_bajo"
            placeholder="Alerta de Stock Bajo"
            value={formData.alerta_stock_bajo}
            onChange={(e) =>
              setFormData({ ...formData, alerta_stock_bajo: e.target.value })
            }
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
          />
        </div>
        <div className="flex justify-end pt-2 gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-white bg-slate-600 hover:bg-slate-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500"
          >
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Componente Principal del Gestor ---
export default function ItemManager() {
  const { stockItems, fetchStock } = useStockStore(); // Usamos el store para obtener la lista
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchStock(); // Asegurarnos de que la lista esté actualizada al montar
  }, []);

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchStock(); // Refrescamos la lista global de items
  };

  if (showForm) {
    return (
      <ItemForm
        itemToEdit={editingItem}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          Gestionar Items (Envases)
        </h3>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          <PackagePlus className="mr-2 h-5 w-5" />
          Crear Nuevo
        </button>
      </div>
      <ul className="divide-y divide-slate-700">
        {stockItems.map((item) => (
          <li key={item.id} className="py-3 flex justify-between items-center">
            <div>
              <span className="text-white">{item.nombre_completo}</span>
              <span className="text-xs text-slate-400 ml-2 bg-slate-700 px-2 py-1 rounded-full">
                {item.nombre_categoria}
              </span>
            </div>
            <button
              onClick={() => handleEdit(item)}
              className="p-2 rounded-md hover:bg-slate-700"
            >
              <Edit className="h-5 w-5 text-sky-400" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
