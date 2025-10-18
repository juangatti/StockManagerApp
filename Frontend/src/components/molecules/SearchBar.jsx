import { Search } from "lucide-react";

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  placeholder = "Buscar...",
}) {
  return (
    <div className="mb-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 pl-10"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
