import { useState, useEffect } from "react";
import api from "../../../api/api";
import {
  Beer,
  GlassWater,
  Percent,
  Activity,
  Plus,
  Check,
  X,
} from "lucide-react";
import Spinner from "../atoms/Spinner";
import toast from "react-hot-toast";

export default function ActiveTapsWidget() {
  const [taps, setTaps] = useState([]);
  const [availableKegs, setAvailableKegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningTap, setAssigningTap] = useState(null); // Tap number being assigned
  const [selectedKegId, setSelectedKegId] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tapsRes, kegsRes] = await Promise.all([
        api.get("/keg-management/kegs?status=TAPPED"),
        api.get("/keg-management/kegs?status=STORED"),
      ]);
      setTaps(tapsRes.data);
      setAvailableKegs(kegsRes.data);
    } catch (error) {
      console.error("Error fetching tap data:", error);
      toast.error("Error al cargar datos de canillas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignClick = (tapNumber) => {
    setAssigningTap(tapNumber);
    setSelectedKegId("");
  };

  const handleCancelAssign = () => {
    setAssigningTap(null);
    setSelectedKegId("");
  };

  const handleConfirmAssign = async (tapNumber) => {
    if (!selectedKegId) return;
    try {
      await api.put(`/keg-management/kegs/${selectedKegId}/tap`, {
        tap_number: tapNumber,
      });
      toast.success(`Barril asignado a canilla #${tapNumber}`);
      setAssigningTap(null);
      fetchData(); // Refresh all data
    } catch (error) {
      console.error("Error assigning tap:", error);
      toast.error(error.response?.data?.message || "Error al asignar canilla");
    }
  };

  const handleEmptyTap = async (kegId, tapNumber) => {
    if (
      !window.confirm(`¿Seguro que quieres liberar la canilla #${tapNumber}?`)
    )
      return;
    try {
      await api.put(`/keg-management/kegs/${kegId}/empty`);
      toast.success(`Canilla #${tapNumber} liberada.`);
      fetchData();
    } catch (error) {
      console.error("Error emptying tap:", error);
      toast.error("Error al vaciar canilla");
    }
  };

  // Generate 12 slots
  const slots = Array.from({ length: 12 }, (_, i) => i + 1);

  if (loading && taps.length === 0) return <Spinner />;

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
        <Beer className="h-8 w-8 text-amber-500" />
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Canillas</h2>
          <p className="text-sm text-slate-400">
            Vista general de las 12 canillas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {slots.map((slotNum) => {
          const activeKeg = taps.find((t) => t.tap_number === slotNum);
          const isAssigning = assigningTap === slotNum;

          return (
            <div
              key={slotNum}
              className={`rounded-lg p-4 border relative transition-colors h-48 flex flex-col justify-between ${
                activeKeg
                  ? "bg-slate-700/50 border-slate-600 hover:border-amber-500/50"
                  : "bg-slate-800/50 border-dashed border-slate-600 hover:border-slate-500"
              }`}
            >
              {/* Tap Number Badge */}
              <div
                className={`absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-xs font-bold ${
                  activeKeg
                    ? "bg-amber-600 text-white"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                #{slotNum}
              </div>

              {activeKeg ? (
                <>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight mb-1 truncate">
                      {activeKeg.style_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mb-2">
                      {activeKeg.code}
                    </p>
                    <div className="flex gap-3 text-xs text-slate-300 mb-2">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-green-400" />{" "}
                        {activeKeg.ibu}
                      </span>
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3 text-blue-400" />{" "}
                        {activeKeg.abv}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center gap-1 text-amber-200/80 text-xs mb-3">
                      <GlassWater className="h-3 w-3" />
                      <span className="truncate">
                        {activeKeg.glassware_name || "Genérico"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEmptyTap(activeKeg.id, slotNum)}
                      className="w-full py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded border border-transparent hover:border-red-900/30"
                    >
                      Vaciar / Liberar
                    </button>
                  </div>
                </>
              ) : isAssigning ? (
                <div className="flex flex-col h-full justify-center gap-2">
                  <p className="text-xs text-slate-400 mb-1">
                    Seleccionar Barril:
                  </p>
                  <select
                    className="bg-slate-900 border border-slate-600 text-white text-xs rounded p-1 w-full focus:outline-none focus:border-sky-500"
                    value={selectedKegId}
                    onChange={(e) => setSelectedKegId(e.target.value)}
                    autoFocus
                  >
                    <option value="">-- Elegir --</option>
                    {availableKegs.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.style_name} ({k.code})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleConfirmAssign(slotNum)}
                      disabled={!selectedKegId}
                      className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-1 rounded flex justify-center items-center disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelAssign}
                      className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-1 rounded flex justify-center items-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                  <span className="text-xs uppercase font-semibold tracking-wider">
                    Libre
                  </span>
                  <button
                    onClick={() => handleAssignClick(slotNum)}
                    className="p-2 rounded-full border-2 border-slate-600 text-slate-400 hover:text-sky-400 hover:border-sky-400 transition-all hover:scale-110"
                    title="Asignar barril"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
