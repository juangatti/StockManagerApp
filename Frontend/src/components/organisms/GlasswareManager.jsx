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
    <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-100">
      <h3 className="text-xl font-bold text-text-primary mb-6 font-display uppercase tracking-wide border-b border-gray-50 pb-4">
        Gestión de Cristalería
      </h3>

      {/* FORMULARIO DE CREACIÓN */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-inner"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
              Nombre
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="Ej: Pinta Americana"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
              Capacidad (ml)
            </label>
            <input
              type="number"
              name="capacity_ml"
              value={formData.capacity_ml}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="473"
              step="0.1"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
              Stock Inicial
            </label>
            <input
              type="number"
              name="total_quantity"
              value={formData.total_quantity}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
              Stock Mínimo
            </label>
            <input
              type="number"
              name="min_stock"
              value={formData.min_stock}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="10"
              required
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end pt-4 border-t border-gray-100">
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="mr-3 px-6 py-2 text-text-muted hover:text-text-primary transition-colors font-bold uppercase text-xs tracking-widest"
            >
              <X className="inline-block h-4 w-4 mr-1" /> Cancelar
            </button>
          )}
          <button
            type="submit"
            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-bold transition-all flex items-center shadow-lg shadow-red-500/10 uppercase tracking-widest text-sm"
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
      <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
        <table className="w-full text-left text-sm text-text-secondary">
          <thead className="bg-gray-50 text-text-muted text-xs uppercase font-display font-bold tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-5 py-4">Nombre</th>
              <th className="px-5 py-4 text-right">Capacidad</th>
              <th className="px-5 py-4 text-right">Stock Actual</th>
              <th className="px-5 py-4 text-right">Stock Mínimo</th>
              <th className="px-5 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {glassware.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-5 py-4 font-bold text-text-primary font-display uppercase tracking-tight">
                  {item.name}
                </td>
                <td className="px-5 py-4 text-right font-medium">
                  {item.capacity_ml} ml
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold text-text-primary">
                  {item.current_stock}
                </td>
                <td className="px-5 py-4 text-right text-text-muted font-medium">
                  {item.min_stock}
                </td>
                <td className="px-5 py-4 flex justify-center gap-2">
                  <span className="text-xs text-text-muted italic select-none font-medium">
                    No actions
                  </span>
                </td>
              </tr>
            ))}
            {glassware.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="px-5 py-12 text-center text-text-muted font-medium italic"
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
