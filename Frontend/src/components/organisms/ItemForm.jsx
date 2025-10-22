// src/components/organisms/ItemForm.jsx
import { useState, useEffect } from "react";
import api from "../../api/api"; //
import toast from "react-hot-toast";
import { PackagePlus } from "lucide-react";

export default function ItemForm({ itemToEdit, onFormSubmit, onCancel }) {
  // Estado sin prioridad_consumo
  const [formData, setFormData] = useState({
    marca_id: "",
    variacion: "",
    equivalencia_ml: "",
    // prioridad_consumo: "1", // <-- Eliminado
    alerta_stock_bajo: "",
  });
  const [marcas, setMarcas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar marcas (sin cambios)
  useEffect(() => {
    api
      .get("/admin/marcas/all") //
      .then((res) => {
        if (Array.isArray(res.data)) {
          setMarcas(res.data);
        } else {
          console.error(/* ... */);
          setMarcas([]);
          toast.error(/* ... */);
        }
      })
      .catch(() => toast.error(/* ... */));
  }, []);

  // Pre-llenar form (sin prioridad_consumo)
  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        marca_id: itemToEdit.marca_id || "",
        variacion: itemToEdit.variacion || "",
        equivalencia_ml: itemToEdit.equivalencia_ml || "",
        // prioridad_consumo: itemToEdit.prioridad_consumo || "1", // <-- Eliminado
        alerta_stock_bajo: itemToEdit.alerta_stock_bajo || "",
      });
    } else {
      // Resetear (sin prioridad_consumo)
      setFormData({
        marca_id: "",
        variacion: "",
        equivalencia_ml: "",
        // prioridad_consumo: "1", // <-- Eliminado
        alerta_stock_bajo: "",
      });
    }
  }, [itemToEdit]);

  const handleChange = (e) => {
    /* ... (sin cambios) ... */
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validación (sin prioridad_consumo)
    if (
      !formData.marca_id ||
      !formData.equivalencia_ml ||
      !formData.alerta_stock_bajo
      // !formData.prioridad_consumo // <-- Eliminado
    ) {
      toast.error(
        "La marca, equivalencia y alerta de stock son obligatorios." // <-- Mensaje actualizado
      );
      return;
    }

    setIsSubmitting(true);
    // Payload (sin prioridad_consumo)
    const payload = {
      ...formData,
      marca_id: parseInt(formData.marca_id),
      variacion: formData.variacion.trim() || null,
      equivalencia_ml: parseFloat(formData.equivalencia_ml),
      // prioridad_consumo: parseInt(formData.prioridad_consumo) || 1, // <-- Eliminado
      alerta_stock_bajo: parseFloat(formData.alerta_stock_bajo),
    };
    const isEditing = !!itemToEdit?.id;

    // Llamada API (sin cambios)
    const promise = isEditing
      ? api.put(`/admin/stock-items/${itemToEdit.id}`, payload) //
      : api.post("/admin/stock-items", payload); //

    toast.promise(promise, {
      /* ... (sin cambios) ... */
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

  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500";

  // --- JSX ---
  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        {/* ... (título sin cambios) ... */}
        <PackagePlus className="text-sky-400" />
        {itemToEdit?.id ? "Editar Item de Stock" : "Crear Nuevo Item (Envase)"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ajustar grid a 2 columnas si queda mejor sin el campo de prioridad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {" "}
          {/* <-- Cambiado a 2 columnas */}
          {/* Marca */}
          <div>
            {/* ... (código de Marca sin cambios) ... */}
            <label
              htmlFor="marca_id"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Marca del Producto (*)
            </label>
            <select
              name="marca_id"
              id="marca_id"
              value={formData.marca_id}
              onChange={handleChange}
              className={commonInputClass}
              required
            >
              <option value="">Selecciona una marca...</option>
              {Array.isArray(marcas) &&
                marcas.map((marca) => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </option>
                ))}
            </select>
          </div>
          {/* Variación */}
          <div>
            {/* ... (código de Variación sin cambios) ... */}
            <label
              htmlFor="variacion"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Variación (Opcional)
            </label>
            <input
              type="text"
              name="variacion"
              id="variacion"
              placeholder="Ej: Pera, Classic, Reposado"
              value={formData.variacion}
              onChange={handleChange}
              className={commonInputClass}
            />
          </div>
          {/* Equivalencia */}
          <div>
            {/* ... (código de Equivalencia sin cambios) ... */}
            <label
              htmlFor="equivalencia_ml"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Equivalencia (ml) (*)
            </label>
            <input
              type="number"
              name="equivalencia_ml"
              id="equivalencia_ml"
              placeholder="Ej: 750"
              value={formData.equivalencia_ml}
              onChange={handleChange}
              className={commonInputClass}
              required
              min="0"
              step="0.01"
            />
          </div>
          {/* Alerta Stock */}
          <div>
            {/* ... (código de Alerta Stock sin cambios) ... */}
            <label
              htmlFor="alerta_stock_bajo"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Alerta Stock Bajo (unid.) (*)
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
              className={commonInputClass}
              required
            />
          </div>
          {/* Prioridad Consumo - ELIMINADO */}
          {/*
          <div>
            <label htmlFor="prioridad_consumo" ...>Prioridad Consumo (*)</label>
            <input type="number" name="prioridad_consumo" ... />
          </div>
          */}
        </div>
        {/* Botones (sin cambios) */}
        <div className="flex justify-end pt-2 gap-4">
          {/* ... (botones Cancelar y Guardar) ... */}
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
