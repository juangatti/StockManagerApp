// src/components/organisms/InventoryTable.jsx
import useStockStore from "../../stores/useStockStore";
import Card from "../atoms/Card";
import Spinner from "../atoms/Spinner"; // Importar Spinner

// Ahora recibe 'loading' como prop
export default function InventoryTable({ loading }) {
  // Obtenemos solo los items y el error del store
  const { stockItems, error, stockSearchQuery } = useStockStore();

  // El error se maneja en la página padre (InventoryPage)
  // if (error) return <Alert message={error} />;

  return (
    <Card>
      <div className="overflow-x-auto relative">
        {/* Indicador de carga sutil */}
        {loading && (
          <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center z-10">
            <Spinner />
          </div>
        )}
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs uppercase bg-slate-700 text-slate-400">
            <tr>
              <th scope="col" className="py-3 px-6">
                Item
              </th>
              <th scope="col" className="py-3 px-6">
                Categoría
              </th>
              <th scope="col" className="py-3 px-6 text-center">
                Stock (Unidades)
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Mensaje si no hay items */}
            {!loading && stockItems.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-8 text-slate-500">
                  {stockSearchQuery
                    ? "No se encontraron items."
                    : "No hay items para mostrar."}
                </td>
              </tr>
            ) : (
              stockItems.map((item) => (
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
                  <td className="py-4 px-6 text-center font-mono font-bold">
                    {item.stock_unidades.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
