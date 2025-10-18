import { Package } from "lucide-react";

export default function StatCard({ label, value, unit }) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
      {" "}
      {/* 1. Reducir padding general un poco */}
      <div className="flex items-center">
        <div className="bg-sky-500/20 p-2 rounded-full flex-shrink-0">
          {" "}
          {/* 2. Reducir padding del icono y evitar que se encoja */}
          <Package className="h-5 w-5 text-sky-400" />{" "}
          {/* 3. Icono un poco más pequeño */}
        </div>
        <div className="ml-3 min-w-0">
          {" "}
          {/* 4. Permitir que este div se encoja y evitar desbordamiento */}
          {/* 5. Quitar truncate y ajustar altura mínima para permitir dos líneas */}
          <p
            className="text-sm font-medium text-slate-400 line-clamp-2 min-h-[2.5em]" // Permite hasta 2 líneas y reserva espacio
            title={label}
          >
            {label}
          </p>
          {/* 6. Reducir tamaño del valor en pantallas extra pequeñas (opcional, ajusta 'xs' si usas Tailwind extendido) */}
          <p className="text-2xl xs:text-3xl font-bold text-white truncate">
            {" "}
            {/* Truncar si el número es EXTREMADAMENTE largo */}
            {value} {/* 7. Reducir tamaño de unidad */}
            <span className="text-base xs:text-lg font-medium text-slate-400">
              {unit}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
