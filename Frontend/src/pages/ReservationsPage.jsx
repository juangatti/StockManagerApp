import { useState, useEffect, useCallback } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import {
  Calendar,
  User,
  MapPin,
  Users,
  Clock,
  PlusCircle,
  Pencil,
} from "lucide-react";
import Spinner from "../components/atoms/Spinner";
import Alert from "../components/atoms/Alert";
import ReservationForm from "../components/organisms/ReservationForm";
import useAuthStore from "../stores/useAuthStore";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  ); // Hoy
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null); // Estado para la reserva en edición
  const user = useAuthStore((state) => state.user);

  // Permiso para gestionar (crear/editar)
  const canManage =
    user?.permissions?.includes("reservations:manage") ||
    user?.role_name === "SuperAdmin" ||
    user?.role_name === "GameMaster";

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/reservations", {
        params: { date: selectedDate },
      });
      setReservations(response.data.reservations);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las reservas.");
      toast.error("Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!showForm) {
      fetchReservations();
    }
  }, [showForm, fetchReservations]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleCreateNew = () => {
    setEditingReservation(null);
    setShowForm(true);
  };

  const handleEdit = (reservation) => {
    setEditingReservation(reservation);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <ReservationForm
        onFormSubmit={() => {
          setShowForm(false);
          setEditingReservation(null);
          fetchReservations();
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingReservation(null);
        }}
        initialData={editingReservation}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-6 rounded-lg shadow-lg border-b-4 border-sky-500">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calendar className="h-8 w-8 text-sky-400" /> Reservas
          </h2>
          <p className="text-slate-400 mt-1">Gestión de mesas y eventos.</p>
        </div>

        <div className="flex gap-4 mt-4 md:mt-0 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg p-2.5 focus:ring-sky-500 focus:border-sky-500"
          />

          {canManage && (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 transition-all shadow-lg shadow-sky-900/50"
            >
              <PlusCircle className="h-5 w-5" /> Nueva Reserva
            </button>
          )}
        </div>
      </div>

      {error && <Alert message={error} />}
      {loading && <Spinner />}

      {!loading && reservations.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
          <Calendar className="h-16 w-16 mx-auto text-slate-600 mb-4" />
          <p className="text-xl text-slate-500">
            No hay reservas para esta fecha.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservations.map((res) => {
            const time = new Date(res.reservation_date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={res.id}
                className="bg-slate-800 rounded-lg p-5 border border-slate-700 hover:border-sky-500/50 transition-colors shadow-md relative overflow-hidden group"
              >
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${
                    res.status === "CONFIRMED" ? "bg-green-500" : "bg-slate-500"
                  }`}
                ></div>

                <div className="flex justify-between items-start mb-3 pl-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-sky-400" />{" "}
                    {res.customer_name}
                  </h3>
                  <span className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-1 rounded">
                    #{res.id}
                  </span>
                </div>

                <div className="pl-3 space-y-2 text-sm text-slate-300">
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    {res.pax} Personas
                  </p>
                  <p className="flex items-center gap-2 text-white font-semibold">
                    <Clock className="h-4 w-4 text-sky-400" />
                    {time} hs
                  </p>
                  {res.location && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      {res.location}
                    </p>
                  )}
                  {res.notes && (
                    <div className="mt-2 text-xs bg-slate-900/50 p-2 rounded text-slate-400 italic">
                      "{res.notes}"
                    </div>
                  )}
                </div>

                <div className="mt-4 pl-3 pt-3 border-t border-slate-700 flex justify-between items-center">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      res.status === "CONFIRMED"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {res.status}
                  </span>

                  {canManage && (
                    <button
                      onClick={() => handleEdit(res)}
                      className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-700 rounded transition-colors"
                      title="Editar reserva"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
