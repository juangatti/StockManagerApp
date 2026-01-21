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
    // *** CORRECCIÓN AQUÍ ***
    // Llamamos al nuevo endpoint que devuelve la lista completa de categorías
    api
      .get("/admin/categories/all")
      .then((res) => {
        // Verificamos que sea un array
        if (Array.isArray(res.data)) {
          setCategories(res.data); // Guardamos el array
        } else {
          console.error(
            "La respuesta de /admin/categories/all no es un array:",
            res.data,
          );
          setCategories([]);
          toast.error(
            "Error al cargar la lista de categorías (formato inesperado).",
          );
        }
      })
      .catch(() =>
        toast.error("No se pudieron cargar las categorías (error de red)."),
      );
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
    <div className="bg-surface p-8 rounded-lg shadow-(--shadow-card) border border-gray-200">
      <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-3 font-display uppercase tracking-wide border-b border-gray-50 pb-4">
        <BookPlus className="text-primary h-6 w-6" />
        {marcaToEdit?.id ? "Editar Marca" : "Crear Nueva Marca"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="marca-name"
              className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider"
            >
              Nombre de la Marca
            </label>
            <input
              type="text"
              id="marca-name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-white border border-gray-300 text-text-primary text-sm rounded-lg w-full p-2.5 focus:ring-primary focus:border-primary transition-all shadow-sm"
              placeholder="Ej: Fernet Branca"
            />
          </div>
          <div>
            <label
              htmlFor="categoria-id"
              className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider"
            >
              Categoría Padre
            </label>
            <select
              id="categoria-id"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="bg-white border border-gray-300 text-text-primary text-sm rounded-lg w-full p-2.5 focus:ring-primary focus:border-primary transition-all shadow-sm"
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
