// src/components/molecules/AdminTabs.jsx
import { useState } from "react";
import { FolderPlus, BookPlus, PackagePlus, ClipboardPlus } from "lucide-react";

// Importar todos los formularios nuevos y modificados
import CreateCategoryForm from "../organisms/CreateCategoryForm";
import CreateMarcaForm from "../organisms/CreateMarcaForm";
import CreateItemForm from "../organisms/CreateItemForm";
import CreateRecipeForm from "../organisms/CreateRecipeForm";

export default function AdminTabs() {
  const [activeTab, setActiveTab] = useState("category");

  const buttonClass = (tabName) => `...`; // (La función no cambia)

  return (
    <div>
      <div className="border-b border-slate-700 mb-8">
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab("category")}
            className={buttonClass("category")}
          >
            <FolderPlus className="mr-2 h-5 w-5" />
            Categorías
          </button>
          <button
            onClick={() => setActiveTab("marca")}
            className={buttonClass("marca")}
          >
            <BookPlus className="mr-2 h-5 w-5" />
            Marcas
          </button>
          <button
            onClick={() => setActiveTab("item")}
            className={buttonClass("item")}
          >
            <PackagePlus className="mr-2 h-5 w-5" />
            Items (Envases)
          </button>
          <button
            onClick={() => setActiveTab("recipe")}
            className={buttonClass("recipe")}
          >
            <ClipboardPlus className="mr-2 h-5 w-5" />
            Recetas
          </button>
        </div>
      </div>

      <div>
        {activeTab === "category" && <CreateCategoryForm />}
        {activeTab === "marca" && <CreateMarcaForm />}
        {activeTab === "item" && <CreateItemForm />}
        {activeTab === "recipe" && <CreateRecipeForm />}
      </div>
    </div>
  );
}
