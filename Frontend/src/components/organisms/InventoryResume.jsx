import { useState, useEffect, use } from "react";
import axios from "axios";
import StatCard from "../atoms/StatCard";
import Spinner from "../atoms/Spinner";

export default function InventoryResume() {
  const [totales, setTotales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/stock/totales")
      .then((response) => setTotales(response.data))
      .catch((error) => {
        console.error("Hubo un error al obtener los totales:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
      {totales.map((item) => (
        <StatCard
          key={item.display_nombre}
          label={item.display_nombre}
          value={item.total_litros.toFixed(2)}
          unit="Lts"
        />
      ))}
    </div>
  );
}
