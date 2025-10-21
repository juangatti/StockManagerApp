// src/components/organisms/PrebatchsManager.jsx
import { useState } from "react";
import { CookingPot } from "lucide-react";
import useAuthStore from "../../stores/useAuthStore";
import PrebatchForm from "./PrebatchForm";
import PrebatchesResume from "./PrebatchesResume";
import PrebatchesTable from "./PrebatchesTable";
import SearchBar from "../molecules/SearchBar";
import PaginationControls from "../molecules/PaginationControls";
import Alert from "../atoms/Alert";
import Spinner from "../atoms/Spinner";
import ViewSwitcher from "../molecules/ViewSwitcher"; // <-- 1. Importar ViewSwitcher
import { usePrebatchList } from "../../hooks/usePrebatchList";

export default function PrebatchManager() {
  const user = useAuthStore((state) => state.user);
  const [editingPrebatch, setEditingPrebatch] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState("resumen"); // <-- 2. Estado para la vista activa

  const {
    prebatches,
    pagination,
    loading,
    error,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    refreshList,
  } = usePrebatchList(15);

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
    refreshList();
    // Podríamos querer forzar el cambio a la vista de detalle si se crea/edita
    // setActiveView("detalle"); // Descomentar si se desea este comportamiento
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPrebatch(null);
  };

  const handleDeleteSuccess = () => {
    refreshList();
  };

  if (showForm) {
    return (
      <PrebatchForm
        prebatchToEdit={editingPrebatch}
        onFormSubmit={handleFormSubmit}
        onCancel={handleCancelForm}
      />
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white">Gestión de Prebatches</h2>

      {/* 3. Añadir ViewSwitcher */}
      <ViewSwitcher activeView={activeView} onViewChange={setActiveView} />

      {/* 4. Renderizado Condicional */}
      {activeView === "resumen" && (
        // Usamos una key que cambie si los datos se refrescan,
        // para asegurar que PrebatchesResume vuelva a buscar sus datos si es necesario.
        <PrebatchesResume key={`resume-${pagination?.totalPrebatches ?? 0}`} />
      )}

      {activeView === "detalle" && (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
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
          {/* Componentes de la vista detallada */}
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Buscar por nombre de prebatch..."
          />
          {error && <Alert message={error} />}
          {loading && prebatches.length === 0 && <Spinner />}
          <PrebatchesTable
            prebatches={prebatches}
            loading={loading}
            isAdmin={user.role === "admin"}
            onEdit={handleEdit}
            onDeleteSuccess={handleDeleteSuccess}
          />
          {!loading && pagination?.totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
