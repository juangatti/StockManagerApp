// src/components/organisms/ItemForm.jsx
import { useState, useEffect } from "react";
import api from "../../api/api"; // Asegúrate que la ruta a api.js sea correcta
import toast from "react-hot-toast";
import { PackagePlus } from "lucide-react";
// NO DEBE HABER import useStockStore from ... aquí

export default function ItemForm({ itemToEdit, onFormSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    marca_id: "",
    equivalencia_ml: "",
    prioridad_consumo: "1",
    alerta_stock_bajo: "",
  });
  const [marcas, setMarcas] = useState([]); // Estado local para las marcas
  const [isSubmitting, setIsSubmitting] = useState(false);

  // useEffect para cargar TODAS las marcas al montar
  useEffect(() => {
    api
      .get("/admin/marcas/all") // Llama al endpoint que devuelve la lista completa
      .then((res) => {
        if (Array.isArray(res.data)) {
          setMarcas(res.data); // Guarda el array
        } else {
          console.error(
            "La respuesta de /admin/marcas/all no es un array:",
            res.data
          );
          setMarcas([]);
          toast.error(
            "Error al cargar la lista de marcas (formato inesperado)."
          );
        }
      })
      .catch(() =>
        toast.error("No se pudieron cargar las marcas (error de red).")
      );
  }, []); // Vacío para ejecutar solo al montar

  // useEffect para pre-llenar el form si estamos editando
  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        marca_id: itemToEdit.marca_id || "",
        equivalencia_ml: itemToEdit.equivalencia_ml || "",
        prioridad_consumo: itemToEdit.prioridad_consumo || "1",
        alerta_stock_bajo: itemToEdit.alerta_stock_bajo || "",
      });
    } else {
      // Resetear para creación
      setFormData({
        marca_id: "",
        equivalencia_ml: "",
        prioridad_consumo: "1",
        alerta_stock_bajo: "",
      });
    }
  }, [itemToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.marca_id ||
      !formData.equivalencia_ml ||
      !formData.alerta_stock_bajo // Asegúrate que prioridad_consumo no sea null o undefined si es requerido
    ) {
      toast.error(
        "La marca, equivalencia, prioridad y alerta de stock son obligatorios."
      );
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      marca_id: parseInt(formData.marca_id),
      equivalencia_ml: parseFloat(formData.equivalencia_ml),
      // Asegurarse que prioridad_consumo siempre tenga un valor numérico válido
      prioridad_consumo: parseInt(formData.prioridad_consumo) || 1,
      alerta_stock_bajo: parseFloat(formData.alerta_stock_bajo),
    };
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
        return err.response?.data?.message || "Ocurrió un error al guardar.";
      },
    });
  };

  // --- JSX ---
  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <PackagePlus className="text-sky-400" />
        {itemToEdit?.id ? "Editar Item de Stock" : "Crear Nuevo Item (Envase)"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="marca_id"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Marca del Producto
            </label>
            {/* Este select usa el estado local 'marcas' */}
            <select
              name="marca_id"
              id="marca_id"
              value={formData.marca_id}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
              required // Hacer obligatorio
            >
              <option value="">Selecciona una marca...</option>
              {/* Verifica que 'marcas' sea un array antes de mapear */}
              {Array.isArray(marcas) &&
                marcas.map((marca) => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="equivalencia_ml"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Equivalencia (ml)
            </label>
            <input
              type="number"
              name="equivalencia_ml"
              id="equivalencia_ml"
              placeholder="Ej: 750"
              value={formData.equivalencia_ml}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
              required
              min="0" // No permitir negativos
            />
          </div>
          <div>
            <label
              htmlFor="prioridad_consumo"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Prioridad de Consumo
            </label>
            <input
              type="number"
              name="prioridad_consumo"
              id="prioridad_consumo"
              value={formData.prioridad_consumo}
              onChange={handleChange}
              min="1"
              step="1"
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
              required
            />
          </div>
          <div>
            <label
              htmlFor="alerta_stock_bajo"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Alerta de Stock Bajo (unidades)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="alerta_stock_bajo"
              id="alerta_stock_bajo"
              placeholder="Ej: 4.0"
              value={formData.alerta_stock_bajo}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
              required
            />
          </div>
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
}
