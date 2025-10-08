import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { PackagePlus } from "lucide-react";

export default function CreateItemForm() {
  const [formData, setFormData] = useState({
    nombre_item: "",
    ingrediente_id: "",
    equivalencia_ml: "",
    stock_unidades: "0",
    prioridad_consumo: "1",
    alerta_stock_bajo: "",
  });

  const [ingredientes, setIngredientes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Al cargar, obtenemos la lista de ingredientes para el selector
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/admin/ingredients")
      .then((response) => setIngredientes(response.data))
      .catch((error) => console.error("Error al obtener ingredientes:", error));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación
    if (
      !formData.nombre_item ||
      !formData.ingrediente_id ||
      !formData.equivalencia_ml ||
      !formData.alerta_stock_bajo
    ) {
      toast.error("Por favor, completa todos los campos obligatorios.");
      return;
    }

    const payload = {
      ...formData,
      ingrediente_id: parseInt(formData.ingrediente_id),
      equivalencia_ml: parseFloat(formData.equivalencia_ml),
      stock_unidades: parseFloat(formData.stock_unidades),
      prioridad_consumo: parseInt(formData.prioridad_consumo),
      alerta_stock_bajo: parseFloat(formData.alerta_stock_bajo),
    };

    setIsSubmitting(true);
    const promise = axios.post(
      "http://localhost:5000/api/admin/stock-items",
      payload
    );

    toast.promise(promise, {
      loading: "Creando item de stock...",
      success: () => {
        setIsSubmitting(false);
        // Limpiar formulario
        setFormData({
          nombre_item: "",
          ingrediente_id: "",
          equivalencia_ml: "",
          stock_unidades: "0",
          prioridad_consumo: "1",
          alerta_stock_bajo: "",
        });
        // Opcional: podríamos querer recargar la lista de ingredientes si uno nuevo se crea
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
        Crear Nuevo Item de Stock
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre del Item */}
          <div>
            <label
              htmlFor="nombre_item"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Nombre del Item Físico
            </label>
            <input
              type="text"
              name="nombre_item"
              value={formData.nombre_item}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
              placeholder="Ej: Botella Fernet 750ml"
            />
          </div>

          {/* Ingrediente Padre */}
          <div>
            <label
              htmlFor="ingrediente_id"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Ingrediente Padre
            </label>
            <select
              name="ingrediente_id"
              value={formData.ingrediente_id}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
            >
              <option value="">Selecciona un ingrediente...</option>
              {ingredientes.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Equivalencia y Stock Inicial */}
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

          {/* Prioridad y Alerta */}
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
