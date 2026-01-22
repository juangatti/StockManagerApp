import { useState, useEffect } from "react";
import api from "../../api/api";
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

export default function ActiveTapsWidget({ readOnly = false }) {
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
    <div className="bg-chalkboard p-8 rounded-xl shadow-2xl border-4 border-[#3d2b1f] relative overflow-hidden">
      {/* Decorative texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dust.png')]"></div>

      <div className="flex items-center gap-4 mb-10 border-b-2 border-dashed border-white/20 pb-6 relative z-10">
        <Beer className="h-10 w-10 text-white/80" />
        <div>
          <h2 className="text-4xl font-chalk text-white tracking-widest uppercase">
            Pizarrón de Canillas
          </h2>
          <p className="text-sm font-chalk text-gray-400 tracking-wider">
            Selección Artesanal - 12 Canillas Activas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
        {slots.map((slotNum) => {
          const activeKeg = taps.find((t) => t.tap_number === slotNum);
          const isAssigning = assigningTap === slotNum;

          return (
            <div
              key={slotNum}
              className={`rounded-lg p-5 border-chalk relative transition-all duration-300 h-56 flex flex-col justify-between group ${
                activeKeg
                  ? "bg-white/5 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:border-white/60"
                  : "bg-black/20 border-dashed border-white/10 hover:border-white/30"
              }`}
            >
              {/* Tap Number Badge - Chalk Style */}
              <div
                className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-chalk border-2 ${
                  activeKeg
                    ? "bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    : "bg-transparent text-white/30 border-white/20"
                }`}
              >
                {slotNum}
              </div>

              {activeKeg ? (
                <>
                  <div className="font-chalk">
                    <h3 className="text-2xl font-black text-white leading-tight mb-1 truncate tracking-tight uppercase">
                      {activeKeg.style_fantasy_name || activeKeg.style_name}
                    </h3>
                    {activeKeg.style_fantasy_name && (
                      <p className="text-xs font-bold text-accent/80 uppercase tracking-widest mb-2 truncate">
                        {activeKeg.style_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/20 text-white/50 font-mono tracking-tighter">
                        CODE: {activeKeg.code}
                      </span>
                    </div>

                    <div className="flex gap-4 text-sm text-gray-300 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-yellow-200/60" />{" "}
                        {activeKeg.ibu} IBU
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-blue-200/60" />{" "}
                        {activeKeg.abv}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-chalk tracking-widest italic">
                      <GlassWater className="h-3 w-3" />
                      <span className="truncate">
                        Copa: {activeKeg.glassware_name || "Estándar"}
                      </span>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => handleEmptyTap(activeKeg.id, slotNum)}
                        className="w-full py-1.5 text-[10px] font-chalk text-white/40 hover:text-white hover:bg-red-900/40 rounded border border-white/10 hover:border-red-500/50 transition-all uppercase tracking-[0.2em]"
                      >
                        Vaciar Canilla
                      </button>
                    )}
                  </div>
                </>
              ) : isAssigning ? (
                <div className="flex flex-col h-full justify-center gap-2 font-chalk">
                  <p className="text-[10px] font-bold text-white/60 mb-1 uppercase tracking-widest">
                    Seleccionar Barril:
                  </p>
                  <select
                    className="bg-black/40 border border-white/20 text-white text-xs rounded p-2 w-full focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50 cursor-pointer shadow-inner appearance-none"
                    value={selectedKegId}
                    onChange={(e) => setSelectedKegId(e.target.value)}
                    autoFocus
                  >
                    <option value="">-- Elige un barril --</option>
                    {availableKegs.map((k) => (
                      <option key={k.id} value={k.id} className="bg-[#1a1a1a]">
                        {k.style_name} ({k.code})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleConfirmAssign(slotNum)}
                      disabled={!selectedKegId}
                      className="flex-1 bg-white hover:bg-gray-200 text-black py-2 rounded flex justify-center items-center disabled:opacity-30 transition-all font-bold"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelAssign}
                      className="flex-1 bg-transparent hover:bg-white/10 text-white border border-white/20 py-2 rounded flex justify-center items-center transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3 group-hover:text-white/40 transition-all font-chalk">
                  <span className="text-[10px] uppercase font-bold tracking-[0.3em]">
                    Libre
                  </span>
                  {!readOnly ? (
                    <button
                      onClick={() => handleAssignClick(slotNum)}
                      className="p-3 rounded-full border-2 border-dashed border-white/20 text-white/20 hover:text-white hover:border-white hover:scale-110 bg-transparent transition-all"
                      title="Asignar barril"
                    >
                      <Plus className="h-8 w-8" />
                    </button>
                  ) : (
                    <div className="p-3 rounded-full border-2 border-dotted border-white/10 bg-white/5">
                      <Beer className="h-8 w-8 opacity-20" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
