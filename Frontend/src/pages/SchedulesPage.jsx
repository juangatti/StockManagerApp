import { useState, useEffect } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import {
  CalendarClock,
  Plus,
  Trash2,
  User,
  Clock,
  StickyNote,
} from "lucide-react";
import Spinner from "../components/atoms/Spinner";

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Form State
  const [formData, setFormData] = useState({
    user_id: "",
    start_time: "18:00",
    end_time: "02:00",
    notes: "",
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users", { params: { limit: 100 } });
      // Filtrar o usar todos.
      setUsers(res.data.users);
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get("/schedules", {
        params: { startDate: selectedDate, endDate: selectedDate }, // Solo el día seleccionado
      });
      setSchedules(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar horarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.user_id) {
      toast.error("Selecciona un usuario.");
      return;
    }

    try {
      await api.post("/schedules", {
        ...formData,
        work_date: selectedDate,
      });
      toast.success("Horario asignado.");
      fetchSchedules();
      // Reset form lightly
      setFormData({ ...formData, notes: "" });
    } catch (err) {
      toast.error("Error al asignar.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este horario?")) return;
    try {
      await api.delete(`/schedules/${id}`);
      toast.success("Eliminado.");
      setSchedules(schedules.filter((s) => s.id !== id));
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-surface p-6 rounded-lg shadow-(--shadow-card) border-b-4 border-primary">
        <div>
          <h2 className="text-3xl font-bold text-text-primary font-display uppercase tracking-wide flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-primary" /> Cronograma
          </h2>
          <p className="text-text-muted mt-1 uppercase font-bold text-xs tracking-wider">
            Gestión de turnos de trabajo.
          </p>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-white border border-gray-200 text-text-primary text-sm rounded-lg p-2.5 mt-4 md:mt-0 focus:ring-primary focus:border-primary shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORMULARIO DE ASIGNACIÓN */}
        <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-100 h-fit">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2 font-display uppercase tracking-wide border-b border-gray-50 pb-4">
            <Plus className="h-5 w-5 text-primary" /> Asignar Turno
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block mb-1 text-xs font-bold text-text-secondary uppercase tracking-wider">
                Usuario
              </label>
              <select
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-text-primary focus:ring-primary focus:border-primary shadow-sm cursor-pointer"
                value={formData.user_id}
                onChange={(e) =>
                  setFormData({ ...formData, user_id: e.target.value })
                }
                required
              >
                <option value="">Seleccionar...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name || u.username} ({u.role_name || "Sin Rol"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Inicio
                </label>
                <input
                  type="time"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-text-primary focus:ring-primary focus:border-primary shadow-sm"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Fin
                </label>
                <input
                  type="time"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-text-primary focus:ring-primary focus:border-primary shadow-sm"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-bold text-text-secondary uppercase tracking-wider">
                Notas
              </label>
              <textarea
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-text-primary focus:ring-primary focus:border-primary shadow-sm"
                rows="2"
                placeholder="Ej. Barra principal"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-red-500/10 uppercase tracking-widest text-sm"
            >
              Asignar Turno
            </button>
          </form>
        </div>

        {/* LISTADO DE HORARIOS */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <Spinner />
          ) : schedules.length === 0 ? (
            <div className="bg-surface p-12 rounded-lg border-2 border-dashed border-gray-200 text-center">
              <p className="text-text-muted font-medium italic">
                No hay horarios asignados para este día.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map((sch) => (
                <div
                  key={sch.id}
                  className="bg-surface p-5 rounded-lg border border-gray-100 flex justify-between items-start group hover:border-primary/50 transition-all shadow-(--shadow-card)"
                >
                  <div>
                    <h4 className="font-bold text-text-primary flex items-center gap-2 font-display uppercase tracking-wide">
                      <User className="h-4 w-4 text-primary" />
                      {sch.display_name || sch.full_name || "Usuario"}
                    </h4>
                    <p className="text-text-muted text-xs mt-1.5 flex items-center gap-2 font-mono font-bold">
                      <Clock className="h-3 w-3" />
                      {sch.start_time.slice(0, 5)} - {sch.end_time.slice(0, 5)}
                    </p>
                    {sch.notes && (
                      <div className="mt-2 text-xs bg-gray-50 p-2 rounded text-emerald-800 flex items-start gap-1 border border-emerald-100">
                        <StickyNote className="h-3 w-3 mt-0.5" />
                        {sch.notes}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(sch.id)}
                    className="text-gray-300 hover:text-primary p-1.5 rounded-lg hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all"
                    title="Eliminar turno"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
