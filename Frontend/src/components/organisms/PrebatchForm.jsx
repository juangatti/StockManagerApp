// src/components/organisms/PrebatchForm.jsx
import { useState, useEffect } from "react"; // Asegúrate que useEffect esté importado
import api from "../../api/api";
import toast from "react-hot-toast";
import { CookingPot } from "lucide-react";
import Spinner from "../atoms/Spinner";

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
    // 1. Añadir categoria_id al estado inicial
    categoria_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 2. Estado para nombres existentes y categorías
  const [existingNames, setExistingNames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingDependencies, setLoadingDependencies] = useState(true); // Para cargar nombres y categorías

  // 3. useEffect para cargar nombres existentes y categorías
  useEffect(() => {
    const loadDependencies = async () => {
      setLoadingDependencies(true);
      try {
        const [namesRes, categoriesRes] = await Promise.all([
          api.get("/prebatches/names"), // Endpoint para nombres
          api.get("/admin/categories/all"), // Endpoint para categorías
        ]);
        setExistingNames(Array.isArray(namesRes.data) ? namesRes.data : []);
        setCategories(
          Array.isArray(categoriesRes.data) ? categoriesRes.data : []
        );
      } catch (error) {
        console.error("Error loading dependencies for prebatch form:", error);
        toast.error("No se pudieron cargar nombres o categorías existentes.");
        setExistingNames([]);
        setCategories([]);
      } finally {
        setLoadingDependencies(false);
      }
    };
    loadDependencies();
  }, []); // Cargar solo al montar

  useEffect(() => {
    if (prebatchToEdit) {
      setFormData({
        nombre_prebatch: prebatchToEdit.nombre_prebatch || "",
        fecha_produccion: prebatchToEdit.fecha_produccion
          ? new Date(prebatchToEdit.fecha_produccion)
              .toISOString()
              .split("T")[0]
          : "",
        cantidad_inicial_ml: prebatchToEdit.cantidad_inicial_ml || "",
        identificador_lote: prebatchToEdit.identificador_lote || "",
        // 4. Pre-rellenar categoría si existe en el objeto a editar
        categoria_id: prebatchToEdit.categoria_id || "",
      });
    } else {
      setFormData({
        nombre_prebatch: "",
        fecha_produccion: "",
        cantidad_inicial_ml: "",
        identificador_lote: "",
        // 5. Resetear categoría
        categoria_id: "",
      });
    }
  }, [prebatchToEdit]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
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
    const payload = {
      ...formData,
      cantidad_inicial_ml: parseFloat(formData.cantidad_inicial_ml),
      identificador_lote: formData.identificador_lote || null,
      // 6. Añadir categoria_id al payload (asegurarse que sea null si está vacío)
      categoria_id: formData.categoria_id
        ? parseInt(formData.categoria_id)
        : null,
    };

    const isEditing = !!prebatchToEdit?.id; // Determinar si es edición

    // Solo usar PUT si es edición
    const promise = isEditing
      ? api.put(`/prebatches/${prebatchToEdit.id}`, payload)
      : api.post("/prebatches", payload);

    toast.promise(promise, {
      loading: "Guardando...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit();
        return `Prebatch ${isEditing ? "actualizado" : "creado"} con éxito.`;
      },
      error: (err) => {
        setIsSubmitting(false);
        return (
          err.response?.data?.message ||
          `Error al ${isEditing ? "actualizar" : "crear"}.`
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
      {loadingDependencies ? (
        <Spinner />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre con Datalist */}
          <div>
            <label
              htmlFor="nombre_prebatch"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Nombre del Prebatch (*)
            </label>
            <input
              type="text"
              name="nombre_prebatch"
              id="nombre_prebatch"
              value={formData.nombre_prebatch}
              onChange={handleChange}
              className={commonInputClass}
              required
              placeholder="Ej: Old Fashioned, Almibar Simple"
              // 7. Asociar con datalist solo si estamos creando
              list={!prebatchToEdit ? "existing-prebatch-names" : undefined}
              autoComplete="off" // Evitar autocompletado del navegador no deseado
            />
            {/* 8. Datalist solo para creación */}
            {!prebatchToEdit && (
              <datalist id="existing-prebatch-names">
                {existingNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha Producción */}
            <div>
              <label
                htmlFor="fecha_produccion"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Fecha de Producción (*)
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
            {/* Cantidad Inicial */}
            <div>
              <label
                htmlFor="cantidad_inicial_ml"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Cantidad Inicial (ml) (*)
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
            {/* Identificador Lote */}
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
            {/* 9. Selector de Categoría (Opcional) */}
            <div>
              <label
                htmlFor="categoria_id"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Categoría (Opcional)
              </label>
              <select
                name="categoria_id"
                id="categoria_id"
                value={formData.categoria_id}
                onChange={handleChange}
                className={commonInputClass}
              >
                <option value="">-- Sin categoría --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
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
              {isSubmitting
                ? "Guardando..."
                : prebatchToEdit
                ? "Actualizar Prebatch"
                : "Crear Prebatch"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
