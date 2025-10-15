// src/components/organisms/CategoryManager.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { FolderPlus, Edit, Trash2, RotateCcw, Eye, EyeOff } from "lucide-react"; // 1. Importamos los nuevos íconos
import CategoryForm from "./CategoryForm";

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingInactive, setViewingInactive] = useState(false); // 2. Estado para controlar el modo de vista

  // 3. La función de carga ahora depende de si vemos activos o inactivos
  const fetchCategories = () => {
    const endpoint = viewingInactive
      ? "/admin/categories/inactive"
      : "/admin/categories";
    api
      .get(endpoint)
      .then((res) => setCategories(res.data))
      .catch(() =>
        toast.error(
          `No se pudieron cargar las categorías ${
            viewingInactive ? "desactivadas" : "activas"
          }.`
        )
      );
  };

  // Vuelve a cargar los datos cada vez que cambiamos de modo
  useEffect(() => {
    fetchCategories();
  }, [viewingInactive]);

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
        error: "No se pudo desactivar.",
      });
    }
  };

  // 4. NUEVA FUNCIÓN para restaurar
  const handleRestore = (categoryId, categoryName) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres restaurar la categoría "${categoryName}"?`
      )
    ) {
      const promise = api.put(`/admin/categories/${categoryId}/restore`);
      toast.promise(promise, {
        loading: "Restaurando...",
        success: () => {
          fetchCategories();
          return "Categoría restaurada.";
        },
        error: "No se pudo restaurar.",
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

  // Si el formulario está visible, lo renderizamos y ocultamos la lista
  if (showForm) {
    return (
      <CategoryForm
        categoryToEdit={editingCategory}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  // Vista principal con la lista
  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          {viewingInactive ? "Categorías Desactivadas" : "Gestionar Categorías"}
        </h3>
        <div className="flex items-center gap-4">
          {/* 5. Botón para alternar entre la vista principal y la papelera */}
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
          {/* Solo mostramos el botón de crear en la vista de activos */}
          {!viewingInactive && (
            <button
              onClick={handleCreate}
              className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              <FolderPlus className="mr-2 h-5 w-5" /> Crear Nueva
            </button>
          )}
        </div>
      </div>
      <ul className="divide-y divide-slate-700">
        {categories.map((cat) => (
          <li key={cat.id} className="py-3 flex justify-between items-center">
            <span className="text-white">{cat.nombre}</span>
            <div className="flex items-center gap-2">
              {/* 6. Mostramos botones diferentes según el modo de vista */}
              {viewingInactive ? (
                <button
                  onClick={() => handleRestore(cat.id, cat.nombre)}
                  title="Restaurar"
                  className="p-2 rounded-md hover:bg-slate-700"
                >
                  <RotateCcw className="h-5 w-5 text-green-400" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(cat)}
                    title="Editar"
                    className="p-2 rounded-md hover:bg-slate-700"
                  >
                    <Edit className="h-5 w-5 text-sky-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.nombre)}
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
