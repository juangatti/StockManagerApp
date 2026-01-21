import { useState, useEffect } from "react";
import api from "../api/api";
import {
  Search,
  Filter,
  Beer,
  Download,
  RefreshCcw,
  Plus,
  X,
  Save,
  Link,
  Unplug,
} from "lucide-react";
import Spinner from "../components/atoms/Spinner";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function KegsReportPage() {
  const [kegs, setKegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [styles, setStyles] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [newKeg, setNewKeg] = useState({
    code: "",
    style_id: "",
    supplier_id: "",
    initial_volume: "",
    cost: "",
    purchase_date: new Date().toISOString().split("T")[0],
  });

  // Tap Modal State
  const [isTapModalOpen, setIsTapModalOpen] = useState(false);
  const [selectedTapKeg, setSelectedTapKeg] = useState(null);
  const [tapNumber, setTapNumber] = useState("");

  useEffect(() => {
    fetchKegs();
    fetchOptions();
  }, []);

  const fetchKegs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/keg-management/kegs");
      setKegs(response.data);
    } catch (error) {
      console.error("Error fetching kegs:", error);
      toast.error("Error al cargar barriles");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [stylesRes, suppliersRes] = await Promise.all([
        api.get("/keg-management/styles"),
        api.get("/keg-management/suppliers"),
      ]);
      setStyles(stylesRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  const handleCreateChange = (e) => {
    setNewKeg({ ...newKeg, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (
      !newKeg.style_id ||
      !newKeg.supplier_id ||
      !newKeg.code ||
      !newKeg.initial_volume
    ) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    try {
      await api.post("/keg-management/kegs", {
        ...newKeg,
        style_id: parseInt(newKeg.style_id),
        supplier_id: parseInt(newKeg.supplier_id),
        initial_volume: parseFloat(newKeg.initial_volume),
        cost: parseFloat(newKeg.cost) || 0,
      });
      toast.success("Barril creado exitosamente");
      setIsModalOpen(false);
      setNewKeg({
        code: "",
        style_id: "",
        supplier_id: "",
        initial_volume: "",
        cost: "",
        purchase_date: new Date().toISOString().split("T")[0],
      });
      fetchKegs();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error al crear barril");
    }
  };

  const openTapModal = (keg) => {
    setSelectedTapKeg(keg);
    setTapNumber("");
    setIsTapModalOpen(true);
  };

  const handleTapSubmit = async (e) => {
    e.preventDefault();
    if (!tapNumber || !selectedTapKeg) return;

    try {
      await api.put(`/keg-management/kegs/${selectedTapKeg.id}/tap`, {
        tap_number: parseInt(tapNumber),
      });
      toast.success(`Barril conectado a canilla ${tapNumber}`);
      setIsTapModalOpen(false);
      fetchKegs();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error al conectar barril");
    }
  };

  const handleUntap = async (keg) => {
    if (!window.confirm(`¿Seguro que deseas desconectar el barril #${keg.id}?`))
      return;
    try {
      // Assuming 'empty' marks it as empty. If user just wants to unassign without emptying, we might need a different endpoint.
      // But typically untapping implies finishing it or moving it.
      // Based on kegController, we have 'emptyKeg' which sets status=EMPTY and tap=NULL.
      // If user just wants to swap, they would tap another one.
      // Let's assume the button is for "Vaciar/Desconectar".
      await api.put(`/keg-management/kegs/${keg.id}/empty`);
      toast.success("Barril desconectado/vaciado");
      fetchKegs();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error al desconectar");
    }
  };

  const filteredKegs = kegs.filter((keg) => {
    const matchesSearch =
      keg.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      keg.style_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || keg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredKegs.map((k) => ({
        ID: k.id,
        Código: k.code,
        Estilo: k.style_fantasy_name || k.style_name,
        IBU: k.ibu,
        ABV: k.abv,
        Cristalería: k.glassware_name || "-",
        Estado: k.status,
        "Ubicación/Canilla": k.tap_number ? `Canilla #${k.tap_number}` : "-",
        "Vol. Inicial (L)": k.initial_volume,
        "Vol. Actual (L)": k.current_volume,
        "Fecha Compra": new Date(k.purchase_date).toLocaleDateString(),
        Proveedor: k.supplier_name,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Barriles");
    XLSX.writeFile(wb, "Reporte_Barriles.xlsx");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "TAPPED":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "STORED":
        return "bg-sky-500/20 text-sky-400 border-sky-500/50";
      case "EMPTY":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "RETURNED":
        return "bg-slate-500/20 text-slate-400 border-slate-500/50";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] font-display uppercase tracking-wide flex items-center gap-2">
            <Beer className="h-8 w-8 text-amber-500" /> Reporte de Barriles
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Visualiza y gestiona el estado de todos los barriles.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <Plus className="h-5 w-5" /> Nuevo Barril
          </button>
          <button
            onClick={fetchKegs}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
            title="Recargar"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <Download className="h-5 w-5" /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-surface)] p-4 rounded-lg shadow-[var(--shadow-card)] mb-6 flex flex-wrap gap-4 items-center border border-gray-100">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código o estilo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg text-gray-800 py-2 px-4 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="STORED">En Depósito</option>
            <option value="TAPPED">Pinchados</option>
            <option value="EMPTY">Vacíos</option>
            <option value="RETURNED">Devueltos</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface)] rounded-lg shadow-[var(--shadow-card)] overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">ID / Código</th>
                  <th className="px-6 py-4">Estilo</th>
                  <th className="px-6 py-4 text-center">IBU / ABV</th>
                  <th className="px-6 py-4">Cristalería</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Ubicación</th>
                  <th className="px-6 py-4 text-right">Volumen</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredKegs.map((keg) => (
                  <tr
                    key={keg.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-[var(--color-text-primary)]">
                        #{keg.id}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] font-mono">
                        {keg.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[var(--color-text-primary)]">
                      {keg.style_fantasy_name || keg.style_name}
                      {keg.style_fantasy_name && (
                        <span className="text-xs text-[var(--color-text-muted)] block">
                          ({keg.style_name})
                        </span>
                      )}
                      <div className="text-xs text-[var(--color-text-muted)] mt-1">
                        Prov: {keg.supplier_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-green-700 border border-green-200">
                          {keg.ibu} IBU
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-blue-700 border border-blue-200">
                          {keg.abv}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {keg.glassware_name || (
                        <span className="text-slate-600 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                          keg.status,
                        )}`}
                      >
                        {keg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {keg.status === "TAPPED" ? (
                        <div className="flex items-center gap-2 text-amber-400 font-bold">
                          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          Canilla #{keg.tap_number}
                        </div>
                      ) : (
                        <span className="text-slate-500">Depósito</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-[var(--color-text-primary)] font-mono">
                        {keg.current_volume} L
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        de {keg.initial_volume} L
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {keg.status === "STORED" && (
                        <button
                          onClick={() => openTapModal(keg)}
                          className="bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 mx-auto"
                          title="Pinchar en Canilla"
                        >
                          <Link className="h-3 w-3" /> Pinchar
                        </button>
                      )}
                      {keg.status === "TAPPED" && (
                        <button
                          onClick={() => handleUntap(keg)}
                          className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 mx-auto"
                          title="Desconectar / Vaciar"
                        >
                          <Unplug className="h-3 w-3" /> Desconectar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredKegs.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No se encontraron barriles con los filtros actuales.
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" />
                Alta Manual de Barril
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Código Identificador *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={newKeg.code}
                    onChange={handleCreateChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="#KEY123"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Volumen Inicial (L) *
                  </label>
                  <input
                    type="number"
                    name="initial_volume"
                    value={newKeg.initial_volume}
                    onChange={handleCreateChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Estilo de Cerveza *
                </label>
                <select
                  name="style_id"
                  value={newKeg.style_id}
                  onChange={handleCreateChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Seleccionar Estilo --</option>
                  {styles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.fantasy_name ? `(${s.fantasy_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Proveedor *
                </label>
                <select
                  name="supplier_id"
                  value={newKeg.supplier_id}
                  onChange={handleCreateChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Seleccionar Proveedor --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contact_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Costo ($)
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={newKeg.cost}
                    onChange={handleCreateChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Fecha de Compra
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={newKeg.purchase_date}
                    onChange={handleCreateChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20"
                >
                  Guardar Barril
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAP ASSIGNMENT MODAL */}
      {isTapModalOpen && selectedTapKeg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-sm overflow-hidden transform transition-all">
            <div className="bg-amber-500/10 px-6 py-4 border-b border-amber-500/20 flex justify-between items-center">
              <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                <Link className="h-5 w-5" /> Conectar Barril
              </h3>
              <button
                onClick={() => setIsTapModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-1">
                  Barril Seleccionado:
                </p>
                <p className="text-white font-medium text-lg">
                  {selectedTapKeg.style_fantasy_name ||
                    selectedTapKeg.style_name}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedTapKeg.code}
                </p>
              </div>

              <form onSubmit={handleTapSubmit}>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Seleccionar Canilla (1-12)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[...Array(12)].map((_, i) => {
                    const num = i + 1;
                    // In a real app, we might want to disable occupied taps, but we don't have that list here easily without fetching all active taps.
                    // The backend will validation will handle it.
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTapNumber(num)}
                        className={`py-2 rounded font-bold transition-all ${
                          tapNumber === num
                            ? "bg-amber-500 text-black shadow-lg shadow-amber-500/50 scale-105"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={!tapNumber}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded shadow-lg shadow-amber-500/20 transition-all"
                >
                  Confirmar Conexión
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
