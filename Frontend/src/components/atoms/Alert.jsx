import { AlertTriangle } from "lucide-react";

export default function Alert({ message }) {
  return (
    <div
      className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center"
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 mr-3" />
      <span className="block sm:inline">{message}</span>
    </div>
  );
}
