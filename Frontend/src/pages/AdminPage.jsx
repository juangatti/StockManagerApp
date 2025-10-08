import CreateIngredientForm from "../components/organisms/CreateIngredientForm";
import CreateItemForm from "../components/organisms/CreateItemForm";

export default function AdminPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">
        Administración del Catálogo
      </h2>
      <div className="space-y-12">
        <CreateIngredientForm />
        <CreateItemForm />
      </div>
    </div>
  );
}
