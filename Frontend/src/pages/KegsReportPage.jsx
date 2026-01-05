import { useState, useEffect } from "react";
import api from "../api/api";
import { Search, Filter, Beer, Download, RefreshCcw } from "lucide-react";
import Spinner from "../components/atoms/Spinner";
import * as XLSX from "xlsx";

export default function KegsReportPage() {
  const [kegs, setKegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchKegs();
  }, []);

  const fetchKegs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/keg-management/kegs"); // Fetch all kegs
      setKegs(response.data);
    } catch (error) {
      console.error("Error fetching kegs:", error);
    } finally {
      setLoading(false);
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
        Estilo: k.style_name,
        IBU: k.ibu,
        ABV: k.abv,
        Cristalería: k.glassware_name || "-",
        Estado: k.status,
        "Ubicación/Canilla": k.tap_number ? `Canilla #${k.tap_number}` : "-",
        "Vol. Inicial (L)": k.initial_volume,
        "Vol. Actual (L)": k.current_volume,
        "Fecha Compra": new Date(k.purchase_date).toLocaleDateString(),
        Proveedor: k.supplier_name,
      }))
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Beer className="h-8 w-8 text-amber-500" /> Reporte de Barriles
          </h1>
          <p className="text-slate-400 text-sm">
            Visualiza y gestiona el estado de todos los barriles.
          </p>
        </div>
        <div className="flex gap-3">
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
      <div className="bg-slate-800 p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código o estilo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg text-white py-2 px-4 focus:ring-sky-500 focus:border-sky-500"
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
      <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-700/50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">ID / Código</th>
                  <th className="px-6 py-4">Estilo</th>
                  <th className="px-6 py-4 text-center">IBU / ABV</th>
                  <th className="px-6 py-4">Cristalería</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Ubicación</th>
                  <th className="px-6 py-4 text-right">Volumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredKegs.map((keg) => (
                  <tr key={keg.id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">#{keg.id}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {keg.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {keg.style_name}
                      <div className="text-xs text-slate-500">
                        Prov: {keg.supplier_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-green-400 border border-green-500/20">
                          {keg.ibu} IBU
                        </span>
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-blue-400 border border-blue-500/20">
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
                          keg.status
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
                      <div className="text-white font-mono">
                        {keg.current_volume} L
                      </div>
                      <div className="text-xs text-slate-500">
                        de {keg.initial_volume} L
                      </div>
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
    </div>
  );
}
