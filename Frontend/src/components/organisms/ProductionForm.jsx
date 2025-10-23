// src/components/organisms/ProductionForm.jsx
import { useState, useEffect, useRef } from "react";
import {
  Hammer,
  Send,
  PlusCircle,
  XCircle,
  Calendar,
  CheckSquare,
  ListTree,
  RefreshCw,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/api"; //
import Spinner from "../atoms/Spinner"; //
import Alert from "../atoms/Alert"; //
import AutocompleteInput from "../molecules/AutocompleteInput"; //
import useStockStore from "../../stores/useStockStore"; //

const generateTempId = () => Date.now() + Math.random();

export default function ProductionForm() {
  const [prebatchName, setPrebatchName] = useState("");
  const [productionDate, setProductionDate] =
    useState(/* ... default hoy ... */);
  const [setExpiryManually, setSetExpiryManually] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [quantityProducedMl, setQuantityProducedMl] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([]); // Ingredientes se añaden manualmente
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null); // Para error de carga de categorías
  const { fetchStock } = useStockStore(); //
  const ingredientRefs = useRef({});

  // --- useEffect Carga Categorías (sin cambios) ---
  useEffect(() => {
    setLoadingCategories(true);
    setError(null);
    api
      .get("/admin/categories/all") //
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          /* ... */ toast.error("Error al cargar lista de categorías.");
          setCategories([]);
        }
      })
      .catch((err) => {
        /* ... */ toast.error("No se pudieron cargar las categorías.");
        setCategories([]);
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  // --- useEffect Limpiar ExpiryDate (sin cambios) ---
  useEffect(() => {
    if (!setExpiryManually) {
      setExpiryDate("");
    }
  }, [setExpiryManually]);

  // --- Handlers Ingredientes (sin cambios) ---
  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        tempId: generateTempId(),
        itemId: null,
        itemName: "",
        quantityConsumedMl: "",
      },
    ]);
  };
  const handleRemoveIngredient = (tempId) => {
    setIngredients(ingredients.filter((ing) => ing.tempId !== tempId));
    if (ingredientRefs.current[tempId]) {
      delete ingredientRefs.current[tempId];
    }
  };
  const handleIngredientChange = (tempId, field, value) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.tempId === tempId ? { ...ing, [field]: value } : ing
      )
    );
  };
  const handleIngredientSelection = (tempId, selectedItem) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.tempId === tempId
          ? {
              ...ing,
              itemId: selectedItem?.id ?? null,
              itemName: selectedItem?.nombre_completo ?? "",
            }
          : ing
      )
    );
  };

  // --- handleSubmit (sin cambios) ---
  const handleSubmit = (e) => {
    e.preventDefault();
    // ... (Validaciones: prebatchName, dates, quantity, description, expiryDate) ...
    // ... (Validación y construcción de ingredientsPayload) ...
    setIsSubmitting(true);
    const payload = {
      prebatchName: prebatchName.trim(),
      productionDate: productionDate,
      quantityProducedMl: parseFloat(quantityProducedMl),
      description: description.trim(),
      ingredients: /* ingredientsPayload */ [], // Asegúrate que la construcción del payload esté aquí
      expiryDate: setExpiryManually ? expiryDate : null,
      categoryId: selectedCategoryId || null,
    };
    // ... (Llamada api.post y toast.promise para limpiar formulario y refrescar stock) ...
  };

  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50";

  // --- JSX ---
  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <Hammer className="text-sky-400" />
        Registrar Producción Interna
      </h3>
      {error && <Alert message={error} />} {/* */}
      {loadingProducts ? (
        <Spinner />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fila 1: Producto Base (Opcional), Nombre Prebatch, Fecha Prod */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector Producto Base */}
            <div>
              <label
                htmlFor="product-select"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Usar Receta de (Opcional)
              </label>
              <select
                id="product-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className={commonInputClass}
                disabled={isSubmitting}
              >
                <option value="">Selecciona para pre-rellenar...</option>
                {/* Ahora muestra TODOS los productos activos */}
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_producto_fudo}
                  </option>
                ))}
              </select>
            </div>

            {/* --- INPUT PREBATCHNAME REINSERTADO --- */}
            {/* Nombre Prebatch Resultante (Editable) */}
            <div>
              <label
                htmlFor="prebatchName"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Nombre Prebatch Resultante (*)
              </label>
              <input
                type="text"
                id="prebatchName"
                name="prebatchName"
                value={prebatchName}
                onChange={(e) => setPrebatchName(e.target.value)}
                className={commonInputClass}
                required
                placeholder="Ej: Negroni Base, Syrup Simple"
                disabled={isSubmitting}
              />
            </div>
            {/* --- FIN INPUT PREBATCHNAME --- */}

            {/* Fecha Producción */}
            <div>
              <label
                htmlFor="productionDate"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Fecha de Producción (*)
              </label>
              <input
                type="date"
                id="productionDate"
                name="productionDate"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className={commonInputClass}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Fila 2: Checkbox Vencimiento, Fecha Vencimiento, Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Checkbox Vencimiento */}
            <div className="flex items-center h-full pt-6">
              <input
                id="setExpiryManually"
                name="setExpiryManually"
                type="checkbox"
                checked={setExpiryManually}
                onChange={(e) => setSetExpiryManually(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-600 focus:ring-sky-500"
                disabled={isSubmitting}
              />
              <label
                htmlFor="setExpiryManually"
                className="ml-2 block text-sm text-slate-300"
              >
                ¿Vencimiento manual?
              </label>
            </div>
            {/* Fecha Vencimiento (Condicional) */}
            {setExpiryManually && (
              <div>
                <label
                  htmlFor="expiryDate"
                  className="block mb-2 text-sm font-medium text-slate-300"
                >
                  Fecha de Vencimiento (*)
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className={commonInputClass}
                  required={setExpiryManually}
                  disabled={isSubmitting || !setExpiryManually}
                  min={productionDate || undefined}
                />
              </div>
            )}
            {/* Selector de Categoría (Opcional) */}
            <div className={!setExpiryManually ? "md:col-start-3" : ""}>
              <label
                htmlFor="categoryId"
                className="block mb-2 text-sm font-medium text-slate-300 flex items-center gap-1"
              >
                <Tag className="h-4 w-4" /> Categoría (Opcional)
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className={commonInputClass}
                disabled={isSubmitting || loadingCategories}
              >
                <option value="">-- Sin categoría --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
              {loadingCategories && <Spinner size="small" />}
            </div>
          </div>

          {/* Sección Ingredientes */}
          <div className="space-y-4 border border-slate-700 p-4 rounded-lg">
            {/* ... (Contenido sección ingredientes sin cambios) ... */}
          </div>

          {/* Cantidad Final Producida */}
          <div>
            <label
              htmlFor="quantityProducedMl"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Cantidad Final Producida (ml) (*)
            </label>
            <input
              type="number"
              id="quantityProducedMl"
              name="quantityProducedMl"
              value={quantityProducedMl}
              onChange={(e) => setQuantityProducedMl(e.target.value)}
              className={commonInputClass}
              required
              min="1"
              step="1"
              placeholder="Ej: 5000"
              disabled={isSubmitting}
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="description"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Descripción / Motivo (*)
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={commonInputClass} // Reutiliza la clase común definida antes
              required
              placeholder="Ej: Producción semanal Negroni, Batch evento"
              disabled={isSubmitting}
            />
          </div>

          {/* Botón Submit */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={
                // Lógica de deshabilitación completa
                isSubmitting ||
                loadingProducts || // No enviar si aún cargan productos
                !prebatchName.trim() ||
                !productionDate ||
                !quantityProducedMl ||
                !description.trim() ||
                (setExpiryManually && !expiryDate)
                // Opcional: podrías deshabilitar si ingredients tiene filas incompletas
              }
              className="flex items-center justify-center text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              <Send className="mr-2 h-5 w-5" />
              {isSubmitting ? "Registrando..." : "Confirmar Producción"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
