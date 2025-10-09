// src/components/organisms/RecipeManager.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { ClipboardPlus, Edit, PlusCircle, XCircle } from "lucide-react";
import useStockStore from "../../stores/useStockStore";

// --- Componente interno para el Formulario de Recetas (CON ESTILOS RESTAURADOS) ---
const RecipeForm = ({ recipeToEdit, onFormSubmit, onCancel }) => {
  const [productName, setProductName] = useState("");
  const [reglas, setReglas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const { stockItems, fetchStock } = useStockStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [marcasRes] = await Promise.all([
          api.get("/admin/marcas"),
          fetchStock(),
        ]);
        setMarcas(marcasRes.data);
      } catch (error) {
        toast.error("No se pudieron cargar los datos para el formulario.");
      }
    };
    loadData();
  }, [fetchStock]);

  useEffect(() => {
    if (recipeToEdit) {
      setProductName(recipeToEdit.product.nombre_producto_fudo);
      setReglas(
        recipeToEdit.reglas.map((r) => ({
          ...r,
          tempId: Date.now() + Math.random(),
        }))
      );
    } else {
      setProductName("");
      setReglas([]);
    }
  }, [recipeToEdit]);

  const handleAddRegla = () =>
    setReglas([
      ...reglas,
      {
        tempId: Date.now(),
        marca_id: "",
        item_id: "",
        consumo_ml: "",
        prioridad_item: "1",
      },
    ]);
  const handleRemoveRegla = (tempId) =>
    setReglas(reglas.filter((r) => r.tempId !== tempId));
  const handleReglaChange = (tempId, field, value) => {
    setReglas(
      reglas.map((r) => {
        if (r.tempId === tempId) {
          const updated = { ...r, [field]: value };
          if (field === "marca_id") updated.item_id = "";
          return updated;
        }
        return r;
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productName.trim() || reglas.length === 0) {
      toast.error(
        "El nombre del producto y al menos una regla son obligatorios."
      );
      return;
    }
    setIsSubmitting(true);
    const payload = {
      nombre_producto_fudo: productName.trim(),
      reglas: reglas.map(({ tempId, ...rest }) => rest),
    };
    const isEditing = !!recipeToEdit?.product.id;
    const promise = isEditing
      ? api.put(`/admin/recipes/${recipeToEdit.product.id}`, payload)
      : api.post("/admin/recipes", payload);
    toast.promise(promise, {
      loading: isEditing ? "Actualizando receta..." : "Creando receta...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit();
        return `¡Receta ${isEditing ? "actualizada" : "creada"} con éxito!`;
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
        <ClipboardPlus className="text-sky-400" />
        {recipeToEdit ? "Editar Receta" : "Crear Producto y Receta"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Nombre del Producto (Ej: Cuba Libre)"
          className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5"
        />
        <div className="space-y-4">
          {reglas.map((regla) => {
            const itemsFiltrados = stockItems.filter(
              (item) => item.marca_id === parseInt(regla.marca_id)
            );
            const commonInputClass =
              "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5";
            return (
              <div
                key={regla.tempId}
                className="grid grid-cols-12 gap-3 bg-slate-900 p-4 rounded-lg items-center"
              >
                <select
                  value={regla.marca_id}
                  onChange={(e) =>
                    handleReglaChange(regla.tempId, "marca_id", e.target.value)
                  }
                  className={`col-span-3 ${commonInputClass}`}
                >
                  <option value="">Selecciona Marca...</option>
                  {marcas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={regla.item_id}
                  onChange={(e) =>
                    handleReglaChange(regla.tempId, "item_id", e.target.value)
                  }
                  disabled={!regla.marca_id}
                  className={`col-span-4 ${commonInputClass} disabled:opacity-50`}
                >
                  <option value="">Selecciona Envase...</option>
                  {itemsFiltrados.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre_completo}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={regla.consumo_ml}
                  onChange={(e) =>
                    handleReglaChange(
                      regla.tempId,
                      "consumo_ml",
                      e.target.value
                    )
                  }
                  placeholder="Consumo (ml)"
                  className={`col-span-2 ${commonInputClass}`}
                />
                <input
                  type="number"
                  value={regla.prioridad_item}
                  onChange={(e) =>
                    handleReglaChange(
                      regla.tempId,
                      "prioridad_item",
                      e.target.value
                    )
                  }
                  placeholder="Prioridad"
                  className={`col-span-2 ${commonInputClass}`}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveRegla(regla.tempId)}
                  className="col-span-1 flex justify-center"
                >
                  <XCircle className="text-red-500 hover:text-red-400" />
                </button>
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
            <PlusCircle className="h-5 w-5" /> Añadir Marca
          </button>
          <div className="flex gap-4">
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
              {isSubmitting ? "Guardando..." : "Guardar Receta"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// --- Componente Principal del Gestor (CON ESTILOS RESTAURADOS) ---
export default function RecipeManager() {
  const [products, setProducts] = useState([]);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchProducts = () => {
    api
      .get("/admin/products")
      .then((res) => setProducts(res.data))
      .catch(() => toast.error("No se pudieron cargar los productos."));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    api
      .get(`/admin/recipes/${product.id}`)
      .then((res) => {
        setEditingRecipe(res.data);
        setShowForm(true);
      })
      .catch(() => toast.error("No se pudo cargar la receta para editar."));
  };

  const handleCreate = () => {
    setEditingRecipe(null);
    setShowForm(true);
  };
  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingRecipe(null);
    fetchProducts();
  };

  if (showForm) {
    return (
      <RecipeForm
        recipeToEdit={editingRecipe}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">Gestionar Recetas</h3>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          <ClipboardPlus className="mr-2 h-5 w-5" />
          Crear Nueva Receta
        </button>
      </div>
      <ul className="divide-y divide-slate-700">
        {products.map((prod) => (
          <li key={prod.id} className="py-3 flex justify-between items-center">
            <span className="text-white">{prod.nombre_producto_fudo}</span>
            <button
              onClick={() => handleEdit(prod)}
              className="p-2 rounded-md hover:bg-slate-700"
            >
              <Edit className="h-5 w-5 text-sky-400" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
