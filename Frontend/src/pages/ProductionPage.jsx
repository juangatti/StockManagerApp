// src/pages/ProductionPage.jsx
import ProductionForm from "../components/organisms/ProductionForm"; // <-- Importar el nuevo formulario

export default function ProductionPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-text-primary font-display uppercase tracking-wide mb-6">
        Registrar Nueva Producción
      </h2>
      <ProductionForm /> {/* <-- Usar el nuevo formulario */}
    </div>
  );
}
