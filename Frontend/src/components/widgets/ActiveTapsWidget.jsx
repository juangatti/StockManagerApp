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
    <div className="bg-[var(--color-surface)] p-6 rounded-lg shadow-[var(--shadow-card)] border border-gray-200">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <Beer className="h-8 w-8 text-[var(--color-accent)]" />
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-display uppercase tracking-wide">
            Gestión de Canillas
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] font-bold uppercase tracking-wider">
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
              className={`rounded-lg p-4 border relative transition-all duration-200 h-48 flex flex-col justify-between group ${
                activeKeg
                  ? "bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-[var(--color-accent)]"
                  : "bg-gray-50 border-dashed border-gray-300 hover:border-gray-400"
              }`}
            >
              {/* Tap Number Badge */}
              <div
                className={`absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-xs font-bold border-b border-l ${
                  activeKeg
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-gray-200 text-gray-500 border-gray-300"
                }`}
              >
                #{slotNum}
              </div>

              {activeKeg ? (
                <>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight mb-1 truncate font-display">
                      {activeKeg.style_fantasy_name || activeKeg.style_name}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] font-mono mb-2 bg-gray-100 inline-block px-1.5 rounded">
                      {activeKeg.code}
                    </p>
                    <div className="flex gap-3 text-xs text-[var(--color-text-secondary)] mb-2 font-medium">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-green-600" />{" "}
                        {activeKeg.ibu}
                      </span>
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3 text-blue-600" />{" "}
                        {activeKeg.abv}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center gap-1 text-[var(--color-text-muted)] text-xs mb-3">
                      <GlassWater className="h-3 w-3" />
                      <span className="truncate">
                        {activeKeg.glassware_name || "Genérico"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEmptyTap(activeKeg.id, slotNum)}
                      className="w-full py-1.5 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 rounded border border-red-200 hover:border-red-600 transition-colors uppercase tracking-wide"
                    >
                      Vaciar / Liberar
                    </button>
                  </div>
                </>
              ) : isAssigning ? (
                <div className="flex flex-col h-full justify-center gap-2">
                  <p className="text-xs font-bold text-[var(--color-text-secondary)] mb-1 uppercase">
                    Seleccionar Barril:
                  </p>
                  <select
                    className="bg-white border border-gray-300 text-[var(--color-text-primary)] text-xs rounded p-1.5 w-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent cursor-pointer shadow-sm"
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
                      className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white py-1.5 rounded flex justify-center items-center disabled:opacity-50 transition-colors shadow-sm"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelAssign}
                      className="flex-1 bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 py-1.5 rounded flex justify-center items-center transition-colors shadow-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 group-hover:text-gray-500 transition-colors">
                  <span className="text-xs uppercase font-bold tracking-wider">
                    Disponible
                  </span>
                  <button
                    onClick={() => handleAssignClick(slotNum)}
                    className="p-2 rounded-full border-2 border-gray-300 text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all hover:scale-110 bg-white shadow-sm"
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
