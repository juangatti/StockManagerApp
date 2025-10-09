import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { ClipboardPlus, PlusCircle, XCircle } from "lucide-react";

export default function CreateRecipeForm() {
  // 1. ESTADOS PARA LOS DATOS: 'ingredients' se cambia por 'marcas'
  const [marcas, setMarcas] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  // --- ESTADOS DEL FORMULARIO ---
  const [productName, setProductName] = useState("");
  const [reglas, setReglas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. CARGA DE DATOS: Pedimos '/admin/marcas' en lugar de '/admin/ingredients'
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marcasRes, itemsRes] = await Promise.all([
          api.get("/admin/marcas"),
          api.get("/stock"),
        ]);
        setMarcas(marcasRes.data);
        setStockItems(itemsRes.data);
      } catch (error) {
        toast.error(
          "No se pudieron cargar los datos necesarios para las recetas."
        );
      }
    };
    fetchData();
  }, []);

  // --- MANEJADORES DE EVENTOS ---
  const handleAddRegla = () => {
    setReglas([
      ...reglas,
      {
        id: Date.now(),
        // 3. La nueva regla usa 'marca_id'
        marca_id: "",
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
        // 4. Si cambia la marca, se resetea el item.
        if (field === "marca_id") updatedRegla.item_id = "";
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
      nombre_producto_fudo: productName.trim(),
      // 5. El payload ahora envía 'marca_id'
      reglas: reglas.map(({ id, ...rest }) => ({
        ...rest,
        marca_id: parseInt(rest.marca_id),
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

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <ClipboardPlus className="text-sky-400" />
        Crear Producto y Receta
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
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
            placeholder="Ej: Fernet con Coca"
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
          />
        </div>

        <div className="space-y-4">
          {reglas.map((regla) => {
            // 6. La lógica de filtrado ahora usa 'marca_id'
            const itemsFiltrados = stockItems.filter(
              (item) => item.marca_id === parseInt(regla.marca_id)
            );
            return (
              <div
                key={regla.id}
                className="grid grid-cols-12 gap-3 bg-slate-900 p-4 rounded-lg items-center"
              >
                {/* Selector de Marca */}
                <div className="col-span-3">
                  <select
                    value={regla.marca_id}
                    onChange={(e) =>
                      handleReglaChange(regla.id, "marca_id", e.target.value)
                    }
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
                  >
                    <option value="">Selecciona Marca...</option>
                    {marcas.map((marca) => (
                      <option key={marca.id} value={marca.id}>
                        {marca.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Selector de Item (Envase) */}
                <div className="col-span-4">
                  <select
                    value={regla.item_id}
                    onChange={(e) =>
                      handleReglaChange(regla.id, "item_id", e.target.value)
                    }
                    disabled={!regla.marca_id}
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 disabled:opacity-50"
                  >
                    <option value="">Selecciona Envase...</option>
                    {itemsFiltrados.map((item) => (
                      // 7. Mostramos el 'nombre_completo' que ahora viene del backend
                      <option key={item.id} value={item.id}>
                        {item.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Resto de los campos (no cambian) */}
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
            Añadir Marca a la Receta
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
