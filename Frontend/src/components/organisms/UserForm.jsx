// Frontend/src/components/organisms/UserForm.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import Spinner from "../atoms/Spinner";

export default function UserForm({ userIdToEdit, onFormSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role_id: "", // <-- CAMBIO IMPORTANTE: Ahora usamos role_id
    display_name: "",
    full_name: "",
    email_contact: "",
    phone: "",
  });

  const [roles, setRoles] = useState([]); // <-- Estado para guardar la lista de roles
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Empezamos cargando
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Cargar la lista de roles disponibles desde la BD
        const rolesResponse = await api.get("/admin/roles");
        setRoles(rolesResponse.data);

        // 2. Si estamos editando, cargar los datos del usuario
        if (userIdToEdit) {
          setIsEditing(true);
          const userResponse = await api.get(`/admin/users/${userIdToEdit}`);
          const userData = userResponse.data;

          setFormData({
            username: userData.username || "",
            password: "",
            // Aseguramos que role_id sea un string para que el <select> lo reconozca
            role_id: userData.role_id ? String(userData.role_id) : "",
            display_name: userData.display_name || "",
            full_name: userData.full_name || "",
            email_contact: userData.email_contact || "",
            phone: userData.phone || "",
          });
        } else {
          // Si es creación, reseteamos
          setIsEditing(false);
          setFormData({
            username: "",
            password: "",
            role_id: "",
            display_name: "",
            full_name: "",
            email_contact: "",
            phone: "",
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar datos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userIdToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.username || !formData.role_id) {
      // <-- Validamos role_id
      toast.error("El nombre de usuario y el rol son obligatorios.");
      return;
    }
    if (!isEditing && !formData.password) {
      toast.error("La contraseña es obligatoria al crear un usuario.");
      return;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);

    const payload = { ...formData };
    // Convertimos role_id a número antes de enviar
    payload.role_id = parseInt(payload.role_id);

    if (isEditing && !payload.password) {
      delete payload.password;
    }

    const promise = isEditing
      ? api.put(`/admin/users/${userIdToEdit}`, payload)
      : api.post("/admin/users", payload);

    toast.promise(promise, {
      loading: isEditing ? "Actualizando usuario..." : "Creando usuario...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit();
        return `¡Usuario ${isEditing ? "actualizado" : "creado"} con éxito!`;
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Ocurrió un error al guardar.";
      },
    });
  };

  if (isLoading) return <Spinner />;

  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500";

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <UserPlus className="text-sky-400" />
        {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fila 1: Usuario y Rol */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="username"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Usuario (Login) (*)
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
              className={commonInputClass}
              required
              disabled={isEditing}
            />
          </div>

          {/* SELECCIÓN DE ROL DINÁMICA */}
          <div>
            <label
              htmlFor="role_id"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Rol (*)
            </label>
            <select
              name="role_id"
              id="role_id"
              value={formData.role_id}
              onChange={handleChange}
              className={commonInputClass}
              required
            >
              <option value="">-- Selecciona un Rol --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Contraseña */}
        <div>
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-medium text-slate-300"
          >
            {isEditing ? "Nueva Contraseña (Opcional)" : "Contraseña (*)"}
          </label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            className={commonInputClass}
            placeholder={
              isEditing ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"
            }
            required={!isEditing}
            autoComplete="new-password"
          />
        </div>

        {/* ... Resto de campos (Display Name, Nombre, Email, Teléfono) siguen igual ... */}
        <div className="border-t border-slate-700 pt-4 mt-4">
          <h4 className="text-md font-semibold text-slate-300 mb-3">
            Datos del Perfil (Opcional)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="display_name"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Nombre a Mostrar
            </label>
            <input
              type="text"
              name="display_name"
              id="display_name"
              value={formData.display_name}
              onChange={handleChange}
              className={commonInputClass}
              placeholder="Ej: Juan"
            />
          </div>
          <div>
            <label
              htmlFor="full_name"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Nombre y Apellido
            </label>
            <input
              type="text"
              name="full_name"
              id="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className={commonInputClass}
              placeholder="Ej: Juan Gatti"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="email_contact"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Email de Contacto
            </label>
            <input
              type="email"
              name="email_contact"
              id="email_contact"
              value={formData.email_contact}
              onChange={handleChange}
              className={commonInputClass}
              placeholder="ejemplo@mail.com"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              className={commonInputClass}
              placeholder="+54 11 1234 5678"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end pt-4 gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-white bg-slate-600 hover:bg-slate-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500"
          >
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
