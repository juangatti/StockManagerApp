// src/components/organisms/ItemForm.jsx
import { useState, useEffect } from "react";
import api from "../../api/api"; //
import toast from "react-hot-toast";
import { PackagePlus } from "lucide-react";

export default function ItemForm({ itemToEdit, onFormSubmit, onCancel }) {
  // Estado actualizado: renombrado equivalencia_ml, añadido unidad_medida, quitado prioridad_consumo
  const [formData, setFormData] = useState({
    marca_id: "",
    variacion: "",
    cantidad_por_envase: "", // <-- Nuevo nombre
    unidad_medida: "ml", // <-- Nuevo campo, default 'ml'
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
          /* ... manejo error formato ... */
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
  }, []);

  // Pre-llenar form (actualizado)
  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        marca_id: itemToEdit.marca_id || "",
        variacion: itemToEdit.variacion || "",
        cantidad_por_envase: itemToEdit.cantidad_por_envase || "", // <-- Nuevo nombre
        unidad_medida: itemToEdit.unidad_medida || "ml", // <-- Nuevo campo
        alerta_stock_bajo: itemToEdit.alerta_stock_bajo || "",
      });
    } else {
      // Resetear (actualizado)
      setFormData({
        marca_id: "",
        variacion: "",
        cantidad_por_envase: "", // <-- Nuevo nombre
        unidad_medida: "ml", // <-- Nuevo campo
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
    // Validación actualizada
    if (
      !formData.marca_id ||
      !formData.cantidad_por_envase ||
      !formData.unidad_medida || // <-- Validar unidad
      !formData.alerta_stock_bajo
    ) {
      toast.error(
        "La marca, cantidad por envase, unidad de medida y alerta de stock son obligatorios." // <-- Mensaje actualizado
      );
      return;
    }
    // Validar que cantidad sea número positivo
    const cantidadNum = parseFloat(formData.cantidad_por_envase);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      toast.error("La cantidad por envase debe ser un número positivo.");
      return;
    }

    setIsSubmitting(true);
    // Payload actualizado
    const payload = {
      marca_id: parseInt(formData.marca_id),
      variacion: formData.variacion.trim() || null,
      cantidad_por_envase: cantidadNum, // Enviar número validado
      unidad_medida: formData.unidad_medida, // Enviar 'ml' o 'g'
      alerta_stock_bajo: parseFloat(formData.alerta_stock_bajo),
    };
    const isEditing = !!itemToEdit?.id;

    // Llamada API (sin cambios en la ruta)
    const promise = isEditing
      ? api.put(`/admin/stock-items/${itemToEdit.id}`, payload) //
      : api.post("/admin/stock-items", payload); //

    toast.promise(promise, {
      loading: isEditing ? "Actualizando item..." : "Creando item...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit(); // Llama a la función del padre para refrescar/cerrar
        return `¡Item ${isEditing ? "actualizado" : "creado"} con éxito!`;
      },
      error: (err) => {
        setIsSubmitting(false);
        // Mostrar mensaje específico del backend si existe
        return err.response?.data?.message || "Ocurrió un error al guardar.";
      },
    });
  };

  // Clase común para inputs
  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500";

  // --- JSX ---
  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <PackagePlus className="text-sky-400" />
        {itemToEdit?.id ? "Editar Item de Stock" : "Crear Nuevo Item (Envase)"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Usaremos grid de 2 columnas ahora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Marca */}
          <div>
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
                    {" "}
                    {marca.nombre}{" "}
                  </option>
                ))}
            </select>
          </div>

          {/* Variación */}
          <div>
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

          {/* Cantidad por Envase */}
          <div>
            <label
              htmlFor="cantidad_por_envase"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Cantidad por Envase (*) {/* <-- Label actualizado */}
            </label>
            <input
              type="number"
              name="cantidad_por_envase"
              id="cantidad_por_envase" /* <-- name actualizado */
              placeholder="Ej: 750 ó 1000"
              value={formData.cantidad_por_envase}
              onChange={handleChange}
              className={commonInputClass}
              required
              min="0.001"
              step="any" // Permitir decimales
            />
          </div>

          {/* Unidad de Medida */}
          <div>
            <label
              htmlFor="unidad_medida"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Unidad de Medida (*) {/* <-- Nuevo campo */}
            </label>
            <select
              name="unidad_medida"
              id="unidad_medida"
              value={formData.unidad_medida}
              onChange={handleChange}
              className={commonInputClass}
              required
            >
              <option value="ml">ml (Mililitros)</option>
              <option value="g">g (Gramos)</option>
            </select>
          </div>

          {/* Alerta Stock Bajo */}
          <div>
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

          {/* Campo Vacío Opcional para alinear grid si hay 5 campos */}
          <div></div>
        </div>
        {/* Botones */}
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
