import { useState } from "react";
import { BookPlus, PackagePlus, ClipboardPlus } from "lucide-react";
import CreateIngredientForm from "../organisms/CreateIngredientForm";
import CreateItemForm from "../organisms/CreateItemForm";
import CreateRecipeForm from "../organisms/CreateRecipeForm";

export default function AdminTabs() {
  const [activeTab, setActiveTab] = useState("ingredient");

  const buttonClass = (tabName) =>
    `flex items-center justify-center w-full px-4 py-3 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-200 ${
      activeTab === tabName
        ? "border-sky-500 text-sky-400"
        : "border-transparent text-slate-400 hover:text-white hover:border-slate-500"
    }`;

  return (
    <div>
      <div className="border-b border-slate-700 mb-8">
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab("ingredient")}
            className={buttonClass("ingredient")}
          >
            <BookPlus className="mr-2 h-5 w-5" />
            Crear Ingrediente
          </button>
          <button
            onClick={() => setActiveTab("item")}
            className={buttonClass("item")}
          >
            <PackagePlus className="mr-2 h-5 w-5" />
            Crear Item de Stock
          </button>
          <button
            onClick={() => setActiveTab("recipe")}
            className={buttonClass("recipe")}
          >
            <ClipboardPlus className="mr-2 h-5 w-5" />
            Crear Producto y Receta
          </button>
        </div>
      </div>

      <div>
        {activeTab === "ingredient" && <CreateIngredientForm />}
        {activeTab === "item" && <CreateItemForm />}
        {activeTab === "recipe" && <CreateRecipeForm />}
      </div>
    </div>
  );
}
