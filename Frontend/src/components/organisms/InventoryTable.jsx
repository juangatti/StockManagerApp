// src/components/organisms/InventoryTable.jsx
import useStockStore from "../../stores/useStockStore";
import Card from "../atoms/Card";
import Spinner from "../atoms/Spinner";

export default function InventoryTable({ loading }) {
  const { stockItems, error, stockSearchQuery } = useStockStore();

  return (
    <Card>
      {/* 1. Mantenemos overflow-x-auto por si acaso en pantallas intermedias, pero el diseño de tarjeta lo hará menos necesario */}
      <div className="overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center z-10">
            <Spinner />
          </div>
        )}
        {/* 2. Quitamos min-w de la tabla, dejamos que el contenido dicte el ancho */}
        <table className="w-full text-sm text-left text-slate-300">
          {/* 3. Ocultamos el thead completo en móvil (md:table-header-group) */}
          <thead className="text-xs uppercase bg-slate-700 text-slate-400 hidden md:table-header-group">
            <tr>
              <th scope="col" className="py-3 px-6">
                Item
              </th>
              {/* La cabecera de Categoría ya estaba oculta en móvil, pero ocultamos todo el thead */}
              <th scope="col" className="py-3 px-6">
                Categoría
              </th>
              <th scope="col" className="py-3 px-6 text-center">
                Stock (Unidades)
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading && stockItems.length === 0 ? (
              <tr>
                {/* Ajustamos colspan para escritorio */}
                <td colSpan={3} className="text-center py-8 text-slate-500">
                  {stockSearchQuery
                    ? "No se encontraron items."
                    : "No hay items para mostrar."}
                </td>
              </tr>
            ) : (
              stockItems.map((item) => (
                // 4. TR como bloque en móvil, fila en escritorio
                <tr
                  key={item.id}
                  className="block md:table-row border-b border-slate-700 mb-2 md:mb-0 bg-slate-800/50 md:bg-transparent rounded-lg md:rounded-none overflow-hidden md:overflow-visible shadow-md md:shadow-none" // Estilos de tarjeta para móvil
                >
                  {/* 5. Celda Item (ahora 'td' para consistencia) */}
                  <td
                    data-label="Item" // Añadir data-label para posible CSS futuro
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 font-medium text-white md:whitespace-nowrap border-b md:border-b-0 border-slate-700" // Padding y borde móvil
                  >
                    {/* 6. Etiqueta visible solo en móvil */}
                    <span className="md:hidden font-semibold text-slate-400 mr-2">
                      Item:{" "}
                    </span>
                    {item.nombre_completo}
                  </td>
                  {/* 7. Celda Categoría: oculta en móvil, visible en escritorio */}
                  <td
                    data-label="Categoría"
                    className="hidden md:table-cell py-3 px-4 md:py-4 md:px-6 md:whitespace-nowrap border-b md:border-b-0 border-slate-700" // Padding móvil
                  >
                    {/* No necesitamos etiqueta aquí porque solo se ve en escritorio */}
                    {item.nombre_categoria}
                  </td>
                  {/* 8. Celda Stock */}
                  <td
                    data-label="Stock"
                    className="block md:table-cell py-3 px-4 md:py-4 md:px-6 text-left md:text-center font-mono font-bold" // Alineación móvil
                  >
                    {/* 9. Etiqueta visible solo en móvil */}
                    <span className="md:hidden font-semibold text-slate-400 mr-2">
                      Stock:{" "}
                    </span>
                    {item.stock_unidades.toFixed(2)}
                    {/* 10. Añadir 'unidades' en móvil para claridad */}
                    <span className="md:hidden text-sm font-normal text-slate-400 ml-1">
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
