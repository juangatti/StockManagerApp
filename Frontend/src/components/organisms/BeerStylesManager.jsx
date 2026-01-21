import { useState, useEffect } from "react";
import api from "../../api/api";
import { Plus, Edit, Save, X, Beer, Trash2 } from "lucide-react";
import Spinner from "../atoms/Spinner";
import toast from "react-hot-toast";

export default function BeerStylesManager() {
  const [styles, setStyles] = useState([]);
  const [glassware, setGlassware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    fantasy_name: "",
    description: "",
    ibu_min: "",
    ibu_max: "",
    abv_min: "",
    abv_max: "",
    glassware_id: "",
  });

  const fetchData = async () => {
    try {
      const [stylesRes, glassRes] = await Promise.all([
        api.get("/keg-management/styles"),
        api.get("/keg-management/glassware"),
      ]);
      setStyles(stylesRes.data);
      setGlassware(glassRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      fantasy_name: item.fantasy_name || "",
      description: item.description_default || "",
      ibu_min: item.ibu_default || "", // Mapping default single values to forms if needed, or adjusting logic
      // Note: Data model has ibu_default/abv_default single values, but UI had min/max.
      // Assuming 'ibu_default' is the target value. The previous UI had min/max but controller has 'ibu_default'.
      // I will simplify strictly to what controller expects: ibu_default, abv_default.
      ibu_default: item.ibu_default || "",
      abv_default: item.abv_default || "",
      glassware_id: item.glassware_id || "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: "",
      fantasy_name: "",
      description: "",
      ibu_default: "",
      abv_default: "",
      glassware_id: "",
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
        name: formData.name,
        fantasy_name: formData.fantasy_name,
        description_default: formData.description,
        ibu_default: formData.ibu_default,
        abv_default: formData.abv_default,
        glassware_id: formData.glassware_id
          ? parseInt(formData.glassware_id)
          : null,
        active: 1,
      };

      if (editingId) {
        await api.put(`/keg-management/styles/${editingId}`, payload);
        toast.success("Estilo actualizado");
      } else {
        await api.post("/keg-management/styles", payload);
        toast.success("Estilo creado");
      }
      fetchData();
      handleCancel();
    } catch (error) {
      console.error("Error saving style:", error);
      toast.error("Error al guardar estilo.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este estilo?")) return;
    try {
      await api.delete(`/keg-management/styles/${id}`);
      toast.success("Estilo eliminado");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-100">
      <h3 className="text-xl font-bold text-text-primary mb-6 font-display uppercase tracking-wide border-b border-gray-50 pb-4">
        Gestión de Estilos de Cerveza
      </h3>

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-inner"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
              Nombre Técnico *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="Ej: IPA"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
              Nombre de Fantasía
            </label>
            <input
              type="text"
              name="fantasy_name"
              value={formData.fantasy_name}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="Ej: 'Lupulada Mortal'"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
              Cristalería Recomendada
            </label>
            <select
              name="glassware_id"
              value={formData.glassware_id}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm cursor-pointer"
            >
              <option value="">-- Seleccionar Vaso --</option>
              {glassware.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.capacity_ml}ml)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
              IBU Default
            </label>
            <input
              type="number"
              name="ibu_default"
              value={formData.ibu_default}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
              ABV Default %
            </label>
            <input
              type="number"
              name="abv_default"
              value={formData.abv_default}
              onChange={handleChange}
              step="0.1"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
              Descripción Default
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100 mt-4">
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
            {editingId ? "Actualizar Estilo" : "Agregar Estilo"}
          </button>
        </div>
      </form>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
        <table className="w-full text-left text-sm text-text-secondary">
          <thead className="bg-gray-50 text-xs uppercase text-text-muted font-display font-bold tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-5 py-4">Nombre</th>
              <th className="px-5 py-4">Fantasía</th>
              <th className="px-5 py-4">IBU/ABV</th>
              <th className="px-5 py-4">Cristalería</th>
              <th className="px-5 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {styles.map((style) => (
              <tr
                key={style.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="font-bold text-text-primary font-display uppercase tracking-tight">
                    {style.name}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5 max-w-[200px] italic">
                    {style.description_default}
                  </div>
                </td>
                <td className="px-5 py-4 text-primary font-bold italic font-display">
                  {style.fantasy_name || "-"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <span className="bg-green-50 px-2 py-0.5 rounded text-green-700 border border-green-100 text-xs font-bold">
                      {style.ibu_default || "?"} IBU
                    </span>
                    <span className="bg-blue-50 px-2 py-0.5 rounded text-blue-700 border border-blue-100 text-xs font-bold">
                      {style.abv_default || "?"}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 font-medium text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <Beer className="h-3.5 w-3.5 text-primary" />
                    {style.recommended_glass || "-"}
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(style)}
                      className="p-2 text-text-muted hover:text-primary hover:bg-red-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(style.id)}
                      className="p-2 text-text-muted hover:text-primary hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {styles.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="px-5 py-12 text-center text-text-muted font-medium italic"
                >
                  No hay estilos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
