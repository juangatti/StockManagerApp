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
        error.response?.data?.message || "Error al guardar proveedor.",
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
    <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-200">
      <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-3 font-display uppercase tracking-wide border-b border-gray-50 pb-4">
        <Truck className="h-6 w-6 text-primary" />
        Gestión de Proveedores
      </h3>

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="mb-10 bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Nombre / Razón Social *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-text-primary text-sm focus:ring-primary focus:border-primary transition-all shadow-sm"
              placeholder="Ej: Distribuidora XYZ"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              CUIT / Tax ID
            </label>
            <input
              type="text"
              name="tax_id"
              value={formData.tax_id}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-text-primary text-sm focus:ring-primary focus:border-primary transition-all shadow-sm"
              placeholder="Ej: 20-12345678-9"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Contacto (Tel / Email)
            </label>
            <input
              type="text"
              name="contact_info"
              value={formData.contact_info}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-text-primary text-sm focus:ring-primary focus:border-primary transition-all shadow-sm"
              placeholder="Ej: Juan 11-1234-5678"
            />
          </div>
        </div>

        <div className="flex justify-end">
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="mr-2 px-6 py-2.5 text-text-muted hover:text-text-primary font-bold uppercase text-xs tracking-widest transition-colors"
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
            {editingId ? "Actualizar Proveedor" : "Agregar Proveedor"}
          </button>
        </div>
      </form>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
        <table className="w-full text-left text-sm text-text-secondary">
          <thead className="bg-gray-50 text-xs uppercase text-text-muted font-bold tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">CUIT / ID</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-text-primary font-display uppercase tracking-tight">
                  {s.name}
                </td>
                <td className="px-6 py-4 font-mono text-text-muted font-medium">
                  {s.tax_id || "-"}
                </td>
                <td className="px-6 py-4 text-text-secondary font-medium">
                  {s.contact_info || "-"}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted hover:text-primary"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors text-text-muted hover:text-primary"
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
                  className="px-6 py-12 text-center text-text-muted italic font-medium"
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
