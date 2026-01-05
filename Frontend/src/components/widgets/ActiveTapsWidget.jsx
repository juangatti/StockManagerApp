import { useState, useEffect } from "react";
import api from "../../../api/api";
import { Beer, GlassWater, Percent, Activity } from "lucide-react";
import Spinner from "../atoms/Spinner";

export default function ActiveTapsWidget() {
  const [taps, setTaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaps = async () => {
      try {
        const response = await api.get("/keg-management/kegs?status=TAPPED");
        // Ordenar por número de canilla si existe
        const sortedTaps = response.data.sort(
          (a, b) => (a.tap_number || 999) - (b.tap_number || 999)
        );
        setTaps(sortedTaps);
      } catch (error) {
        console.error("Error fetching active taps:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTaps();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
        <Beer className="h-8 w-8 text-amber-500" />
        <div>
          <h2 className="text-2xl font-bold text-white">Canillas Activas</h2>
          <p className="text-sm text-slate-400">
            Barriles actualmente pinchados
          </p>
        </div>
      </div>

      {taps.length === 0 ? (
        <p className="text-center text-slate-500 py-8">
          No hay barriles pinchados actualmente.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taps.map((tap) => (
            <div
              key={tap.id}
              className="bg-slate-700/50 rounded-lg p-5 border border-slate-600 relative overflow-hidden group hover:border-amber-500/50 transition-colors"
            >
              {/* Tap Number Badge */}
              <div className="absolute top-0 right-0 bg-amber-600 text-white font-bold px-3 py-1 rounded-bl-lg text-sm">
                Canilla #{tap.tap_number || "?"}
              </div>

              {/* Beer Name */}
              <h3 className="text-xl font-bold text-white mb-1 truncate pr-8">
                {tap.style_name}
              </h3>
              <p className="text-xs text-slate-400 mb-4 font-mono">
                Code: {tap.code}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <Activity className="h-4 w-4 text-green-400" />
                  <span className="font-mono font-bold">{tap.ibu || "-"}</span>
                  <span className="text-xs text-slate-500">IBU</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Percent className="h-4 w-4 text-blue-400" />
                  <span className="font-mono font-bold">{tap.abv || "-"}%</span>
                  <span className="text-xs text-slate-500">ABV</span>
                </div>
              </div>

              {/* Glassware */}
              <div className="flex items-center gap-2 text-amber-200 bg-amber-900/20 p-2 rounded-md">
                <GlassWater className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {tap.glassware_name || "Vaso Genérico"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
