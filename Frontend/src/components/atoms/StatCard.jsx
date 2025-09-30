import { Package } from "lucide-react";

export default function StatCard({ label, value, unit }) {
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <div className="flex items-center">
        <div className="bg-sky-500/20 p-3 rounded-full">
          <Package className="h-6 w-6 text-sky-400" />
        </div>
        <div className="ml-4">
          <p
            className="text-sm font-medium text-slate-400 truncate"
            title={label}
          >
            {label}
          </p>
          <p className="text-3xl font-bold text-white">
            {value}{" "}
            <span className="text-lg font-medium text-slate-400">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
