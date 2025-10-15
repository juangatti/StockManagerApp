import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { CookingPot, Edit, Trash2 } from "lucide-react";
import useAuthStore from "../../stores/useAuthStore";

// --- CORRECCIÓN DE RUTAS DE IMPORTACIÓN ---
// Usamos './' porque los archivos están en la misma carpeta 'organisms'
import PrebatchForm from "./PrebatchForm";
import PrebatchesResume from "./PrebatchesResume";
import PrebatchesTable from "./PrebatchesTable";

export default function PrebatchManager() {
  // O PrebatchsPage, según cómo lo hayas nombrado
  const user = useAuthStore((state) => state.user);
  const [editingPrebatch, setEditingPrebatch] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (prebatch) => {
    setEditingPrebatch(prebatch);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingPrebatch(null);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingPrebatch(null);
    setRefreshKey((oldKey) => oldKey + 1);
  };

  if (showForm) {
    return (
      <PrebatchForm
        prebatchToEdit={editingPrebatch}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white">Gestión de Prebatches</h2>
      <PrebatchesResume key={`resume-${refreshKey}`} />

      <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            Listado de Lotes Activos
          </h3>
          {user.role === "admin" && (
            <button
              onClick={handleCreate}
              className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              <CookingPot className="mr-2 h-5 w-5" /> Crear Nuevo Lote
            </button>
          )}
        </div>

        <PrebatchesTable
          key={`table-${refreshKey}`}
          isAdmin={user.role === "admin"}
          onEdit={handleEdit}
          refreshDependency={refreshKey} // Cambié el nombre de la prop para más claridad
        />
      </div>
    </div>
  );
}
