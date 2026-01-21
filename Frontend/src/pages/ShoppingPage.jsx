import PurchasingForm from "../components/organisms/PurchasingForm";

export default function ShoppingPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-text-primary font-display uppercase tracking-wide mb-6">
        Registrar Nueva Compra
      </h2>
      <PurchasingForm />
    </div>
  );
}
