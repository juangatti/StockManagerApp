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
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <FolderPlus className="text-sky-400" />
        {categoryToEdit?.id ? "Editar Categoría" : "Crear Nueva Categoría"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="category-name"
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            Nombre de la Categoría
          </label>
          <input
            type="text"
            id="category-name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
            placeholder="Ej: VINOS"
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
}
