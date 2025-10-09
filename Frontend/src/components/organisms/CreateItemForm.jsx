import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { PackagePlus } from "lucide-react";

export default function CreateItemForm() {
  // 1. El estado del formulario ya no tiene 'nombre_item' ni 'ingrediente_id'.
  const [formData, setFormData] = useState({
    marca_id: "",
    equivalencia_ml: "",
    stock_unidades: "0",
    prioridad_consumo: "1",
    alerta_stock_bajo: "",
  });

  const [marcas, setMarcas] = useState([]); // El estado para guardar las marcas.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carga la lista de marcas para el selector.
  useEffect(() => {
    api
      .get("/admin/marcas")
      // 2. Corregimos el nombre del estado a 'setMarcas'.
      .then((response) => setMarcas(response.data))
      .catch((error) => toast.error("Error al obtener marcas."));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 3. Actualizamos la validación a los campos nuevos.
    if (
      !formData.marca_id ||
      !formData.equivalencia_ml ||
      !formData.alerta_stock_bajo
    ) {
      toast.error(
        "Por favor, completa la marca, la equivalencia y la alerta de stock."
      );
      return;
    }

    // Convertimos los valores a números antes de enviar.
    const payload = {
      ...formData,
      marca_id: parseInt(formData.marca_id),
      equivalencia_ml: parseFloat(formData.equivalencia_ml),
      stock_unidades: parseFloat(formData.stock_unidades),
      prioridad_consumo: parseInt(formData.prioridad_consumo),
      alerta_stock_bajo: parseFloat(formData.alerta_stock_bajo),
    };

    setIsSubmitting(true);
    const promise = api.post("/admin/stock-items", payload);

    toast.promise(promise, {
      loading: "Creando item de stock...",
      success: () => {
        setIsSubmitting(false);
        // 4. Actualizamos la limpieza del formulario.
        setFormData({
          marca_id: "",
          equivalencia_ml: "",
          stock_unidades: "0",
          prioridad_consumo: "1",
          alerta_stock_bajo: "",
        });
        return "¡Item de stock creado con éxito!";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Error al crear el item.";
      },
    });
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <PackagePlus className="text-sky-400" />
        Crear Nuevo Item de Stock (Envase)
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 5. ELIMINAMOS el campo de texto 'nombre_item' y lo reemplazamos por el selector de MARCA. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector de Marca */}
          <div>
            <label
              htmlFor="marca_id"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Marca del Producto
            </label>
            <select
              name="marca_id"
              value={formData.marca_id}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
            >
              <option value="">Selecciona una marca...</option>
              {marcas.map((marca) => (
                <option key={marca.id} value={marca.id}>
                  {marca.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Equivalencia (ml) */}
          <div>
            <label
              htmlFor="equivalencia_ml"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Equivalencia (ml)
            </label>
            <input
              type="number"
              name="equivalencia_ml"
              value={formData.equivalencia_ml}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
              placeholder="Ej: 750"
            />
          </div>

          {/* Stock Inicial */}
          <div>
            <label
              htmlFor="stock_unidades"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Stock Inicial (unidades)
            </label>
            <input
              type="number"
              step="0.01"
              name="stock_unidades"
              value={formData.stock_unidades}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
            />
          </div>

          {/* Prioridad de Consumo */}
          <div>
            <label
              htmlFor="prioridad_consumo"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Prioridad de Consumo
            </label>
            <input
              type="number"
              name="prioridad_consumo"
              value={formData.prioridad_consumo}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
            />
          </div>

          {/* Alerta de Stock Bajo */}
          <div>
            <label
              htmlFor="alerta_stock_bajo"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Alerta de Stock Bajo
            </label>
            <input
              type="number"
              step="0.01"
              name="alerta_stock_bajo"
              value={formData.alerta_stock_bajo}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
              placeholder="Ej: 4.0"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:ring-sky-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500"
          >
            {isSubmitting ? "Creando..." : "Crear Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
