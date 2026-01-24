import React, { useState, useEffect } from "react";
import api from "../api/api";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Beer,
  Utensils,
  Wine,
  Hammer,
} from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../components/atoms/Spinner";

export default function FinancialDashboardPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMonthly: 0,
    byCategory: {
      cerveza: 0,
      comida: 0,
      bebidas: 0,
      mantenimiento: 0,
    },
  });

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.get("/keg-management/purchases");
      setPurchases(res.data);
      calculateStats(res.data);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Error al cargar datos financieros.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyData = data.filter((p) => {
      const pDate = new Date(p.invoice_date);
      return (
        pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear
      );
    });

    const total = monthlyData.reduce(
      (sum, p) => sum + parseFloat(p.total_amount),
      0,
    );

    const catTotals = { cerveza: 0, comida: 0, bebidas: 0, mantenimiento: 0 };
    monthlyData.forEach((p) => {
      if (catTotals.hasOwnProperty(p.main_category)) {
        catTotals[p.main_category] += parseFloat(p.total_amount);
      }
    });

    setStats({ totalMonthly: total, byCategory: catTotals });
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary font-display uppercase tracking-tight">
            Dashboard{" "}
            <span className="text-primary text-outline-sm">Financiero</span>
          </h1>
          <p className="text-text-muted text-sm font-medium uppercase tracking-widest mt-1">
            Control de Gastos y Compras Unificadas
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl shadow-sm border border-gray-100">
          <button className="px-4 py-2 text-xs font-bold uppercase tracking-tighter bg-primary text-white rounded-lg shadow-md">
            Este Mes
          </button>
          <button
            className="px-4 py-2 text-xs font-bold uppercase tracking-tighter text-text-muted hover:bg-gray-50 rounded-lg transition-all"
            disabled
          >
            Histórico
          </button>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Gasto Total Mes"
          value={`$ ${stats.totalMonthly.toLocaleString()}`}
          subValue="+12% vs mes anterior"
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          title="Inversión Cerveza"
          value={`$ ${stats.byCategory.cerveza.toLocaleString()}`}
          subValue="Barriles y estilos"
          icon={Beer}
          color="accent"
        />
        <StatCard
          title="Insumos Cocina"
          value={`$ ${stats.byCategory.comida.toLocaleString()}`}
          subValue="Stock de mercadería"
          icon={Utensils}
          color="green"
        />
        <StatCard
          title="Stock Bebidas"
          value={`$ ${stats.byCategory.bebidas.toLocaleString()}`}
          subValue="Barra y refrescos"
          icon={Wine}
          color="blue"
        />
      </div>

      {/* RECENT PURCHASES TABLE */}
      <div className="bg-surface rounded-2xl shadow-(--shadow-card) border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-sm font-black text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Registro de Facturas
          </h2>
          <button className="p-2 text-gray-400 hover:text-primary transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-text-muted uppercase bg-white border-b border-gray-100">
              <tr>
                <th className="px-8 py-4 font-black">Fecha</th>
                <th className="px-8 py-4 font-black">Proveedor</th>
                <th className="px-8 py-4 font-black">Nro Factura</th>
                <th className="px-8 py-4 font-black">Categoría</th>
                <th className="px-8 py-4 font-black text-right">Monto</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 border-t-0">
              {purchases.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-8 py-12 text-center text-gray-400 italic"
                  >
                    No se encontraron facturas registradas.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr
                    key={p.id}
                    className="group hover:bg-gray-50/80 transition-all duration-300"
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-300" />
                        <span className="font-mono text-gray-700">
                          {new Date(p.invoice_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-bold text-text-primary text-sm tracking-tight">
                        {p.supplier_name}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-mono text-xs text-text-muted">
                      {p.invoice_number}
                    </td>
                    <td className="px-8 py-5">
                      <CategoryBadge category={p.main_category} />
                    </td>
                    <td className="px-8 py-5 text-right font-black text-text-primary text-base">
                      $ {parseFloat(p.total_amount).toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-gray-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
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

function StatCard({ title, value, subValue, icon: Icon, color }) {
  const colors = {
    primary: "bg-primary text-white ring-red-100",
    accent: "bg-orange-500 text-white ring-orange-100",
    green: "bg-emerald-500 text-white ring-emerald-100",
    blue: "bg-sky-600 text-white ring-sky-100",
  };

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-(--shadow-card) border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div
        className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ${colors[color]}`}
      />

      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]} shadow-lg ring-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="flex items-center text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-tighter">
          <ArrowUpRight className="h-3 w-3 mr-0.5" /> 12%
        </span>
      </div>

      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">
        {title}
      </p>
      <h3 className="text-2xl font-black text-text-primary tracking-tighter">
        {value}
      </h3>
      <p className="text-xs text-text-muted mt-2 font-medium italic opacity-70">
        {subValue}
      </p>
    </div>
  );
}

function CategoryBadge({ category }) {
  const configs = {
    cerveza: {
      bg: "bg-orange-50 text-orange-700 border-orange-200",
      icon: Beer,
      label: "Cerveza",
    },
    comida: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: Utensils,
      label: "Comida",
    },
    bebidas: {
      bg: "bg-sky-50 text-sky-700 border-sky-200",
      icon: Wine,
      label: "Bebidas",
    },
    mantenimiento: {
      bg: "bg-slate-50 text-slate-700 border-slate-200",
      icon: Hammer,
      label: "Mant.",
    },
  };

  const config = configs[category] || configs.mantenimiento;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-tight ${config.bg}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
