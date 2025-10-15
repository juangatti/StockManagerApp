// src/components/organisms/CategoryManager.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { FolderPlus, Edit, Trash2 } from "lucide-react";
import CategoryForm from "./CategoryForm"; // <-- 1. Importamos el formulario separado

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchCategories = () => {
    api
      .get("/admin/categories")
      .then((res) => setCategories(res.data))
      .catch(() => toast.error("No se pudieron cargar las categorías."));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = (categoryId, categoryName) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres desactivar la categoría "${categoryName}"?`
      )
    ) {
      const promise = api.delete(`/admin/categories/${categoryId}`);
      toast.promise(promise, {
        loading: "Desactivando...",
        success: () => {
          fetchCategories();
          return "Categoría desactivada.";
        },
        error: (err) => err.response?.data?.message || "No se pudo desactivar.",
      });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingCategory(null);
    fetchCategories();
  };

  // 2. La lógica de renderizado ahora es más simple
  if (showForm) {
    return (
      <CategoryForm
        categoryToEdit={editingCategory}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          Gestionar Categorías
        </h3>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          <FolderPlus className="mr-2 h-5 w-5" />
          Crear Nueva
        </button>
      </div>
      <ul className="divide-y divide-slate-700">
        {categories.map((cat) => (
          <li key={cat.id} className="py-3 flex justify-between items-center">
            <span className="text-white">{cat.nombre}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(cat)}
                className="p-2 rounded-md hover:bg-slate-700"
              >
                <Edit className="h-5 w-5 text-sky-400" />
              </button>
              <button
                onClick={() => handleDelete(cat.id, cat.nombre)}
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
