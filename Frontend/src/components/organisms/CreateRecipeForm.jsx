import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { ClipboardPlus, PlusCircle, XCircle } from "lucide-react";

export default function CreateRecipeForm() {
  // --- ESTADOS PARA LOS DATOS DE LA API ---
  const [ingredients, setIngredients] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  // --- ESTADOS DEL FORMULARIO ---
  const [productName, setProductName] = useState(""); // <-- Reemplaza al selector
  const [reglas, setReglas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Carga inicial de datos (ya no necesitamos los productos) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ingredientsRes, itemsRes] = await Promise.all([
          api.get("/admin/ingredients"),
          api.get("/stock"),
        ]);
        setIngredients(ingredientsRes.data);
        setStockItems(itemsRes.data);
      } catch (error) {
        console.error("Error al cargar datos para el formulario:", error);
        toast.error("No se pudieron cargar los datos necesarios.");
      }
    };
    fetchData();
  }, []);

  // --- MANEJADORES DE EVENTOS (la mayoría no cambian) ---
  const handleAddRegla = () => {
    setReglas([
      ...reglas,
      {
        id: Date.now(),
        ingrediente_id: "",
        item_id: "",
        consumo_ml: "",
        prioridad_item: "1",
      },
    ]);
  };

  const handleRemoveRegla = (id) => {
    setReglas(reglas.filter((regla) => regla.id !== id));
  };

  const handleReglaChange = (id, field, value) => {
    const newReglas = reglas.map((regla) => {
      if (regla.id === id) {
        const updatedRegla = { ...regla, [field]: value };
        if (field === "ingrediente_id") updatedRegla.item_id = "";
        return updatedRegla;
      }
      return regla;
    });
    setReglas(newReglas);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productName.trim() || reglas.length === 0) {
      toast.error(
        "El nombre del producto y al menos una regla son obligatorios."
      );
      return;
    }

    const payload = {
      nombre_producto_fudo: productName.trim(), // <-- Enviamos el nombre
      reglas: reglas.map(({ id, ...rest }) => ({
        ...rest,
        ingrediente_id: parseInt(rest.ingrediente_id),
        item_id: parseInt(rest.item_id),
        consumo_ml: parseFloat(rest.consumo_ml),
        prioridad_item: parseInt(rest.prioridad_item),
      })),
    };

    setIsSubmitting(true);
    const promise = api.post("/admin/recipes", payload);

    toast.promise(promise, {
      loading: "Creando producto y receta...",
      success: () => {
        setIsSubmitting(false);
        setProductName("");
        setReglas([]);
        return "¡Producto y receta guardados con éxito!";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Error al guardar.";
      },
    });
  };

  // --- RENDERIZADO ---
  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <ClipboardPlus className="text-sky-400" />
        Crear Producto y Receta
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input para el Nombre del Producto */}
        <div>
          <label
            htmlFor="productName"
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            Nombre del Nuevo Producto
          </label>
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ej: Cuba Libre"
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
          />
        </div>

        {/* ... (el resto del formulario para las reglas no cambia) ... */}
        <div className="space-y-4">
          {reglas.map((regla) => {
            const itemsFiltrados = stockItems.filter(
              (item) => item.ingrediente_id === parseInt(regla.ingrediente_id)
            );
            return (
              <div
                key={regla.id}
                className="grid grid-cols-12 gap-3 bg-slate-900 p-4 rounded-lg items-center"
              >
                <div className="col-span-3">
                  <select
                    value={regla.ingrediente_id}
                    onChange={(e) =>
                      handleReglaChange(
                        regla.id,
                        "ingrediente_id",
                        e.target.value
                      )
                    }
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
                  >
                    <option value="">Ingrediente...</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <select
                    value={regla.item_id}
                    onChange={(e) =>
                      handleReglaChange(regla.id, "item_id", e.target.value)
                    }
                    disabled={!regla.ingrediente_id}
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 disabled:opacity-50"
                  >
                    <option value="">Item específico...</option>
                    {itemsFiltrados.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre_item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Consumo (ml)"
                    value={regla.consumo_ml}
                    onChange={(e) =>
                      handleReglaChange(regla.id, "consumo_ml", e.target.value)
                    }
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Prioridad"
                    value={regla.prioridad_item}
                    onChange={(e) =>
                      handleReglaChange(
                        regla.id,
                        "prioridad_item",
                        e.target.value
                      )
                    }
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveRegla(regla.id)}
                  >
                    <XCircle className="text-red-500 hover:text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={handleAddRegla}
            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 font-medium text-sm"
          >
            <PlusCircle className="h-5 w-5" />
            Añadir Ingrediente
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:ring-sky-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500"
          >
            {isSubmitting ? "Guardando..." : "Guardar Producto y Receta"}
          </button>
        </div>
      </form>
    </div>
  );
}
