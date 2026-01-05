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
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">
        Gestión de Estilos de Cerveza
      </h3>

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 bg-slate-700/50 p-4 rounded-lg border border-slate-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-1">
            <label className="block text-xs text-slate-400 mb-1">
              Nombre Técnico *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              placeholder="Ej: IPA"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-slate-400 mb-1">
              Nombre de Fantasía
            </label>
            <input
              type="text"
              name="fantasy_name"
              value={formData.fantasy_name}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              placeholder="Ej: 'Lupulada Mortal'"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">
              Cristalería Recomendada
            </label>
            <select
              name="glassware_id"
              value={formData.glassware_id}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
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
            <label className="block text-xs text-slate-400 mb-1">
              IBU Default
            </label>
            <input
              type="number"
              name="ibu_default"
              value={formData.ibu_default}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              ABV Default %
            </label>
            <input
              type="number"
              name="abv_default"
              value={formData.abv_default}
              onChange={handleChange}
              step="0.1"
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs text-slate-400 mb-1">
              Descripción Default
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            ></textarea>
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
            {editingId ? "Actualizar Estilo" : "Agregar Estilo"}
          </button>
        </div>
      </form>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-700/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Fantasía</th>
              <th className="px-4 py-3">IBU/ABV</th>
              <th className="px-4 py-3">Cristalería</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {styles.map((style) => (
              <tr key={style.id} className="hover:bg-slate-700/30">
                <td className="px-4 py-3 font-medium text-white">
                  {style.name}
                  <div className="text-xs text-slate-500 truncate max-w-[200px]">
                    {style.description_default}
                  </div>
                </td>
                <td className="px-4 py-3 text-sky-300 font-medium">
                  {style.fantasy_name || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 text-xs">
                    <span className="bg-slate-700 px-1.5 py-0.5 rounded text-green-400 border border-green-500/20">
                      {style.ibu_default || "?"} IBU
                    </span>
                    <span className="bg-slate-700 px-1.5 py-0.5 rounded text-blue-400 border border-blue-500/20">
                      {style.abv_default || "?"}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Beer className="h-3 w-3 text-amber-500" />
                    {style.recommended_glass || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(style)}
                      className="p-1.5 bg-sky-500/10 text-sky-400 rounded hover:bg-sky-500 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(style.id)}
                      className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors"
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
                  className="px-4 py-8 text-center text-slate-500"
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
