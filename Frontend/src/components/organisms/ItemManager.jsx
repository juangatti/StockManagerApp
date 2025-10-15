// src/components/organisms/ItemManager.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { PackagePlus, Edit, Trash2 } from "lucide-react";
import useStockStore from "../../stores/useStockStore";
import ItemForm from "./ItemForm"; // <-- Importamos el formulario

export default function ItemManager() {
  const { stockItems, fetchStock } = useStockStore();
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleDelete = (itemId, itemName) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres desactivar el item "${itemName}"?`
      )
    ) {
      const promise = api.delete(`/admin/stock-items/${itemId}`);
      toast.promise(promise, {
        loading: "Desactivando...",
        success: () => {
          fetchStock();
          return "Item desactivado.";
        },
        error: (err) => err.response?.data?.message || "No se pudo desactivar.",
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };
  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };
  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchStock();
  };

  if (showForm) {
    return (
      <ItemForm
        itemToEdit={editingItem}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          Gestionar Items (Envases)
        </h3>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          <PackagePlus className="mr-2 h-5 w-5" /> Crear Nuevo
        </button>
      </div>
      <ul className="divide-y divide-slate-700">
        {stockItems.map((item) => (
          <li key={item.id} className="py-3 flex justify-between items-center">
            <div>
              <span className="text-white">{item.nombre_completo}</span>
              <span className="text-xs text-slate-400 ml-2 bg-slate-700 px-2 py-1 rounded-full">
                {item.nombre_categoria}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="p-2 rounded-md hover:bg-slate-700"
              >
                <Edit className="h-5 w-5 text-sky-400" />
              </button>
              <button
                onClick={() => handleDelete(item.id, item.nombre_completo)}
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
