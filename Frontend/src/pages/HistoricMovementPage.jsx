// src/pages/PaginaHistorial.jsx

import MovementTable from "../components/organisms/MovementTable";
export default function HistoricMovementPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">
        Historial de Movimientos
      </h2>
      <MovementTable />
    </div>
  );
}
