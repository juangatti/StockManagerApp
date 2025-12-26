import { useState } from "react";
import {
  FolderPlus,
  BookPlus,
  PackagePlus,
  ClipboardPlus,
  Users,
  Shield,
} from "lucide-react";

import CategoryManager from "../organisms/CategoryManager";
import MarcaManager from "../organisms/MarcaManager";
import ItemManager from "../organisms/ItemManager";
import RecipeManager from "../organisms/RecipeManager";
import UserManager from "../organisms/UserManager";
import RoleManager from "../organisms/RoleManager";

export default function AdminTabs() {
  const [activeTab, setActiveTab] = useState("category");

  const buttonClass = (tabName) =>
    `flex items-center justify-center w-full px-4 py-3 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-200 ${
      activeTab === tabName
        ? "border-sky-500 text-sky-400"
        : "border-transparent text-slate-400 hover:text-white hover:border-slate-500"
    }`;

  return (
    <div>
      <div className="border-b border-slate-700 mb-8">
        <div className="grid grid-cols-6 gap-2">
          {" "}
          {/* <-- CAMBIAR A 6 COLUMNAS */}
          <button
            onClick={() => setActiveTab("category")}
            className={buttonClass("category")}
          >
            <FolderPlus className="mr-2 h-5 w-5" /> Categorías
          </button>
          <button
            onClick={() => setActiveTab("marca")}
            className={buttonClass("marca")}
          >
            <BookPlus className="mr-2 h-5 w-5" /> Marcas
          </button>
          <button
            onClick={() => setActiveTab("item")}
            className={buttonClass("item")}
          >
            <PackagePlus className="mr-2 h-5 w-5" /> Items
          </button>
          <button
            onClick={() => setActiveTab("recipe")}
            className={buttonClass("recipe")}
          >
            <ClipboardPlus className="mr-2 h-5 w-5" /> Recetas
          </button>
          <button
            onClick={() => setActiveTab("user")}
            className={buttonClass("user")}
          >
            <Users className="mr-2 h-5 w-5" /> Usuarios
          </button>
          {/* NUEVA PESTAÑA */}
          <button
            onClick={() => setActiveTab("role")}
            className={buttonClass("role")}
          >
            <Shield className="mr-2 h-5 w-5" /> Roles
          </button>
        </div>
      </div>

      <div>
        {activeTab === "category" && <CategoryManager />}
        {activeTab === "marca" && <MarcaManager />}
        {activeTab === "item" && <ItemManager />}
        {activeTab === "recipe" && <RecipeManager />}
        {activeTab === "user" && <UserManager />}
        {/* RENDERIZAR ROLEMANAGER */}
        {activeTab === "role" && <RoleManager />}
      </div>
    </div>
  );
}
