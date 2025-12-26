import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { ShieldPlus } from "lucide-react";
import Spinner from "../atoms/Spinner";

export default function RoleForm({ roleIdToEdit, onFormSubmit, onCancel }) {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [allPermissions, setAllPermissions] = useState([]); // Lista total del backend
  const [selectedPermissions, setSelectedPermissions] = useState(new Set()); // IDs seleccionados
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!roleIdToEdit;

  useEffect(() => {
    setIsLoading(true);

    // 1. Obtener el catálogo de permisos
    const permissionsPromise = api.get("/admin/permissions");

    // 2. Si editamos, obtener el rol actual
    const rolePromise = isEditing
      ? api.get(`/admin/roles/${roleIdToEdit}`)
      : Promise.resolve(null);

    Promise.all([permissionsPromise, rolePromise])
      .then(([permissionsRes, roleRes]) => {
        setAllPermissions(permissionsRes.data || []);

        if (isEditing && roleRes) {
          setFormData({
            name: roleRes.data.role.name || "",
            description: roleRes.data.role.description || "",
          });
          // Convertimos array de IDs a un Set para manejo eficiente
          setSelectedPermissions(new Set(roleRes.data.permissionIds || []));
        } else {
          setFormData({ name: "", description: "" });
          setSelectedPermissions(new Set());
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error al cargar datos.");
      })
      .finally(() => setIsLoading(false));
  }, [roleIdToEdit, isEditing]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejar el Checkbox
  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("El nombre del rol es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      permissionIds: Array.from(selectedPermissions), // Enviamos array al backend
    };

    const promise = isEditing
      ? api.put(`/admin/roles/${roleIdToEdit}`, payload)
      : api.post("/admin/roles", payload);

    toast.promise(promise, {
      loading: isEditing ? "Actualizando rol..." : "Creando rol...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit();
        return `Rol ${isEditing ? "actualizado" : "creado"} con éxito.`;
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Error al guardar.";
      },
    });
  };

  if (isLoading) return <Spinner />;

  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500";

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <ShieldPlus className="text-sky-400" />
        {isEditing ? "Editar Rol" : "Crear Nuevo Rol"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre y Descripción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Nombre del Rol (*)
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleFormChange}
              className={commonInputClass}
              placeholder="Ej. Cajero"
              required
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Descripción
            </label>
            <input
              type="text"
              name="description"
              id="description"
              value={formData.description}
              onChange={handleFormChange}
              className={commonInputClass}
              placeholder="Ej. Encargado de cobros y cierre"
            />
          </div>
        </div>

        {/* LISTA DE PERMISOS */}
        <div className="border-t border-slate-700 pt-4">
          <h4 className="text-md font-semibold text-slate-300 mb-3">
            Asignar Permisos
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Marca las acciones que este rol podrá realizar.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            {allPermissions.map((perm) => (
              <label
                key={perm.id}
                className={`flex items-start space-x-3 p-2 rounded-md transition-colors cursor-pointer border ${
                  selectedPermissions.has(perm.id)
                    ? "bg-sky-900/20 border-sky-600/50"
                    : "bg-transparent border-transparent hover:bg-slate-700"
                }`}
              >
                <div className="flex h-5 items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-600 focus:ring-sky-500 focus:ring-offset-slate-800"
                    checked={selectedPermissions.has(perm.id)}
                    onChange={() => handlePermissionToggle(perm.id)}
                  />
                </div>
                <div className="text-sm">
                  <span
                    className={`block font-medium ${
                      selectedPermissions.has(perm.id)
                        ? "text-sky-200"
                        : "text-slate-300"
                    }`}
                  >
                    {perm.name}
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {perm.permission_key}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end pt-4 gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-white bg-slate-600 hover:bg-slate-700 font-medium rounded-lg text-sm px-5 py-2.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-slate-500"
          >
            {isSubmitting ? "Guardando..." : "Guardar Rol"}
          </button>
        </div>
      </form>
    </div>
  );
}
