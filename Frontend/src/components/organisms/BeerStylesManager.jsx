import { useState, useEffect } from "react";
import api from "../../api/api";
import { Plus, Edit, Save, X, Beer } from "lucide-react";
import Spinner from "../atoms/Spinner";

export default function BeerStylesManager() {
  const [styles, setStyles] = useState([]);
  const [glassware, setGlassware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
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
      description: item.description || "",
      ibu_min: item.ibu_min || "",
      ibu_max: item.ibu_max || "",
      abv_min: item.abv_min || "",
      abv_max: item.abv_max || "",
      glassware_id: item.glassware_id || "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      ibu_min: "",
      ibu_max: "",
      abv_min: "",
      abv_max: "",
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
        ...formData,
        glassware_id: formData.glassware_id
          ? parseInt(formData.glassware_id)
          : null,
      };

      if (editingId) {
        await api.put(`/keg-management/styles/${editingId}`, payload);
      } else {
        await api.post("/keg-management/styles", payload);
      }
      fetchData();
      handleCancel();
    } catch (error) {
      console.error("Error saving style:", error);
      alert("Error al guardar estilo.");
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
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">
              Nombre del Estilo
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              placeholder="Ej: IPA, Stout"
              required
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
            <label className="block text-xs text-slate-400 mb-1">IBU Min</label>
            <input
              type="number"
              name="ibu_min"
              value={formData.ibu_min}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">IBU Max</label>
            <input
              type="number"
              name="ibu_max"
              value={formData.ibu_max}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              ABV Min %
            </label>
            <input
              type="number"
              name="abv_min"
              value={formData.abv_min}
              onChange={handleChange}
              step="0.1"
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              ABV Max %
            </label>
            <input
              type="number"
              name="abv_max"
              value={formData.abv_max}
              onChange={handleChange}
              step="0.1"
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs text-slate-400 mb-1">
              Descripción
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

      {/* LISTADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {styles.map((style) => (
          <div
            key={style.id}
            className="bg-slate-700 p-4 rounded-lg flex flex-col justify-between border border-slate-600 hover:border-sky-500/50 transition-colors"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-bold text-white">{style.name}</h4>
                <button
                  onClick={() => handleEdit(style)}
                  className="p-1 text-slate-400 hover:text-sky-400"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                {style.description}
              </p>
              <div className="text-xs text-slate-300 grid grid-cols-2 gap-2 mb-2">
                <div>
                  IBU:{" "}
                  <span className="text-white font-mono">
                    {style.ibu_min}-{style.ibu_max}
                  </span>
                </div>
                <div>
                  ABV:{" "}
                  <span className="text-white font-mono">
                    {style.abv_min}-{style.abv_max}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 text-sky-200 text-xs flex items-center bg-sky-900/30 p-2 rounded">
              <Beer className="h-3 w-3 mr-2" />
              {style.recommended_glass || "Sin cristaleria asignada"}
            </div>
          </div>
        ))}
        {styles.length === 0 && (
          <p className="col-span-full text-center text-slate-500 py-8">
            No hay estilos registrados.
          </p>
        )}
      </div>
    </div>
  );
}
