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
  Settings,
  Users,
  Utensils,
  Beer,
  Save,
} from "lucide-react";
import Spinner from "../components/atoms/Spinner";

export default function SchedulesPage() {
  const [activeTab, setActiveTab] = useState("schedules"); // shifts, workers, config
  const [schedules, setSchedules] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [barConfig, setBarConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Form State for Schedules
  const [formData, setFormData] = useState({
    worker_id: "",
    start_time: "18:00",
    end_time: "02:00",
    notes: "",
  });

  // Form State for Workers
  const [workerFormData, setWorkerFormData] = useState({
    full_name: "",
    role_id: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersRes, rolesRes, schedulesRes, barConfigRes] =
        await Promise.all([
          api.get("/schedules/workers"),
          api.get("/admin/roles"),
          api.get("/schedules", {
            params: { startDate: selectedDate, endDate: selectedDate },
          }),
          api.get("/schedules/bar-config"),
        ]);

      setWorkers(workersRes.data);
      setRoles(rolesRes.data);
      setSchedules(schedulesRes.data);
      setBarConfig(barConfigRes.data);
    } catch (err) {
      console.error("Error fetching data", err);
      toast.error("Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!formData.worker_id) {
      toast.error("Selecciona un trabajador.");
      return;
    }

    try {
      await api.post("/schedules", {
        ...formData,
        work_date: selectedDate,
      });
      toast.success("Horario asignado.");
      fetchData();
      setFormData({ ...formData, notes: "" });
    } catch (err) {
      toast.error("Error al asignar.");
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    if (!workerFormData.full_name) return;
    try {
      await api.post("/schedules/workers", workerFormData);
      toast.success("Trabajador creado.");
      setWorkerFormData({ full_name: "", role_id: "" });
      fetchData();
    } catch (err) {
      toast.error("Error al crear trabajador.");
    }
  };

  const handleUpdateBarConfig = async (dayConfig) => {
    try {
      await api.post("/schedules/bar-config", dayConfig);
      toast.success("Horario actualizado.");
      fetchData();
    } catch (err) {
      toast.error("Error al actualizar.");
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("¿Eliminar este horario?")) return;
    try {
      await api.delete(`/schedules/${id}`);
      toast.success("Eliminado.");
      setSchedules(schedules.filter((s) => s.id !== id));
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  const daysLabels = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-surface p-6 rounded-xl shadow-(--shadow-card) border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl">
            <CalendarClock className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-text-primary font-display uppercase tracking-tight">
              Cronograma & Staff
            </h2>
            <p className="text-text-muted mt-1 uppercase font-bold text-[10px] tracking-widest">
              Gestión de personal y operativos del bar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <div className="flex bg-gray-100 p-1 rounded-lg mr-4">
            <button
              onClick={() => setActiveTab("schedules")}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activeTab === "schedules" ? "bg-white shadow-sm text-primary" : "text-text-muted hover:text-text-primary"}`}
            >
              Turnos
            </button>
            <button
              onClick={() => setActiveTab("workers")}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activeTab === "workers" ? "bg-white shadow-sm text-primary" : "text-text-muted hover:text-text-primary"}`}
            >
              Staff
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activeTab === "config" ? "bg-white shadow-sm text-primary" : "text-text-muted hover:text-text-primary"}`}
            >
              Horarios Bar
            </button>
          </div>
          {activeTab === "schedules" && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-gray-200 text-text-primary text-sm rounded-lg p-2.5 focus:ring-primary focus:border-primary shadow-sm font-mono font-bold"
            />
          )}
        </div>
      </div>

      {activeTab === "schedules" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ASIGNAR TURNO */}
          <div className="bg-surface p-6 rounded-xl shadow-(--shadow-card) border border-gray-100 h-fit">
            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2 font-display uppercase tracking-tight border-b border-gray-50 pb-4">
              <Plus className="h-5 w-5 text-emerald-500" /> Asignar Turno
            </h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block mb-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  Trabajador
                </label>
                <select
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-text-primary focus:ring-primary focus:border-primary shadow-sm"
                  value={formData.worker_id}
                  onChange={(e) =>
                    setFormData({ ...formData, worker_id: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccionar...</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} ({w.role_name || "Staff"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Inicio
                  </label>
                  <input
                    type="time"
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-text-primary"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Fin
                  </label>
                  <input
                    type="time"
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-text-primary"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  Notas
                </label>
                <textarea
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-text-primary"
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Confirmar Turno
              </button>
            </form>
          </div>

          {/* LISTADO */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <Spinner />
            ) : schedules.length === 0 ? (
              <div className="bg-white p-16 rounded-xl border border-gray-100 text-center flex flex-col items-center justify-center shadow-sm">
                <Clock className="h-12 w-12 text-gray-200 mb-4" />
                <p className="text-text-muted font-medium italic">
                  No hay turnos asignados para este día.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedules.map((sch) => (
                  <div
                    key={sch.id}
                    className="bg-surface p-5 rounded-xl border border-gray-100 flex justify-between items-start group hover:border-primary transition-all shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-primary font-bold border border-gray-100">
                        {sch.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary font-display uppercase tracking-tight">
                          {sch.full_name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            {sch.role_name || "Staff"}
                          </span>
                          <span className="text-text-muted text-[11px] font-mono font-bold flex items-center gap-1">
                            <Clock className="h-3 w-3" />{" "}
                            {sch.start_time.slice(0, 5)} -{" "}
                            {sch.end_time.slice(0, 5)}
                          </span>
                        </div>
                        {sch.notes && (
                          <div className="mt-2 text-[11px] bg-gray-50 p-2 rounded text-text-secondary italic border-l-2 border-primary">
                            {sch.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSchedule(sch.id)}
                      className="text-gray-300 hover:text-primary p-2 rounded-lg hover:bg-primary/5 transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "workers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-xl shadow-(--shadow-card) border border-gray-100 h-fit">
            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2 font-display uppercase tracking-tight border-b border-gray-50 pb-4">
              <Users className="h-5 w-5 text-primary" /> Nuevo Trabajador
            </h3>
            <form onSubmit={handleCreateWorker} className="space-y-4">
              <div>
                <label className="block mb-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-text-primary"
                  value={workerFormData.full_name}
                  onChange={(e) =>
                    setWorkerFormData({
                      ...workerFormData,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="Ej. Juan Perez"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  Rol / Función
                </label>
                <select
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-text-primary"
                  value={workerFormData.role_id}
                  onChange={(e) =>
                    setWorkerFormData({
                      ...workerFormData,
                      role_id: e.target.value,
                    })
                  }
                >
                  <option value="">Seleccionar Rol...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs"
              >
                Guardar Trabajador
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {workers.map((w) => (
              <div
                key={w.id}
                className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <User className="h-5 w-5 text-text-muted" />
                  </div>
                  <div>
                    <span className="font-bold text-text-primary block">
                      {w.full_name}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      {w.role_name || "Sin Rol"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "config" && (
        <div className="bg-surface p-6 rounded-xl shadow-(--shadow-card) border border-gray-100">
          <h3 className="text-lg font-bold text-text-primary mb-8 flex items-center gap-2 font-display uppercase tracking-tight border-b border-gray-50 pb-4">
            <Settings className="h-5 w-5 text-primary" /> Horarios Base del Bar
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const config = barConfig.find((c) => c.day_of_week === day) || {
                day_of_week: day,
                opening_time: "18:00",
                kitchen_close_time: "00:00",
                bar_close_time: "02:00",
              };
              return (
                <div
                  key={day}
                  className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4 hover:border-primary/30 transition-all"
                >
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="font-bold text-sm text-text-primary uppercase">
                      {daysLabels[day]}
                    </span>
                    <Settings className="h-3 w-3 text-text-muted" />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">
                        <Clock className="h-2 w-2" /> Apertura
                      </label>
                      <input
                        type="time"
                        value={config.opening_time.slice(0, 5)}
                        onChange={(e) =>
                          handleUpdateBarConfig({
                            ...config,
                            opening_time: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">
                        <Utensils className="h-2 w-2" /> Cierre Cocina
                      </label>
                      <input
                        type="time"
                        value={config.kitchen_close_time.slice(0, 5)}
                        onChange={(e) =>
                          handleUpdateBarConfig({
                            ...config,
                            kitchen_close_time: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">
                        <Beer className="h-2 w-2" /> Cierre Bar
                      </label>
                      <input
                        type="time"
                        value={config.bar_close_time.slice(0, 5)}
                        onChange={(e) =>
                          handleUpdateBarConfig({
                            ...config,
                            bar_close_time: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
