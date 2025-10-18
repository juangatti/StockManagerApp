import { useState } from "react";
import { CookingPot } from "lucide-react";
import useAuthStore from "../../stores/useAuthStore";
import PrebatchForm from "./PrebatchForm";
import PrebatchesResume from "./PrebatchesResume";
import PrebatchesTable from "./PrebatchesTable";
import SearchBar from "../molecules/SearchBar"; // Importar
import PaginationControls from "../molecules/PaginationControls"; // Importar
import Alert from "../atoms/Alert"; // Importar
import Spinner from "../atoms/Spinner"; // Importar
import { usePrebatchList } from "../../hooks/usePrebatchList"; // 1. Importar el nuevo hook

export default function PrebatchManager() {
  const user = useAuthStore((state) => state.user);
  const [editingPrebatch, setEditingPrebatch] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // 2. Usar el hook para manejar la lista
  const {
    prebatches,
    pagination,
    loading,
    error,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    refreshList, // Función para refrescar
  } = usePrebatchList(15); // 15 items por página

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
    refreshList(); // 3. Refrescar la lista después de submit
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPrebatch(null);
  };

  const handleDeleteSuccess = () => {
    refreshList(); // 4. Refrescar la lista después de eliminar
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
      {/* El resumen puede necesitar su propio refresh o una key basada en refreshList */}
      <PrebatchesResume key={`resume-${pagination?.totalPrebatches}`} />

      <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
        {" "}
        {/* Ajuste de padding */}
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
        {/* 5. Añadir SearchBar */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Buscar por nombre de prebatch..."
        />
        {error && <Alert message={error} />}
        {loading && prebatches.length === 0 && <Spinner />}
        {/* 6. Pasar datos a PrebatchesTable */}
        <PrebatchesTable
          prebatches={prebatches}
          loading={loading} // Pasamos el estado de carga
          isAdmin={user.role === "admin"}
          onEdit={handleEdit}
          onDeleteSuccess={handleDeleteSuccess} // Pasamos la función de refresco
        />
        {/* 7. Añadir PaginationControls */}
        {!loading && pagination?.totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
