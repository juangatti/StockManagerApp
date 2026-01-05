import { useState, useEffect } from "react";
import api from "../../api/api";
import { Plus, Edit, Save, X, Truck, Trash2 } from "lucide-react";
import Spinner from "../atoms/Spinner";
import toast from "react-hot-toast";

export default function SupplierManager() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_info: "",
    tax_id: "",
  });

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/keg-management/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      contact_info: item.contact_info || "",
      tax_id: item.tax_id || "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: "",
      contact_info: "",
      tax_id: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        active: 1,
      };

      if (editingId) {
        await api.put(`/keg-management/suppliers/${editingId}`, payload);
        toast.success("Proveedor actualizado");
      } else {
        await api.post("/keg-management/suppliers", payload);
        toast.success("Proveedor creado");
      }
      fetchSuppliers();
      handleCancel();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error(
        error.response?.data?.message || "Error al guardar proveedor."
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este proveedor?")) return;
    try {
      await api.delete(`/keg-management/suppliers/${id}`);
      toast.success("Proveedor eliminado");
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Truck className="h-6 w-6 text-amber-500" />
        Gestión de Proveedores
      </h3>

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 bg-slate-700/50 p-4 rounded-lg border border-slate-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Nombre / Razón Social *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              placeholder="Ej: Distribuidora XYZ"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              CUIT / Tax ID
            </label>
            <input
              type="text"
              name="tax_id"
              value={formData.tax_id}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              placeholder="Ej: 20-12345678-9"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Contacto (Tel / Email)
            </label>
            <input
              type="text"
              name="contact_info"
              value={formData.contact_info}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              placeholder="Ej: Juan 11-1234-5678"
            />
          </div>
        </div>

        <div className="flex justify-end">
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
            {editingId ? "Actualizar Proveedor" : "Agregar Proveedor"}
          </button>
        </div>
      </form>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-700/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">CUIT / ID</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-700/30">
                <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                <td className="px-4 py-3 font-mono text-slate-400">
                  {s.tax_id || "-"}
                </td>
                <td className="px-4 py-3">{s.contact_info || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-1.5 bg-sky-500/10 text-sky-400 rounded hover:bg-sky-500 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No hay proveedores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
