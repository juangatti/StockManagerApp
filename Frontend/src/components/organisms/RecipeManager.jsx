// src/components/organisms/RecipeManager.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { ClipboardPlus, Edit, Trash2 } from "lucide-react";
import RecipeForm from "./RecipeForm";

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

  const handleDelete = (productId, productName) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres desactivar el producto "${productName}"?`
      )
    ) {
      const promise = api.delete(`/admin/products/${productId}`);
      toast.promise(promise, {
        loading: "Desactivando...",
        success: () => {
          fetchProducts();
          return "Producto desactivado.";
        },
        error: (err) => err.response?.data?.message || "No se pudo desactivar.",
      });
    }
  };

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
          <ClipboardPlus className="mr-2 h-5 w-5" /> Crear Nueva Receta
        </button>
      </div>
      <ul className="divide-y divide-slate-700">
        {products.map((prod) => (
          <li key={prod.id} className="py-3 flex justify-between items-center">
            <span className="text-white">{prod.nombre_producto_fudo}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(prod)}
                className="p-2 rounded-md hover:bg-slate-700"
              >
                <Edit className="h-5 w-5 text-sky-400" />
              </button>
              <button
                onClick={() => handleDelete(prod.id, prod.nombre_producto_fudo)}
                className="p-2 rounded-md hover:bg-slate-700"
              >
                <Trash2 className="h-5 w-5 text-red-500 hover:text-red-400" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
