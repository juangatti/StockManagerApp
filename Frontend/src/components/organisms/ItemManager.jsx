// src/components/organisms/ItemManager.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import {
  PackagePlus,
  Edit,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import useStockStore from "../../stores/useStockStore";
import ItemForm from "./ItemForm";

export default function ItemManager() {
  // Usamos el store global como nuestra fuente de verdad para los items activos
  const { stockItems, fetchStock } = useStockStore();
  const [inactiveItems, setInactiveItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingInactive, setViewingInactive] = useState(false);

  const fetchInactiveItems = () => {
    api
      .get("/admin/stock-items/inactive")
      .then((res) => setInactiveItems(res.data))
      .catch(() =>
        toast.error("No se pudieron cargar los items desactivados.")
      );
  };

  useEffect(() => {
    if (viewingInactive) {
      fetchInactiveItems();
    } else {
      fetchStock(); // Para la vista activa, usamos la función del store
    }
  }, [viewingInactive, fetchStock]);

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
        error: "No se pudo desactivar.",
      });
    }
  };

  const handleRestore = (itemId, itemName) => {
    if (
      window.confirm(`¿Seguro que quieres restaurar el item "${itemName}"?`)
    ) {
      const promise = api.put(`/admin/stock-items/${itemId}/restore`);
      toast.promise(promise, {
        loading: "Restaurando...",
        success: () => {
          fetchInactiveItems();
          return "Item restaurado.";
        },
        error: "No se pudo restaurar.",
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

  const itemsToList = viewingInactive ? inactiveItems : stockItems;

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          {viewingInactive ? "Items Desactivados" : "Gestionar Items (Envases)"}
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewingInactive(!viewingInactive)}
            title={viewingInactive ? "Ver activos" : "Ver desactivados"}
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
              <PackagePlus className="mr-2 h-5 w-5" /> Crear Nuevo
            </button>
          )}
        </div>
      </div>
      <ul className="divide-y divide-slate-700">
        {itemsToList.map((item) => (
          <li key={item.id} className="py-3 flex justify-between items-center">
            <div>
              <span className="text-white">{item.nombre_completo}</span>
              <span className="text-xs text-slate-400 ml-2 bg-slate-700 px-2 py-1 rounded-full">
                {item.nombre_categoria}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {viewingInactive ? (
                <button
                  onClick={() => handleRestore(item.id, item.nombre_completo)}
                  title="Restaurar"
                  className="p-2 rounded-md hover:bg-slate-700"
                >
                  <RotateCcw className="h-5 w-5 text-green-400" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(item)}
                    title="Editar"
                    className="p-2 rounded-md hover:bg-slate-700"
                  >
                    <Edit className="h-5 w-5 text-sky-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.nombre_completo)}
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
