import StatCard from "../atoms/StatCard";
import useStockStore from "../../stores/useStockStore";

export default function InventoryResume() {
  const { stockTotals, loading } = useStockStore();
  if (loading) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
      {stockTotals.map((item) => (
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
