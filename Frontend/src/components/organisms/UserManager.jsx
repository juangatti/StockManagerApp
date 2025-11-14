// Frontend/src/components/organisms/UserManager.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { UserPlus, Edit, Trash2, RotateCcw, Eye, EyeOff } from "lucide-react";
import UserForm from "./UserForm";
import SearchBar from "../molecules/SearchBar";
import PaginationControls from "../molecules/PaginationControls";
import Spinner from "../atoms/Spinner";
import Alert from "../atoms/Alert";
import { useDebounce } from "../../hooks/useDebounce";

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null); // Solo guardamos el ID
  const [showForm, setShowForm] = useState(false);
  const [viewingInactive, setViewingInactive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationData, setPaginationData] = useState({});

  const debouncedSearch = useDebounce(searchQuery, 300);
  const previousViewingInactive = useRef(viewingInactive);

  // Hook para cargar usuarios (activos o inactivos)
  const fetchUsers = useCallback(async (page, search, inactiveMode) => {
    setLoading(true);
    setError(null);
    const endpoint = inactiveMode ? "/admin/users/inactive" : "/admin/users";
    try {
      const response = await api.get(endpoint, {
        params: { page, limit: 15, search },
      });
      setUsers(response.data.users);
      setPaginationData(response.data.pagination);
    } catch (err) {
      toast.error(`No se pudieron cargar los usuarios.`);
      setError(
        `Error al cargar usuarios: ${err.message || "Error desconocido"}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto para recargar al cambiar página, búsqueda o modo
  useEffect(() => {
    const isSearchChanged = searchQuery !== debouncedSearch;
    const isModeChanged = viewingInactive !== previousViewingInactive.current;
    const pageToFetch = isSearchChanged || isModeChanged ? 1 : currentPage;

    if (pageToFetch === 1 && currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchUsers(pageToFetch, debouncedSearch, viewingInactive);
    }
    previousViewingInactive.current = viewingInactive;
  }, [viewingInactive, currentPage, debouncedSearch, fetchUsers, searchQuery]);

  const refreshCurrentView = useCallback(() => {
    fetchUsers(currentPage, debouncedSearch, viewingInactive);
  }, [currentPage, debouncedSearch, viewingInactive, fetchUsers]);

  // Handlers para acciones (Soft Delete)
  const handleDelete = (userId, username) => {
    if (
      window.confirm(`¿Estás seguro de desactivar al usuario "${username}"?`)
    ) {
      const promise = api.delete(`/admin/users/${userId}`);
      toast.promise(promise, {
        loading: "Desactivando...",
        success: () => {
          refreshCurrentView();
          return "Usuario desactivado.";
        },
        error: (err) => err.response?.data?.message || "No se pudo desactivar.",
      });
    }
  };

  const handleRestore = (userId, username) => {
    if (window.confirm(`¿Seguro que quieres restaurar a "${username}"?`)) {
      const promise = api.put(`/admin/users/${userId}/restore`);
      toast.promise(promise, {
        loading: "Restaurando...",
        success: () => {
          refreshCurrentView();
          return "Usuario restaurado.";
        },
        error: "No se pudo restaurar.",
      });
    }
  };

  // Handlers para el formulario
  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingUserId(null);
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      refreshCurrentView();
    }
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingUserId(null);
    setShowForm(true);
  };

  // Renderizado
  if (showForm) {
    return (
      <UserForm
        userIdToEdit={editingUserId}
        onFormSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          {viewingInactive ? "Usuarios Desactivados" : "Gestionar Equipo"}
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewingInactive(!viewingInactive)}
            title={viewingInactive ? "Ver activos" : "Ver desactivados"}
            className="flex items-center gap-2 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700"
          >
            {viewingInactive ? (
              <Eye className="h-5 w-5" />
            ) : (
              <EyeOff className="h-5 w-5" />
            )}
          </button>
          {!viewingInactive && (
            <button
              onClick={handleCreate}
              className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              <UserPlus className="mr-2 h-5 w-5" /> Crear Usuario
            </button>
          )}
        </div>
      </div>

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Buscar por usuario, nombre..."
      />

      {error && <Alert message={error} />}
      {loading && users.length === 0 && <Spinner />}

      <div className="min-h-[300px] relative">
        {loading && users.length > 0 && (
          <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center z-10">
            <Spinner />
          </div>
        )}
        {!loading && users.length === 0 ? (
          <p className="text-center text-slate-500 py-10">
            {searchQuery
              ? "No se encontraron usuarios."
              : "No hay usuarios para mostrar."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-700">
            {users.map((user) => (
              <li
                key={user.id}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <span className="text-white font-semibold">
                    {user.username}
                  </span>
                  <span className="text-xs text-slate-300 ml-2">
                    ({user.full_name || "Sin nombre"})
                  </span>
                  <span
                    className={`text-xs ml-2 px-2 py-0.5 rounded-full ${
                      user.role === "admin"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {viewingInactive ? (
                    <button
                      onClick={() => handleRestore(user.id, user.username)}
                      title="Restaurar"
                      className="p-2 rounded-md hover:bg-slate-700"
                    >
                      <RotateCcw className="h-5 w-5 text-green-400" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(user)}
                        title="Editar"
                        className="p-2 rounded-md hover:bg-slate-700"
                      >
                        <Edit className="h-5 w-5 text-sky-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        title="Desactivar"
                        className="p-2 rounded-md hover:bg-slate-700"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && paginationData?.totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={paginationData.totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
}
