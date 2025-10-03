// src/pages/InformeHielistico.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { Snowflake, Droplets } from "lucide-react";
import Spinner from "../components/atoms/Spinner";

export default function IceInformation() {
  const [hielo, setHielo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/stock/ice")
      .then((response) => {
        const reporte = {
          picado:
            response.data.find((item) =>
              item.nombre_item.toLowerCase().includes("picado")
            )?.stock_unidades || 0,
          rolo:
            response.data.find((item) =>
              item.nombre_item.toLowerCase().includes("rolo")
            )?.stock_unidades || 0,
        };
        setHielo(reporte);
      })
      .catch((error) =>
        console.error("Error al obtener el reporte hielístico:", error)
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const fecha = new Date().toLocaleDateString("es-AR", { dateStyle: "full" });

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700">
      <header className="text-center border-b-2 border-slate-600 pb-4 mb-6">
        <h1 className="text-5xl font-bold text-sky-400 font-serif">
          El Informe Hielistico
        </h1>
        <p className="text-slate-400 mt-2">Edición Estelar</p>
      </header>

      <article>
        <h2 className="text-3xl font-bold text-white mb-2">
          INFORME HIELÍSTICO
        </h2>
        <p className="text-sm text-slate-500 mb-6">Publicado el {fecha}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Noticia Hielo Rolo */}
          <div className="flex items-center gap-6">
            <Snowflake className="h-16 w-16 text-cyan-300" />
            <div>
              <h3 className="text-xl font-semibold text-slate-300">
                Hielo en Rolo
              </h3>
              <p className="text-6xl font-bold text-white font-mono">
                {hielo.rolo.toFixed(1)}
              </p>
              <span className="text-slate-400">bolsas en existencia</span>
            </div>
          </div>

          {/* Noticia Hielo Picado */}
          <div className="flex items-center gap-6">
            <Droplets className="h-16 w-16 text-blue-300" />
            <div>
              <h3 className="text-xl font-semibold text-slate-300">
                Hielo Picado
              </h3>
              <p className="text-6xl font-bold text-white font-mono">
                {hielo.picado.toFixed(1)}
              </p>
              <span className="text-slate-400">bolsas en existencia</span>
            </div>
          </div>
        </div>

        <footer className="mt-10 pt-4 border-t border-slate-700 text-center text-slate-500 text-xs">
          Un reporte generado automáticamente por MauerApp.
        </footer>
      </article>
    </div>
  );
}
