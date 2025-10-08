import { useState, useEffect } from "react";
import api from "../../api/api";
import StatCard from "../atoms/StatCard";
import Spinner from "../atoms/Spinner";

export default function PrebatchesResume() {
  const [totales, setTotales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/prebatches/totals")
      .then((response) => setTotales(response.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
      {totales.map((item) => (
        <StatCard
          key={item.nombre_prebatch}
          label={item.nombre_prebatch}
          value={item.total_litros.toFixed(2)}
          unit="Lts"
        />
      ))}
    </div>
  );
}
