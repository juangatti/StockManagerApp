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
    identificador_lote: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prebatchToEdit) {
      setFormData({
        nombre_prebatch: prebatchToEdit.nombre_prebatch || "",
        // Formatear la fecha para el input tipo 'date'
        fecha_produccion: prebatchToEdit.fecha_produccion
          ? new Date(prebatchToEdit.fecha_produccion)
              .toISOString()
              .split("T")[0]
          : "",
        cantidad_inicial_ml: prebatchToEdit.cantidad_inicial_ml || "",
        identificador_lote: prebatchToEdit.identificador_lote || "",
      });
    } else {
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
    setIsSubmitting(true);
    const promise = prebatchToEdit
      ? api.put(`/prebatches/${prebatchToEdit.id}`, formData)
      : api.post("/prebatches", formData);

    toast.promise(promise, {
      loading: "Guardando...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit();
        return "Prebatch guardado con éxito.";
      },
      error: () => {
        setIsSubmitting(false);
        return "Error al guardar.";
      },
    });
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <CookingPot className="text-sky-400" />
        {prebatchToEdit ? "Editar Prebatch" : "Crear Nuevo Prebatch"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... (Aquí irían los inputs para el formulario, similar a los otros ...Form.jsx) ... */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
