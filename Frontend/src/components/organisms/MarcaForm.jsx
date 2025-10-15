// src/components/organisms/MarcaForm.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { BookPlus } from "lucide-react";

export default function MarcaForm({ marcaToEdit, onFormSubmit, onCancel }) {
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/admin/categories")
      .then((res) => setCategories(res.data))
      .catch(() => toast.error("No se pudieron cargar las categorías."));
  }, []);

  useEffect(() => {
    setNombre(marcaToEdit?.nombre || "");
    setCategoriaId(marcaToEdit?.categoria_id || "");
  }, [marcaToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !categoriaId) {
      toast.error("El nombre y la categoría son obligatorios.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      nombre: nombre.trim(),
      categoria_id: parseInt(categoriaId),
    };
    const isEditing = !!marcaToEdit?.id;

    const promise = isEditing
      ? api.put(`/admin/marcas/${marcaToEdit.id}`, payload)
      : api.post("/admin/marcas", payload);

    toast.promise(promise, {
      loading: isEditing ? "Actualizando marca..." : "Creando marca...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit();
        return `¡Marca ${isEditing ? "actualizada" : "creada"} con éxito!`;
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
        <BookPlus className="text-sky-400" />
        {marcaToEdit?.id ? "Editar Marca" : "Crear Nueva Marca"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="marca-name"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Nombre de la Marca
            </label>
            <input
              type="text"
              id="marca-name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
              placeholder="Ej: Fernet Branca"
            />
          </div>
          <div>
            <label
              htmlFor="categoria-id"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Categoría Padre
            </label>
            <select
              id="categoria-id"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
            >
              <option value="">Selecciona una categoría...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
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
