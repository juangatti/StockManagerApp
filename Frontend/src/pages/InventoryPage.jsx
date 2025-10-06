import { useEffect, useState } from "react";
import useStockStore from "../stores/useStockStore";
import InventoryTable from "../components/organisms/InventoryTable";
import InventoryResume from "../components/organisms/InventoryResume";
import Spinner from "../components/atoms/Spinner";
import ViewSwitcher from "../components/molecules/ViewSwitcher"; // <-- Importar

export default function InventoryPage() {
  const { fetchStock, loading } = useStockStore();
  const [activeView, setActiveView] = useState("resumen"); // 'resumen' o 'detalle'

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Inventario General</h2>
      <ViewSwitcher activeView={activeView} onViewChange={setActiveView} />

      {activeView === "resumen" ? <InventoryResume /> : <InventoryTable />}
    </div>
  );
}
