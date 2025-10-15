// src/components/organisms/MarcaManager.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { BookPlus, Edit, Trash2 } from "lucide-react";
import MarcaForm from "./MarcaForm"; // <-- Importamos el formulario

export default function MarcaManager() {
  const [marcas, setMarcas] = useState([]);
  const [editingMarca, setEditingMarca] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchMarcas = () => {
    api
      .get("/admin/marcas")
      .then((res) => setMarcas(res.data))
      .catch(() => toast.error("No se pudieron cargar las marcas."));
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  const handleDelete = (marcaId, marcaName) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres desactivar la marca "${marcaName}"?`
      )
    ) {
      const promise = api.delete(`/admin/marcas/${marcaId}`);
      toast.promise(promise, {
        loading: "Desactivando...",
        success: () => {
          fetchMarcas();
          return "Marca desactivada.";
        },
        error: (err) => err.response?.data?.message || "No se pudo desactivar.",
      });
    }
  };

  const handleEdit = (marca) => {
    setEditingMarca(marca);
    setShowForm(true);
  };
  const handleCreate = () => {
    setEditingMarca(null);
    setShowForm(true);
  };
  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingMarca(null);
    fetchMarcas();
  };

  if (showForm) {
    return (
      <MarcaForm
        marcaToEdit={editingMarca}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">Gestionar Marcas</h3>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          <BookPlus className="mr-2 h-5 w-5" /> Crear Nueva
        </button>
      </div>
      <ul className="divide-y divide-slate-700">
        {marcas.map((marca) => (
          <li key={marca.id} className="py-3 flex justify-between items-center">
            <div>
              <span className="text-white">{marca.nombre}</span>
              <span className="text-xs text-slate-400 ml-2 bg-slate-700 px-2 py-1 rounded-full">
                {marca.categoria_nombre}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(marca)}
                className="p-2 rounded-md hover:bg-slate-700"
              >
                <Edit className="h-5 w-5 text-sky-400" />
              </button>
              <button
                onClick={() => handleDelete(marca.id, marca.nombre)}
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
