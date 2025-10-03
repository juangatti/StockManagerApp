import { useEffect } from "react";
import useStockStore from "../stores/useStockStore";
import InventoryTable from "../components/organisms/InventoryTable";
import InventoryResume from "../components/organisms/InventoryResume";
import Spinner from "../components/atoms/Spinner";

export default function InventoryPage() {
  const { fetchStock, loading } = useStockStore();

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      <InventoryTable />
      <InventoryResume />
    </>
  );
}
