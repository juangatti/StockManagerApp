// src/components/organisms/CreateMarcaForm.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { BookPlus } from "lucide-react";

export default function CreateMarcaForm() {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !categoriaId) {
      toast.error("El nombre y la categoría son obligatorios.");
      return;
    }
    const payload = {
      nombre: nombre.trim(),
      categoria_id: parseInt(categoriaId),
    };
    setIsSubmitting(true);
    const promise = api.post("/admin/marcas", payload);

    toast.promise(promise, {
      loading: "Creando marca...",
      success: () => {
        setIsSubmitting(false);
        setNombre("");
        setCategoriaId("");
        return "¡Marca creada con éxito!";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Error al crear la marca.";
      },
    });
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <BookPlus className="text-sky-400" />
        Crear Nueva Marca
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
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:ring-sky-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500"
          >
            {isSubmitting ? "Creando..." : "Crear Marca"}
          </button>
        </div>
      </form>
    </div>
  );
}
