// src/components/organisms/InventoryTable.jsx
import useStockStore from "../../stores/useStockStore";
import Card from "../atoms/Card";
import Spinner from "../atoms/Spinner";

export default function InventoryTable({ loading }) {
  const { stockItems, stockSearchQuery } = useStockStore();

  return (
    <Card>
      {/* 1. Mantenemos overflow-x-auto */}
      <div className="overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Spinner />
          </div>
        )}
        <table className="w-full text-sm text-left text-[var(--color-text-primary)]">
          {/* 3. Thead Clean Style */}
          <thead className="text-xs uppercase bg-gray-50 text-[var(--color-text-secondary)] font-display tracking-wider hidden md:table-header-group border-b border-gray-200">
            <tr>
              <th scope="col" className="py-4 px-6 font-semibold">
                Item
              </th>
              <th scope="col" className="py-4 px-6 font-semibold">
                Categoría
              </th>
              <th scope="col" className="py-4 px-6 text-center font-semibold">
                Stock (Unidades)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && stockItems.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
                  {stockSearchQuery
                    ? "No se encontraron items."
                    : "No hay items para mostrar."}
                </td>
              </tr>
            ) : (
              stockItems.map((item) => (
                // 4. TR Clean Style: White bg, subtle hover
                <tr
                  key={item.id}
                  className="block md:table-row mb-2 md:mb-0 bg-white md:bg-transparent rounded-lg md:rounded-none shadow-sm md:shadow-none hover:bg-gray-50 transition-colors"
                >
                  <td
                    data-label="Item"
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 font-medium text-[var(--color-text-primary)] md:whitespace-nowrap border-b md:border-b-0 border-gray-100"
                  >
                    <span className="md:hidden font-bold text-[var(--color-text-secondary)] mr-2 uppercase text-xs">
                      Item:{" "}
                    </span>
                    {item.nombre_completo}
                  </td>
                  <td
                    data-label="Categoría"
                    className="hidden md:table-cell py-3 px-4 md:py-4 md:px-6 md:whitespace-nowrap border-b md:border-b-0 border-gray-100"
                  >
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {item.nombre_categoria}
                    </span>
                  </td>
                  <td
                    data-label="Stock"
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 text-left md:text-center font-mono font-bold text-[var(--color-secondary-dark)]"
                  >
                    <span className="md:hidden font-bold text-[var(--color-text-secondary)] mr-2 uppercase text-xs">
                      Stock:{" "}
                    </span>
                    {item.stock_unidades.toFixed(2)}
                    <span className="md:hidden text-sm font-normal text-gray-500 ml-1">
                      unidades
                    </span>
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
