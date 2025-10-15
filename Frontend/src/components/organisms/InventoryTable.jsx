// src/components/organisms/InventoryTable.jsx
import useStockStore from "../../stores/useStockStore";
import Alert from "../atoms/Alert";
import Card from "../atoms/Card";

export default function InventoryTable() {
  const { stockItems, error } = useStockStore();

  if (error) return <Alert message={error} />;

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs uppercase bg-slate-700 text-slate-400">
            <tr>
              <th scope="col" className="py-3 px-6">
                Item
              </th>
              <th scope="col" className="py-3 px-6">
                Categoría
              </th>
              <th scope="col" className="py-3 px-6">
                Stock (Unidades)
              </th>
              {/* Columna de Prioridad eliminada */}
            </tr>
          </thead>
          <tbody>
            {stockItems.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-700 hover:bg-slate-600"
              >
                <th
                  scope="row"
                  className="py-4 px-6 font-medium whitespace-nowrap text-white"
                >
                  {item.nombre_completo}
                </th>
                <td className="py-4 px-6">{item.nombre_categoria}</td>
                <td className="py-4 px-6 font-mono font-bold">
                  {item.stock_unidades.toFixed(2)}
                </td>
                {/* Celda de Prioridad eliminada */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
