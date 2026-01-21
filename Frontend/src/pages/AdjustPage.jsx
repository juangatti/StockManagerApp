import { useState } from "react";
import AdjustForm from "../components/organisms/AdjustForm";
import AdjustmentSheet from "../components/organisms/AdjustmentSheet";
import AdjustmentTypeSwitcher from "../components/molecules/AdjustmentTypeSwitcher";

export default function AdjustPage() {
  const [adjustmentType, setAdjustmentType] = useState("massive");

  return (
    <div>
      <h2 className="text-3xl font-bold text-text-primary font-display uppercase tracking-wide mb-6">
        Ajuste de Inventario
      </h2>
      <AdjustmentTypeSwitcher
        activeType={adjustmentType}
        onTypeChange={setAdjustmentType}
      />
      {adjustmentType === "individual" ? <AdjustForm /> : <AdjustmentSheet />}
    </div>
  );
}
