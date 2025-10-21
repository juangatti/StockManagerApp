// src/components/organisms/PrebatchForm.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { CookingPot } from "lucide-react";

export default function PrebatchForm({
  prebatchToEdit,
  onFormSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    nombre_prebatch: "",
    fecha_produccion: "",
    cantidad_inicial_ml: "",
    identificador_lote: "", // Opcional
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prebatchToEdit) {
      setFormData({
        nombre_prebatch: prebatchToEdit.nombre_prebatch || "",
        fecha_produccion: prebatchToEdit.fecha_produccion
          ? new Date(prebatchToEdit.fecha_produccion)
              .toISOString()
              .split("T")[0] // Formato YYYY-MM-DD para input date
          : "",
        cantidad_inicial_ml: prebatchToEdit.cantidad_inicial_ml || "",
        identificador_lote: prebatchToEdit.identificador_lote || "",
      });
    } else {
      // Resetear para creación
      setFormData({
        nombre_prebatch: "",
        fecha_produccion: "",
        cantidad_inicial_ml: "",
        identificador_lote: "",
      });
    }
  }, [prebatchToEdit]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validación simple en frontend (el backend también valida)
    if (
      !formData.nombre_prebatch ||
      !formData.fecha_produccion ||
      !formData.cantidad_inicial_ml
    ) {
      toast.error(
        "Nombre, Fecha de Producción y Cantidad Inicial son obligatorios."
      );
      return;
    }

    setIsSubmitting(true);
    // Asegurarse de enviar números donde corresponda
    const payload = {
      ...formData,
      cantidad_inicial_ml: parseFloat(formData.cantidad_inicial_ml),
      identificador_lote: formData.identificador_lote || null, // Enviar null si está vacío
    };

    const promise = prebatchToEdit
      ? api.put(`/prebatches/${prebatchToEdit.id}`, payload)
      : api.post("/prebatches", payload); // Llama a la API correcta

    toast.promise(promise, {
      loading: "Guardando...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit(); // Llama a la función del padre para refrescar/cerrar
        return `Prebatch ${
          prebatchToEdit ? "actualizado" : "creado"
        } con éxito.`;
      },
      error: (err) => {
        setIsSubmitting(false);
        // Mostrar mensaje específico del backend si existe
        return (
          err.response?.data?.message ||
          `Error al ${prebatchToEdit ? "actualizar" : "crear"}.`
        );
      },
    });
  };

  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500";

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <CookingPot className="text-sky-400" />
        {prebatchToEdit ? "Editar Prebatch" : "Crear Nuevo Prebatch"}
      </h3>
      {/* --- FORMULARIO COMPLETO --- */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="nombre_prebatch"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Nombre del Prebatch
            </label>
            <input
              type="text"
              name="nombre_prebatch"
              id="nombre_prebatch"
              value={formData.nombre_prebatch}
              onChange={handleChange}
              className={commonInputClass}
              required
              placeholder="Ej: Old Fashioned"
            />
          </div>
          <div>
            <label
              htmlFor="fecha_produccion"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Fecha de Producción
            </label>
            <input
              type="date"
              name="fecha_produccion"
              id="fecha_produccion"
              value={formData.fecha_produccion}
              onChange={handleChange}
              className={commonInputClass}
              required
            />
          </div>
          <div>
            <label
              htmlFor="cantidad_inicial_ml"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Cantidad Inicial (ml)
            </label>
            <input
              type="number"
              name="cantidad_inicial_ml"
              id="cantidad_inicial_ml"
              value={formData.cantidad_inicial_ml}
              onChange={handleChange}
              className={commonInputClass}
              required
              min="0"
              step="1"
              placeholder="Ej: 5000"
            />
          </div>
          <div>
            <label
              htmlFor="identificador_lote"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Identificador Lote (Opcional)
            </label>
            <input
              type="text"
              name="identificador_lote"
              id="identificador_lote"
              value={formData.identificador_lote}
              onChange={handleChange}
              className={commonInputClass}
              placeholder="Ej: LOTE-001"
            />
          </div>
        </div>

        {/* --- Botones --- */}
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
            {isSubmitting
              ? "Guardando..."
              : prebatchToEdit
              ? "Actualizar Prebatch"
              : "Crear Prebatch"}
          </button>
        </div>
      </form>
    </div>
  );
}
