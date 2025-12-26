import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { Shield, ShieldPlus, Edit, Trash2 } from "lucide-react";
import RoleForm from "./RoleForm";
import Spinner from "../atoms/Spinner";
import Alert from "../atoms/Alert";

export default function RoleManager() {
  const [roles, setRoles] = useState([]);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/roles");
      setRoles(response.data);
    } catch (err) {
      toast.error("Error al cargar roles.");
      setError("No se pudieron cargar los roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showForm) {
      fetchRoles();
    }
  }, [showForm, fetchRoles]);

  const handleDelete = (roleId, roleName) => {
    if (
      window.confirm(
        `¿BORRAR ROL "${roleName}"? Los usuarios con este rol perderán sus permisos.`
      )
    ) {
      const promise = api.delete(`/admin/roles/${roleId}`);
      toast.promise(promise, {
        loading: "Eliminando...",
        success: () => {
          fetchRoles();
          return "Rol eliminado.";
        },
        error: "Error al eliminar.",
      });
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingRoleId(null);
    fetchRoles();
  };

  if (showForm) {
    return (
      <RoleForm
        roleIdToEdit={editingRoleId}
        onFormSubmit={handleFormSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingRoleId(null);
        }}
      />
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Shield className="text-sky-400" /> Roles del Sistema
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5"
        >
          <ShieldPlus className="mr-2 h-5 w-5" /> Crear Rol
        </button>
      </div>

      {error && <Alert message={error} />}
      {loading && <Spinner />}

      {!loading && roles.length === 0 ? (
        <p className="text-center text-slate-500 py-10 border-2 border-dashed border-slate-700 rounded-lg">
          No hay roles creados.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-slate-700/30 border border-slate-700 p-5 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-bold text-white">{role.name}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingRoleId(role.id);
                      setShowForm(true);
                    }}
                    className="text-sky-400 hover:text-sky-300 p-1"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  {/* Protegemos roles críticos visualmente */}
                  {role.name !== "SuperAdmin" && role.name !== "GameMaster" && (
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-400">
                {role.description || "Sin descripción"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
