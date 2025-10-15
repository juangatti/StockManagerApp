// src/components/molecules/MobileHeader.jsx
import { Menu } from "lucide-react";
import useAuthStore from "../../stores/useAuthStore";

export default function MobileHeader({ onMenuClick }) {
  const user = useAuthStore((state) => state.user);

  return (
    // La clase 'justify-between' sigue funcionando, pero ahora con los elementos en otro orden.
    <header className="bg-slate-800 p-4 flex justify-between items-center md:hidden border-b border-slate-700">
      {/* 1. MOVEMOS EL BOTÓN AL PRINCIPIO */}
      <button onClick={onMenuClick} className="text-white">
        <Menu className="h-6 w-6" />
      </button>

      {/* 2. Y EL TEXTO DEL USUARIO AL FINAL */}
      <div className="text-white font-bold">
        <span className="text-sm text-slate-400">Usuario: </span>
        {user?.username}
      </div>
    </header>
  );
}
