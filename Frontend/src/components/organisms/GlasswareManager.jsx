import { useState, useEffect } from "react";
import api from "../../api/api";
import { Plus, Edit, Trash, Save, X } from "lucide-react";
import Spinner from "../atoms/Spinner";

export default function GlasswareManager() {
  const [glassware, setGlassware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    capacity_ml: "",
    total_quantity: 0,
    min_stock: 0,
  });

  const fetchGlassware = async () => {
    try {
      const response = await api.get("/keg-management/glassware");
      setGlassware(response.data);
    } catch (error) {
      console.error("Error fetching glassware:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlassware();
  }, []);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      capacity_ml: item.capacity_ml,
      total_quantity: item.total_quantity,
      min_stock: item.min_stock || 0,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", capacity_ml: "", total_quantity: 0, min_stock: 0 });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update logic (Not implemented in controller yet, assuming CREATE only for now based on prompt history, but let's be safe. User asked for "create section")
        // NOTE: Controller currently only has create. I will implement create here properly.
        // If edit is needed, I'll need to update controller. For now, I'll focus on CREATE and LIST.
        alert("Edición no implementada aún en backend.");
      } else {
        await api.post("/keg-management/glassware", {
          ...formData,
          current_stock: formData.total_quantity, // Initialize stock = total
        });
        fetchGlassware();
      }
      handleCancel();
    } catch (error) {
      console.error("Error saving glassware:", error);
      alert("Error al guardar.");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">
        Gestión de Cristalería
      </h3>

      {/* FORMULARIO DE CREACIÓN */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 bg-slate-700/50 p-4 rounded-lg border border-slate-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nombre</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              placeholder="Ej: Pinta Americana"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Capacidad (ml)
            </label>
            <input
              type="number"
              name="capacity_ml"
              value={formData.capacity_ml}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              placeholder="473"
              step="0.1"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Stock Inicial
            </label>
            <input
              type="number"
              name="total_quantity"
              value={formData.total_quantity}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Stock Mínimo
            </label>
            <input
              type="number"
              name="min_stock"
              value={formData.min_stock}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              placeholder="10"
              required
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="mr-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              <X className="inline-block h-4 w-4 mr-1" /> Cancelar
            </button>
          )}
          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded font-medium transition-colors flex items-center"
          >
            {editingId ? (
              <Save className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {editingId ? "Actualizar" : "Agregar Cristalería"}
          </button>
        </div>
      </form>

      {/* TABLA DE LISTADO */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-700 text-slate-100 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3 text-right">Capacidad</th>
              <th className="px-4 py-3 text-right">Stock Actual</th>
              <th className="px-4 py-3 text-right">Stock Mínimo</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {glassware.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-white">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-right">{item.capacity_ml} ml</td>
                <td className="px-4 py-3 text-right font-mono text-white">
                  {item.current_stock}
                </td>
                <td className="px-4 py-3 text-right text-slate-400">
                  {item.min_stock}
                </td>
                <td className="px-4 py-3 flex justify-center gap-2">
                  {/*  <button onClick={() => handleEdit(item)} className="p-1 text-slate-400 hover:text-sky-400 transition-colors">
                    <Edit className="h-4 w-4" />
                  </button> */}
                  {/* Delete not implemented yet */}
                  <span className="text-xs text-slate-600 select-none">
                    No actions
                  </span>
                </td>
              </tr>
            ))}
            {glassware.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No hay cristalería registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
