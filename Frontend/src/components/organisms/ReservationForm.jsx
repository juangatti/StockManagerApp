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

  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500 pl-10";
  const labelClass = "block mb-2 text-sm font-medium text-slate-300";

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          {initialData ? (
            <>
              <Edit className="text-sky-400" /> Editar Reserva #{initialData.id}
            </>
          ) : (
            <>
              <CalendarPlus className="text-sky-400" /> Nueva Reserva
            </>
          )}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white">
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre y Pax */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customer_name" className={labelClass}>
              Nombre del Cliente (*)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
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
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reservation_date" className={labelClass}>
              Fecha (*)
            </label>
            <input
              type="date"
              name="reservation_date"
              value={formData.reservation_date}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500"
              required
            />
          </div>
          <div>
            <label htmlFor="reservation_time" className={labelClass}>
              Hora (*)
            </label>
            <input
              type="time"
              name="reservation_time"
              value={formData.reservation_time}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500"
              required
            />
          </div>
        </div>

        {/* Ubicación */}
        <div>
          <label htmlFor="location" className={labelClass}>
            Ubicación / Mesa
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={commonInputClass}
            >
              <option value="">Seleccionar ubicación...</option>
              <optgroup label="Salón">
                <option value="Salon 1">Salon 1</option>
                <option value="Salon 2">Salon 2</option>
              </optgroup>
              <optgroup label="Beso">
                <option value="Beso 1">Beso 1</option>
                <option value="Beso 2">Beso 2</option>
                <option value="Beso 3">Beso 3</option>
              </optgroup>
              <optgroup label="Sectores">
                <option value="Caja">Caja</option>
                <option value="Rojo">Rojo</option>
                <option value="Medio">Medio</option>
                <option value="Azul">Azul</option>
                <option value="Negro">Negro</option>
              </optgroup>
              <optgroup label="Bajas">
                <option value="Bajas 1">Bajas 1</option>
                <option value="Bajas 2">Bajas 2</option>
                <option value="Bajas 3">Bajas 3</option>
                <option value="Bajas 4">Bajas 4</option>
                <option value="Bajas 5">Bajas 5</option>
                <option value="Bajas 6">Bajas 6</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label htmlFor="notes" className={labelClass}>
            Notas Adicionales
          </label>
          <div className="relative">
            <NotebookPen className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 pl-10 focus:ring-sky-500 focus:border-sky-500"
              placeholder="Ej. Cumpleaños, alergias..."
            />
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
            {isSubmitting
              ? "Guardando..."
              : initialData
              ? "Actualizar Reserva"
              : "Confirmar Reserva"}
          </button>
        </div>
      </form>
    </div>
  );
}
