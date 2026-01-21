// src/components/organisms/CategoryForm.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { FolderPlus } from "lucide-react";

export default function CategoryForm({
  categoryToEdit,
  onFormSubmit,
  onCancel,
}) {
  const [nombre, setNombre] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNombre(categoryToEdit?.nombre || "");
  }, [categoryToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre de la categoría no puede estar vacío.");
      return;
    }

    setIsSubmitting(true);
    const payload = { nombre: nombre.trim() };
    const isEditing = !!categoryToEdit?.id;

    const promise = isEditing
      ? api.put(`/admin/categories/${categoryToEdit.id}`, payload)
      : api.post("/admin/categories", payload);

    toast.promise(promise, {
      loading: isEditing ? "Actualizando categoría..." : "Creando categoría...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit();
        return `¡Categoría ${isEditing ? "actualizada" : "creada"} con éxito!`;
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Ocurrió un error al guardar.";
      },
    });
  };

  return (
    <div className="bg-surface p-8 rounded-lg shadow-(--shadow-card) border border-gray-200">
      <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-3 font-display uppercase tracking-wide border-b border-gray-50 pb-4">
        <FolderPlus className="text-primary h-6 w-6" />
        {categoryToEdit?.id ? "Editar Categoría" : "Crear Nueva Categoría"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="category-name"
            className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider"
          >
            Nombre de la Categoría
          </label>
          <input
            type="text"
            id="category-name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="bg-white border border-gray-300 text-text-primary text-sm rounded-lg w-full p-2.5 focus:ring-primary focus:border-primary transition-all shadow-sm"
            placeholder="Ej: VINOS"
          />
        </div>
        <div className="flex justify-end pt-4 gap-4 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="text-text-muted hover:text-text-primary px-6 py-2.5 font-bold uppercase text-xs tracking-widest transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-bold transition-all flex items-center shadow-lg shadow-red-500/10 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
