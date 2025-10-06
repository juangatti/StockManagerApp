// src/pages/DashboardPage.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { Snowflake, Droplets, AlertTriangle, XCircle } from "lucide-react";
import Spinner from "../components/atoms/Spinner";

// Un nuevo átomo para las tarjetas de alerta
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
          <li key={item.id} className="flex justify-between text-slate-300">
            <span>{item.nombre_item}</span>
            <span className="font-mono font-bold">
              {item.stock_unidades.toFixed(2)}
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
  const [hielo, setHielo] = useState(null);
  const [alerts, setAlerts] = useState({ lowStock: [], outOfStock: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [iceRes, alertsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/stock/ice"),
          axios.get("http://localhost:5000/api/stock/alerts"),
        ]);

        const reporteHielo = {
          picado:
            iceRes.data.find((item) =>
              item.nombre_item.toLowerCase().includes("picado")
            )?.stock_unidades || 0,
          rolo:
            iceRes.data.find((item) =>
              item.nombre_item.toLowerCase().includes("rolo")
            )?.stock_unidades || 0,
        };
        setHielo(reporteHielo);
        setAlerts(alertsRes.data);
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
      {/* Informe Hielístico */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
        <h2 className="text-3xl font-bold text-white mb-2">
          Informe Hielístico
        </h2>
        <p className="text-sm text-slate-500 mb-6">Publicado el {fecha}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {hielo && (
            <>
              <div className="flex items-center gap-4">
                <Snowflake className="h-12 w-12 text-cyan-300" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-300">
                    Hielo en Rolo
                  </h3>
                  <p className="text-4xl font-bold text-white font-mono">
                    {hielo.rolo.toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Droplets className="h-12 w-12 text-blue-300" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-300">
                    Hielo Picado
                  </h3>
                  <p className="text-4xl font-bold text-white font-mono">
                    {hielo.picado.toFixed(1)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Categorías de Alertas */}
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
