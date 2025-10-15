// src/components/organisms/RecipeManager.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import {
  ClipboardPlus,
  Edit,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import RecipeForm from "./RecipeForm";

export default function RecipeManager() {
  const [products, setProducts] = useState([]);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingInactive, setViewingInactive] = useState(false);

  const fetchProducts = () => {
    const endpoint = viewingInactive
      ? "/admin/products/inactive"
      : "/admin/products";
    api
      .get(endpoint)
      .then((res) => setProducts(res.data))
      .catch(() => toast.error("No se pudieron cargar los productos."));
  };

  useEffect(() => {
    fetchProducts();
  }, [viewingInactive]);

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

  const handleRestore = (productId, productName) => {
    if (
      window.confirm(
        `¿Seguro que quieres restaurar el producto "${productName}"?`
      )
    ) {
      const promise = api.put(`/admin/products/${productId}/restore`);
      toast.promise(promise, {
        loading: "Restaurando...",
        success: () => {
          fetchProducts();
          return "Producto restaurado.";
        },
        error: "No se pudo restaurar.",
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
        <h3 className="text-xl font-semibold text-white">
          {viewingInactive ? "Recetas Desactivadas" : "Gestionar Recetas"}
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewingInactive(!viewingInactive)}
            title={viewingInactive ? "Ver activas" : "Ver desactivadas"}
            className="flex items-center gap-2 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700"
          >
            {viewingInactive ? (
              <Eye className="h-5 w-5" />
            ) : (
              <EyeOff className="h-5 w-5" />
            )}
          </button>
          {!viewingInactive && (
            <button
              onClick={handleCreate}
              className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              <ClipboardPlus className="mr-2 h-5 w-5" /> Crear Nueva Receta
            </button>
          )}
        </div>
      </div>
      <ul className="divide-y divide-slate-700">
        {products.map((prod) => (
          <li key={prod.id} className="py-3 flex justify-between items-center">
            <span className="text-white">{prod.nombre_producto_fudo}</span>
            <div className="flex items-center gap-2">
              {viewingInactive ? (
                <button
                  onClick={() =>
                    handleRestore(prod.id, prod.nombre_producto_fudo)
                  }
                  title="Restaurar"
                  className="p-2 rounded-md hover:bg-slate-700"
                >
                  <RotateCcw className="h-5 w-5 text-green-400" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(prod)}
                    title="Editar"
                    className="p-2 rounded-md hover:bg-slate-700"
                  >
                    <Edit className="h-5 w-5 text-sky-400" />
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(prod.id, prod.nombre_producto_fudo)
                    }
                    title="Desactivar"
                    className="p-2 rounded-md hover:bg-slate-700"
                  >
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
