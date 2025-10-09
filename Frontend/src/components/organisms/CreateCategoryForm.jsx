// src/components/organisms/CreateCategoryForm.jsx
import { useState } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { FolderPlus } from "lucide-react";

export default function CreateCategoryForm() {
  const [nombre, setNombre] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre de la categoría no puede estar vacío.");
      return;
    }
    const payload = { nombre: nombre.trim() };
    setIsSubmitting(true);
    const promise = api.post("/admin/categories", payload);

    toast.promise(promise, {
      loading: "Creando categoría...",
      success: () => {
        setIsSubmitting(false);
        setNombre("");
        return "¡Categoría creada con éxito!";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Error al crear la categoría.";
      },
    });
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <FolderPlus className="text-sky-400" />
        Crear Nueva Categoría
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
            placeholder="Ej: APERITIVOS"
          />
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:ring-sky-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500"
          >
            {isSubmitting ? "Creando..." : "Crear Categoría"}
          </button>
        </div>
      </form>
    </div>
  );
}
