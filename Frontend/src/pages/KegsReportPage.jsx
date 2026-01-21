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
    <div className="p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-display uppercase tracking-wide flex items-center gap-2">
              <Beer className="h-8 w-8 text-amber-500" /> Reporte de Barriles
            </h1>
            <p className="text-text-muted text-sm font-medium">
              Visualiza y gestiona el estado de todos los barriles.
            </p>
          </div>
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
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
            title="Recargar"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold uppercase text-sm tracking-wider transition-all shadow-sm"
          >
            <Download className="h-5 w-5" /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface p-4 rounded-lg shadow-(--shadow-card) mb-6 flex flex-wrap gap-4 items-center border border-gray-100">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código o estilo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-text-primary focus:ring-primary focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg text-text-primary py-2 px-4 focus:ring-primary focus:border-primary cursor-pointer transition-all shadow-sm"
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
      <div className="bg-surface rounded-lg shadow-(--shadow-card) overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-gray-50 text-xs uppercase text-text-secondary font-display tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold">ID / Código</th>
                  <th className="px-6 py-4 font-bold">Estilo</th>
                  <th className="px-6 py-4 text-center font-bold">IBU / ABV</th>
                  <th className="px-6 py-4 font-bold">Cristalería</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 font-bold">Ubicación</th>
                  <th className="px-6 py-4 text-right font-bold">Volumen</th>
                  <th className="px-6 py-4 text-center font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredKegs.map((keg) => (
                  <tr
                    key={keg.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary">
                        #{keg.id}
                      </div>
                      <div className="text-xs text-text-muted font-mono font-bold">
                        {keg.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-text-primary">
                      {keg.style_fantasy_name || keg.style_name}
                      {keg.style_fantasy_name && (
                        <span className="text-xs text-text-muted block">
                          ({keg.style_name})
                        </span>
                      )}
                      <div className="text-xs text-text-muted mt-1 uppercase font-bold tracking-tighter">
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
                        <span className="text-text-muted italic">N/A</span>
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
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          Canilla #{keg.tap_number}
                        </div>
                      ) : (
                        <span className="text-text-muted font-medium">
                          Depósito
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-text-primary font-mono font-bold">
                        {keg.current_volume} L
                      </div>
                      <div className="text-xs text-text-muted font-medium">
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
              <div className="p-12 text-center text-text-muted font-medium italic">
                No se encontraron barriles con los filtros actuales.
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 font-display uppercase tracking-wide">
                <Plus className="h-5 w-5 text-primary" />
                Alta Manual de Barril
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-primary transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                    Código Identificador *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={newKeg.code}
                    onChange={handleCreateChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm placeholder:text-gray-400"
                    placeholder="#KEY123"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                    Volumen Inicial (L) *
                  </label>
                  <input
                    type="number"
                    name="initial_volume"
                    value={newKeg.initial_volume}
                    onChange={handleCreateChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm placeholder:text-gray-400"
                    placeholder="50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Estilo de Cerveza *
                </label>
                <select
                  name="style_id"
                  value={newKeg.style_id}
                  onChange={handleCreateChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm cursor-pointer"
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
                <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Proveedor *
                </label>
                <select
                  name="supplier_id"
                  value={newKeg.supplier_id}
                  onChange={handleCreateChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm cursor-pointer"
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

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                    Costo ($)
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={newKeg.cost}
                    onChange={handleCreateChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm placeholder:text-gray-400"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                    Fecha de Compra
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={newKeg.purchase_date}
                    onChange={handleCreateChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-text-primary focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-lg text-text-secondary font-bold hover:bg-gray-100 transition-colors uppercase text-sm tracking-wide"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold transition-all shadow-lg shadow-red-500/10 uppercase text-sm tracking-widest"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 font-display uppercase tracking-wide">
                <Link className="h-5 w-5" /> Conectar Barril
              </h3>
              <button
                onClick={() => setIsTapModalOpen(false)}
                className="text-text-muted hover:text-primary transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-xs font-bold text-text-muted mb-1 uppercase tracking-wider">
                  Barril Seleccionado:
                </p>
                <p className="text-text-primary font-bold text-xl leading-tight">
                  {selectedTapKeg.style_fantasy_name ||
                    selectedTapKeg.style_name}
                </p>
                <p className="text-xs text-text-muted font-mono mt-1 font-bold">
                  {selectedTapKeg.code}
                </p>
              </div>

              <form onSubmit={handleTapSubmit}>
                <label className="block text-xs font-bold text-text-secondary mb-3 uppercase tracking-wider">
                  Seleccionar Canilla (1-12)
                </label>
                <div className="grid grid-cols-4 gap-2.5 mb-8">
                  {[...Array(12)].map((_, i) => {
                    const num = i + 1;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTapNumber(num)}
                        className={`py-2 rounded-lg font-bold transition-all border ${
                          tapNumber === num
                            ? "bg-primary border-primary text-white shadow-lg shadow-red-500/20 scale-105"
                            : "bg-white border-gray-200 text-text-secondary hover:border-primary hover:text-primary"
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
                  className="w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-widest text-sm"
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
