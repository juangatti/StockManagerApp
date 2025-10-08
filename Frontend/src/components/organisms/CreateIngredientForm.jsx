import { useState } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { BookPlus } from "lucide-react";

export default function CreateIngredientForm() {
  const [nombre, setNombre] = useState("");
  const [agruparTotales, setAgruparTotales] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre del ingrediente no puede estar vacío.");
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      agrupar_totales: agruparTotales,
    };

    setIsSubmitting(true);
    const promise = api.post("/admin/ingredients", payload);

    toast.promise(promise, {
      loading: "Creando ingrediente...",
      success: () => {
        setIsSubmitting(false);
        setNombre(""); // Limpiar el formulario
        return "¡Ingrediente creado con éxito!";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Error al crear el ingrediente.";
      },
    });
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <BookPlus className="text-sky-400" />
        Crear Nuevo Ingrediente
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="ingredient-name"
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            Nombre del Ingrediente
          </label>
          <input
            type="text"
            id="ingredient-name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
            placeholder="Ej: Ron Dorado"
          />
        </div>
        <div className="flex items-center">
          <input
            id="agrupar-totales"
            type="checkbox"
            checked={agruparTotales}
            onChange={(e) => setAgruparTotales(e.target.checked)}
            className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500"
          />
          <label
            htmlFor="agrupar-totales"
            className="ml-2 text-sm font-medium text-slate-300"
          >
            Agrupar totales para este ingrediente en el resumen
          </label>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:ring-sky-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500"
          >
            {isSubmitting ? "Creando..." : "Crear Ingrediente"}
          </button>
        </div>
      </form>
    </div>
  );
}
