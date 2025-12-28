import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import {
  CalendarPlus,
  User,
  Users,
  MapPin,
  NotebookPen,
  X,
  Edit,
} from "lucide-react";
import Spinner from "../atoms/Spinner";

export default function ReservationForm({
  onFormSubmit,
  onCancel,
  initialData = null,
}) {
  const [formData, setFormData] = useState({
    customer_name: "",
    pax: 2,
    reservation_date: "",
    reservation_time: "",
    location: "",
    notes: "",
    status: "CONFIRMED", // Default para nuevas, se sobrescribe en edición
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Parsear fecha y hora desde DATETIME (ISO string)
      const dateObj = new Date(initialData.reservation_date);
      // Asegurarse de que esté en local para los inputs
      // Truco simple: toISOString da UTC. Para inputs type="date"/"time" queremos local.
      // Ajustamos manualmente o usamos una librería. Haremos manual simple:
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");

      setFormData({
        customer_name: initialData.customer_name,
        pax: initialData.pax,
        reservation_date: `${year}-${month}-${day}`,
        reservation_time: `${hours}:${minutes}`,
        location: initialData.location || "",
        notes: initialData.notes || "",
        status: initialData.status || "CONFIRMED",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.customer_name ||
      !formData.reservation_date ||
      !formData.reservation_time
    ) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);

    // Combinar fecha y hora para el formato DATETIME
    const fullDate = `${formData.reservation_date}T${formData.reservation_time}:00`;

    const payload = {
      customer_name: formData.customer_name,
      pax: parseInt(formData.pax),
      reservation_date: fullDate,
      location: formData.location,
      notes: formData.notes,
      status: formData.status, // Necesario para update
    };

    let promise;
    if (initialData && initialData.id) {
      // MODO EDICIÓN (PUT)
      promise = api.put(`/reservations/${initialData.id}`, payload);
    } else {
      // MODO CREACIÓN (POST)
      promise = api.post("/reservations", payload);
    }

    toast.promise(promise, {
      loading: initialData
        ? "Actualizando reserva..."
        : "Registrando reserva...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit();
        return initialData
          ? "Reserva actualizada con éxito."
          : "Reserva registrada con éxito.";
      },
      error: (err) => {
        setIsSubmitting(false);
        return (
          err.response?.data?.message ||
          (initialData ? "Error al actualizar." : "Error al registrar.")
        );
      },
    });
  };

  // Estilos mejorados
  const commonInputClass =
    "bg-slate-700/50 border border-slate-600/50 text-white text-base md:text-sm rounded-xl w-full py-3 px-4 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200 pl-11 shadow-inner placeholder:text-slate-500";
  const labelClass = "block mb-1.5 text-sm font-medium text-slate-300 ml-1";

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-2xl mx-auto backdrop-blur-sm">
      <div className="flex justify-between items-center mb-8 border-b border-slate-700/50 pb-6">
        <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700/50">
            {initialData ? (
              <Edit className="text-sky-400 h-6 w-6" />
            ) : (
              <CalendarPlus className="text-sky-400 h-6 w-6" />
            )}
          </div>
          {initialData ? (
            <span>
              Editar Reserva{" "}
              <span className="text-sky-400">#{initialData.id}</span>
            </span>
          ) : (
            "Nueva Reserva"
          )}
        </h3>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white p-2 hover:bg-slate-700/50 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre y Pax */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="customer_name" className={labelClass}>
              Nombre del Cliente (*)
            </label>
            <div className="relative group">
              <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-sky-400 transition-colors" />
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                className={commonInputClass}
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="pax" className={labelClass}>
              Cantidad de Personas (*)
            </label>
            <div className="relative group">
              <Users className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-sky-400 transition-colors" />
              <input
                type="number"
                name="pax"
                value={formData.pax}
                onChange={handleChange}
                className={commonInputClass}
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="reservation_date" className={labelClass}>
              Fecha (*)
            </label>
            <div className="relative group">
              <input
                type="date"
                name="reservation_date"
                value={formData.reservation_date}
                onChange={handleChange}
                className="bg-slate-700/50 border border-slate-600/50 text-white text-base md:text-sm rounded-xl w-full py-3 px-4 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200 shadow-inner"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="reservation_time" className={labelClass}>
              Hora (*)
            </label>
            <div className="relative group">
              <input
                type="time"
                name="reservation_time"
                value={formData.reservation_time}
                onChange={handleChange}
                className="bg-slate-700/50 border border-slate-600/50 text-white text-base md:text-sm rounded-xl w-full py-3 px-4 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200 shadow-inner"
                required
              />
            </div>
          </div>
        </div>

        {/* Ubicación con Diseño Mejorado */}
        <div>
          <label htmlFor="location" className={labelClass}>
            Ubicación / Mesa
          </label>
          {/* Selected Locations Chips */}
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.location
              .split(",")
              .filter(Boolean)
              .map((loc) => (
                <span
                  key={loc}
                  className="bg-indigo-900/50 text-indigo-200 border border-indigo-500/30 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                >
                  {loc}
                  <button
                    type="button"
                    onClick={() => {
                      const currentLocs = formData.location
                        .split(",")
                        .filter((l) => l.trim() !== "");
                      const newLocs = currentLocs.filter((l) => l !== loc);
                      setFormData({
                        ...formData,
                        location: newLocs.join(","),
                      });
                    }}
                    className="hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
          </div>

          <div className="relative group">
            <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-sky-400 transition-colors" />
            <select
              name="location_selector"
              value=""
              onChange={(e) => {
                const selected = e.target.value;
                if (!selected) return;

                const currentLocs = formData.location
                  ? formData.location.split(",").map((s) => s.trim())
                  : [];

                if (!currentLocs.includes(selected)) {
                  const newLocs = [...currentLocs, selected];
                  setFormData({
                    ...formData,
                    location: newLocs.join(","),
                  });
                }
              }}
              className={`${commonInputClass} appearance-none cursor-pointer`}
            >
              <option value="">Agregar ubicación...</option>
              <optgroup label="Salón" className="bg-slate-800">
                <option value="Salon 1">Salon 1</option>
                <option value="Salon 2">Salon 2</option>
              </optgroup>
              <optgroup label="Beso" className="bg-slate-800">
                <option value="Beso 1">Beso 1</option>
                <option value="Beso 2">Beso 2</option>
                <option value="Beso 3">Beso 3</option>
              </optgroup>
              <optgroup label="Sectores" className="bg-slate-800">
                <option value="Caja">Caja</option>
                <option value="Rojo">Rojo</option>
                <option value="Medio">Medio</option>
                <option value="Azul">Azul</option>
                <option value="Negro">Negro</option>
              </optgroup>
              <optgroup label="Bajas" className="bg-slate-800">
                <option value="Bajas 1">Bajas 1</option>
                <option value="Bajas 2">Bajas 2</option>
                <option value="Bajas 3">Bajas 3</option>
                <option value="Bajas 4">Bajas 4</option>
                <option value="Bajas 5">Bajas 5</option>
                <option value="Bajas 6">Bajas 6</option>
              </optgroup>
            </select>
            {/* Custom arrow for better cross-browser look */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label htmlFor="notes" className={labelClass}>
            Notas Adicionales
          </label>
          <div className="relative group">
            <NotebookPen className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-sky-400 transition-colors" />
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              className="bg-slate-700/50 border border-slate-600/50 text-white text-base md:text-sm rounded-xl w-full py-3 px-4 pl-11 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200 shadow-inner placeholder:text-slate-500 resize-none"
              placeholder="Ej. Cumpleaños, alergias..."
            />
          </div>
        </div>

        {/* Botones - Mobile First: Stacked on mobile, row on desktop */}
        <div className="flex flex-col-reverse md:flex-row justify-end gap-3 md:gap-4 pt-6 mt-2 border-t border-slate-700/50">
          <button
            type="button"
            onClick={onCancel}
            className="w-full md:w-auto text-slate-300 bg-slate-700/50 hover:bg-slate-700 hover:text-white font-medium rounded-xl text-sm px-6 py-3.5 transition-all duration-200 border border-transparent hover:border-slate-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 hover:shadow-lg hover:shadow-sky-500/25 font-bold rounded-xl text-sm px-8 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" /> Guardando...
              </span>
            ) : initialData ? (
              "Actualizar Reserva"
            ) : (
              "Confirmar Reserva"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
