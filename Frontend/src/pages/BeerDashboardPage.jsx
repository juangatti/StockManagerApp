import React, { useState, useEffect } from "react";
import api from "../api/api";
import {
  Beer,
  Clock,
  History,
  BarChart3,
  Calendar,
  Timer,
  AlertCircle,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../components/atoms/Spinner";

export default function BeerDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/keg-management/stats/performance");
      setData(res.data);
    } catch (error) {
      console.error("Error fetching beer stats:", error);
      toast.error("Error al cargar métricas de cerveza.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  const formatDuration = (hours) => {
    if (hours < 24) return `${hours} hs`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary font-display uppercase tracking-tight flex items-center gap-3">
            <Beer className="text-primary h-8 w-8" />
            Performance{" "}
            <span className="text-primary text-outline-sm">Barriles</span>
          </h1>
          <p className="text-text-muted text-sm font-medium uppercase tracking-widest mt-1">
            Análisis de rotación y tiempos de pinchado
          </p>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Duración Promedio"
          value={formatDuration(
            Math.round(data?.summary?.avg_duration_hours || 0),
          )}
          footer="Tiempo total en canilla"
          icon={Timer}
          color="primary"
        />
        <MetricCard
          title="Barriles Analizados"
          value={data?.summary?.total_kegs_recorded || 0}
          footer="Últimos vaciados registrados"
          icon={History}
          color="accent"
        />
        <MetricCard
          title="Rotación de Canillas"
          value="Alta"
          footer="Basado en frecuencia semanal"
          icon={BarChart3}
          color="green"
        />
      </div>

      {/* DETAILED LIST */}
      <div className="bg-surface rounded-2xl shadow-(--shadow-card) border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <h2 className="text-sm font-black text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Historial de Duraciones
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-text-muted uppercase bg-white border-b border-gray-100">
              <tr>
                <th className="px-8 py-4 font-black">Estilo / Código</th>
                <th className="px-8 py-4 font-black">Pinchado</th>
                <th className="px-8 py-4 font-black">Vaciado</th>
                <th className="px-8 py-4 font-black text-center">
                  Duración Total
                </th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 border-t-0">
              {data?.kegs?.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-8 py-12 text-center text-gray-400 italic"
                  >
                    No hay registros de barriles vaciados.
                  </td>
                </tr>
              ) : (
                data?.kegs?.map((keg) => (
                  <tr
                    key={keg.id}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary text-sm uppercase tracking-tight">
                          {keg.style_fantasy_name || keg.style_name}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">
                          {keg.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-text-secondary">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 opacity-30" />
                        {new Date(keg.tapped_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-text-secondary">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="h-3 w-3 text-red-400" />
                        {new Date(keg.emptied_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center">
                        <span
                          className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter shadow-sm border ${
                            keg.duration_hours >
                            data.summary.avg_duration_hours * 1.5
                              ? "bg-red-50 text-red-700 border-red-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-100"
                          }`}
                        >
                          {formatDuration(keg.duration_hours)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-all" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, footer, icon: Icon, color }) {
  const colors = {
    primary: "from-red-500 to-primary",
    accent: "from-orange-400 to-orange-600",
    green: "from-emerald-400 to-emerald-600",
  };

  return (
    <div className="bg-surface p-8 rounded-2xl shadow-(--shadow-card) border border-gray-100 overflow-hidden relative group">
      <div
        className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${colors[color]}`}
      />

      <div className="flex justify-between items-start mb-6">
        <Icon
          className={`h-8 w-8 opacity-20 group-hover:opacity-40 transition-opacity`}
        />
        {/* Decorative background icon */}
        <Icon
          className={`h-32 w-32 absolute -right-8 -bottom-8 opacity-5 text-gray-900 pointer-events-none`}
        />
      </div>

      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">
        {title}
      </p>
      <h3 className="text-4xl font-black text-text-primary tracking-tighter mb-2">
        {value}
      </h3>
      <p className="text-xs text-text-muted font-medium italic opacity-70 border-t border-gray-50 pt-4 mt-4">
        {footer}
      </p>
    </div>
  );
}
