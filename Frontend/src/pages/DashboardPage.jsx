import { useState, useEffect } from "react";
import api from "../api/api";
import {
  Snowflake,
  AlertTriangle,
  XCircle,
  CalendarCheck,
  User,
  MapPin,
} from "lucide-react";
import Spinner from "../components/atoms/Spinner";
import WorkScheduleWidget from "../components/widgets/WorkScheduleWidget";

const AlertCard = ({ title, items, icon: Icon, colorClass }) => (
  <div
    className={`bg-slate-800 p-6 rounded-lg shadow-lg border-l-4 ${colorClass}`}
  >
    <div className="flex items-center mb-4">
      <Icon className="h-6 w-6 mr-3" />
      <h3 className="text-xl font-semibold text-white">
        {title} ({items.length})
      </h3>
    </div>
    <ul className="space-y-2">
      {items.length > 0 ? (
        items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between text-slate-300"
          >
            <span>{item.nombre_item}</span>
            <span className="font-mono font-bold bg-slate-700 px-2 py-0.5 rounded text-xs ml-2">
              {parseFloat(item.stock_unidades).toFixed(2)} {item.unidad_medida}
            </span>
          </li>
        ))
      ) : (
        <p className="text-sm text-slate-500">
          No hay items en esta categoría.
        </p>
      )}
    </ul>
  </div>
);

export default function DashboardPage() {
  const [hielo, setHielo] = useState([]);
  const [alerts, setAlerts] = useState({ lowStock: [], outOfStock: [] });
  const [reservationStats, setReservationStats] = useState({
    count: 0,
    totalPax: 0,
    today_reservations: [],
  });
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [iceRes, alertsRes, resStatsRes, schedulesRes] =
          await Promise.all([
            api.get("/stock/ice"),
            api.get("/stock/alerts"),
            api.get("/reservations/stats/dashboard").catch(() => ({
              data: { count: 0, totalPax: 0, today_reservations: [] },
            })),
            api.get("/schedules/dashboard").catch(() => ({ data: [] })),
          ]);

        setHielo(iceRes.data);
        setAlerts(alertsRes.data);
        setReservationStats(resStatsRes.data);
        setSchedules(schedulesRes.data);
      } catch (error) {
        console.error("Error al cargar el dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner />;

  const fecha = new Date().toLocaleDateString("es-AR", { dateStyle: "full" });

  return (
    <div className="space-y-10">
      {/* SECCIÓN SUPERIOR: FECHA Y WIDGETS PRINCIPALES */}
      <h2 className="text-3xl font-bold text-white border-b border-slate-700 pb-2">
        {fecha.charAt(0).toUpperCase() + fecha.slice(1)}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WIDGET DE RESERVAS */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl border-l-4 border-indigo-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CalendarCheck className="h-8 w-8 text-indigo-400 mr-3" />
              <div>
                <h2 className="text-xl font-bold text-white">Total Personas</h2>
                <p className="text-xs text-slate-400">Reservas de hoy</p>
              </div>
            </div>
            <span className="text-3xl font-bold text-white bg-indigo-900/50 px-4 py-2 rounded-lg">
              {reservationStats.totalPax || 0}
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {reservationStats.today_reservations.length > 0 ? (
              reservationStats.today_reservations.map((res) => (
                <div
                  key={res.id}
                  className="bg-slate-700/50 p-3 rounded border border-slate-700 flex justify-between items-center text-sm"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-300" />
                      <span className="text-slate-200 font-medium">
                        {res.customer_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({res.pax} pax)
                      </span>
                    </div>
                    {res.location && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 ml-1">
                        <MapPin className="h-3 w-3" />
                        <span>{res.location}</span>
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-indigo-200 font-bold">
                    {new Date(res.reservation_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}{" "}
                    hs
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">
                Sin reservas para hoy.
              </p>
            )}
          </div>
        </div>

        {/* WIDGET DE HORARIOS */}
        <WorkScheduleWidget schedules={schedules} />
      </div>

      {/* SECCIÓN STOCK DE HIELO */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Informe Hielístico
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hielo.length > 0 ? (
            hielo.map((item, index) => (
              <div
                key={index}
                className={`flex flex-col items-center justify-center gap-2 text-center ${
                  index % 2 !== 0 ? "lg:col-start-3" : ""
                }`}
              >
                <Snowflake className="h-12 w-12 text-cyan-300" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-300">
                    {item.nombre_completo_hielo}
                  </h3>
                  <p className="text-4xl font-bold text-white font-mono">
                    {parseFloat(item.total_unidades).toFixed(2)}
                    <span className="text-xl font-medium text-slate-400 ml-2">
                      {item.unidad_medida}
                    </span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 col-span-full text-center">
              No se encontraron items en la categoría "HIELO".
            </p>
          )}
        </div>
      </div>

      {/* ALERTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AlertCard
          title="Poco Stock"
          items={alerts.lowStock}
          icon={AlertTriangle}
          colorClass="border-yellow-500"
        />
        <AlertCard
          title="Agotado"
          items={alerts.outOfStock}
          icon={XCircle}
          colorClass="border-red-500"
        />
      </div>
    </div>
  );
}
