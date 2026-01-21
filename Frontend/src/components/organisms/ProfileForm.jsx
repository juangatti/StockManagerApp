// Frontend/src/components/organisms/ProfileForm.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { UserCog, Contact, Lock, Save } from "lucide-react";
import useAuthStore from "../../stores/useAuthStore";
import Spinner from "../atoms/Spinner";

export default function ProfileForm() {
  const { user, updateUserProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    display_name: "",
    full_name: "",
    email_contact: "",
    phone: "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Cargar datos del perfil al montar
  useEffect(() => {
    setIsLoading(true);
    api
      .get("/profile") // Llama al GET /api/profile
      .then((res) => {
        setFormData({
          display_name: res.data.display_name || user.username || "",
          full_name: res.data.full_name || "",
          email_contact: res.data.email_contact || "",
          phone: res.data.phone || "",
        });
      })
      .catch((err) => {
        console.error("Error al cargar el perfil:", err);
        toast.error("No se pudieron cargar los datos del perfil.");
      })
      .finally(() => setIsLoading(false));
  }, [user.username]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  // 2. Lógica de guardado
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let passwordPromise = Promise.resolve();
    const passwordFieldsFilled =
      passwords.currentPassword ||
      passwords.newPassword ||
      passwords.confirmPassword;

    // A. Validar y preparar la promesa de contraseña (si se llenó)
    if (passwordFieldsFilled) {
      if (passwords.newPassword !== passwords.confirmPassword) {
        toast.error("Las nuevas contraseñas no coinciden.");
        setIsSubmitting(false);
        return;
      }
      if (passwords.newPassword.length < 6) {
        toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
        setIsSubmitting(false);
        return;
      }
      // Si todo es válido, preparamos la promesa
      passwordPromise = api.put("/auth/profile/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
    }

    // B. Preparar la promesa de datos del perfil
    const profilePromise = api.put("/profile", formData);

    // C. Ejecutar ambas promesas
    try {
      // Esperamos a que ambas se completen
      const [profileResponse, passwordResponse] = await Promise.all([
        profilePromise,
        passwordPromise,
      ]);

      // Actualizar el store de Zustand con los nuevos datos
      if (profileResponse.data.profile) {
        updateUserProfile(profileResponse.data.profile);
      }

      toast.success("¡Perfil actualizado con éxito!");
      if (passwordFieldsFilled) {
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      console.error("Error al guardar:", err);
      toast.error(
        err.response?.data?.message || "Ocurrió un error al guardar.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  const commonInputClass =
    "bg-white border border-gray-300 text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 shadow-sm transition-colors";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
      {/* --- Tarjeta 1: Identidad --- */}
      <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-200">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 font-display uppercase tracking-wide">
          <UserCog className="text-primary" /> Identidad
        </h3>
        <p className="text-sm text-text-muted mb-4 font-medium">
          El "Nombre a Mostrar" aparecerá en el sidebar.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
              Usuario (Login)
            </label>
            <input
              type="text"
              value={user.username || ""}
              className={`${commonInputClass} bg-gray-100 cursor-not-allowed opacity-70 border-dashed`}
              disabled
              readOnly
              title="El nombre de usuario no se puede cambiar. Contacta a un administrador."
            />
          </div>
          <div>
            <label
              htmlFor="display_name"
              className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider"
            >
              Nombre a Mostrar
            </label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleFormChange}
              className={commonInputClass}
              placeholder="Ej: Juan"
            />
          </div>
        </div>
      </div>

      {/* --- Tarjeta 2: Datos de Contacto --- */}
      <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-200">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 font-display uppercase tracking-wide">
          <Contact className="text-primary" /> Datos de Contacto
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="full_name"
              className="block mb-2 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
            >
              Nombre y Apellido
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleFormChange}
              className={commonInputClass}
              placeholder="Ej: Juan Gatti"
            />
          </div>
          <div>
            <label
              htmlFor="email_contact"
              className="block mb-2 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
            >
              Email de Contacto
            </label>
            <input
              type="email"
              id="email_contact"
              name="email_contact"
              value={formData.email_contact}
              onChange={handleFormChange}
              className={commonInputClass}
              placeholder="ejemplo@mail.com"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block mb-2 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
            >
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              className={commonInputClass}
              placeholder="+54 11 1234 5678"
            />
          </div>
        </div>
      </div>

      {/* --- Tarjeta 3: Seguridad --- */}
      <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-200">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 font-display uppercase tracking-wide">
          <Lock className="text-primary" /> Cambiar Contraseña
        </h3>
        <p className="text-sm text-text-muted mb-4 font-medium">
          Deja estos campos vacíos si no quieres cambiar tu contraseña.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
              Contraseña Actual
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              className={commonInputClass}
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
                Nueva Contraseña
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                className={commonInputClass}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
                Confirmar Nueva
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                className={commonInputClass}
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Botón de Guardar General --- */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="flex items-center justify-center text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:ring-red-200 font-bold rounded-lg text-sm px-6 py-3 disabled:bg-gray-400 uppercase tracking-wide transition-colors shadow-sm"
        >
          <Save className="mr-2 h-5 w-5" />
          {isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
