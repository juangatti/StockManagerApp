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
import api from "../../api/api";
import Spinner from "../atoms/Spinner";
import Alert from "../atoms/Alert";
import AutocompleteInput from "../molecules/AutocompleteInput";
import useStockStore from "../../stores/useStockStore";

const generateTempId = () => Date.now() + Math.random();

export default function ProductionForm() {
  // --- Estados Eliminados ---
  // selectedProductId, products, loadingProducts, recipePreview, loadingPreview ya no son necesarios

  // --- Estados Mantenidos/Nuevos ---
  const [prebatchName, setPrebatchName] = useState("");
  const [productionDate, setProductionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [setExpiryManually, setSetExpiryManually] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [quantityProducedMl, setQuantityProducedMl] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([]); // Ingredientes se añaden manualmente
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null); // Solo para error de carga de categorías
  const { fetchStock } = useStockStore();
  const ingredientRefs = useRef({});
  const [existingNames, setExistingNames] = useState([]);
  const [loadingNames, setLoadingNames] = useState(true);

  // --- useEffect Carga Categorías (se mantiene) ---
  useEffect(() => {
    setLoadingCategories(true);
    setError(null); // Limpiar error anterior
    api
      .get("/admin/categories/all") //
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          toast.error("Error al cargar categorías.");
          setCategories([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        toast.error("No se pudieron cargar categorías.");
        setCategories([]);
        setError("No se pudieron cargar las categorías necesarias."); // Mostrar error si falla
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    setLoadingNames(true);
    api
      .get("/prebatches/names") // Llama al nuevo endpoint
      .then((res) => {
        if (Array.isArray(res.data)) {
          setExistingNames(res.data);
        } else {
          console.error(
            "Respuesta inesperada para /prebatches/names:",
            res.data
          );
          setExistingNames([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching existing prebatch names:", err);
        // No es crítico, el input funcionará sin sugerencias
        setExistingNames([]);
      })
      .finally(() => setLoadingNames(false));
  }, []);

  // --- useEffect Limpiar ExpiryDate (se mantiene) ---
  useEffect(() => {
    if (!setExpiryManually) {
      setExpiryDate("");
    }
  }, [setExpiryManually]);

  // --- Handlers Ingredientes (se mantienen) ---
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

  // --- handleSubmit (CORREGIDO: Lógica DESCOMENTADA) ---
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validaciones
    if (
      !prebatchName.trim() ||
      !productionDate ||
      !quantityProducedMl ||
      !description.trim()
    ) {
      toast.error(
        "Nombre Prebatch, Fecha Prod., Cantidad Prod. (ml) y Descripción son obligatorios."
      );
      return;
    }
    const quantityNum = parseFloat(quantityProducedMl);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error("La cantidad producida debe ser un número positivo.");
      return;
    }
    if (setExpiryManually && !expiryDate) {
      toast.error(
        "Debes seleccionar una fecha de vencimiento si marcaste la opción."
      );
      return;
    }

    let ingredientsPayload = [];
    try {
      // Validar y construir ingredientsPayload
      const validIngredients = ingredients.filter(
        (ing) => ing.itemId && ing.quantityConsumedMl
      );
      if (
        validIngredients.length !== ingredients.length &&
        ingredients.length > 0
      ) {
        toast.error(
          "Completa o elimina las filas de ingredientes incompletas."
        );
        return;
      }
      ingredientsPayload = validIngredients.map((ing) => {
        const consumedMl = parseFloat(ing.quantityConsumedMl);
        if (isNaN(consumedMl) || consumedMl <= 0) {
          throw new Error(
            `Cantidad consumida inválida para ${
              ing.itemName || `ID ${ing.itemId}`
            }.`
          );
        }
        return { itemId: parseInt(ing.itemId), quantityConsumedMl: consumedMl };
      });
    } catch (validationError) {
      toast.error(validationError.message);
      return;
    }

    setIsSubmitting(true);
    const payload = {
      prebatchName: prebatchName.trim(),
      productionDate: productionDate,
      quantityProducedMl: quantityNum,
      description: description.trim(),
      ingredients: ingredientsPayload, // Puede ser array vacío
      expiryDate: setExpiryManually ? expiryDate : null,
      categoryId: selectedCategoryId || null,
    };

    console.log("handleSubmit: Payload listo:", payload); // Log 1

    try {
      // --- LÓGICA DE ENVÍO DESCOMENTADA ---
      const apiPromise = api.post("/stock/production", payload); //
      console.log("handleSubmit: Llamada API..."); // Log 2

      toast.promise(apiPromise, {
        loading: "Registrando...",
        success: (res) => {
          console.log("toast.promise: ÉXITO", res); // Log 3
          setIsSubmitting(false); // <-- Se ejecuta al éxito
          // Limpiar form
          setPrebatchName("");
          setProductionDate(new Date().toISOString().split("T")[0]);
          setSetExpiryManually(false);
          setExpiryDate("");
          setQuantityProducedMl("");
          setDescription("");
          setIngredients([]);
          setSelectedCategoryId("");
          Object.values(ingredientRefs.current).forEach((ref) => ref?.clear());
          ingredientRefs.current = {};
          fetchStock();
          console.log("toast.promise: Limpio y fetchStock"); // Log 4
          return res.data?.message || "Éxito.";
        },
        error: (err) => {
          console.error("toast.promise: ERROR", err); // Log 5
          setIsSubmitting(false); // <-- Se ejecuta al error
          console.error("Error detalle:", err.response?.data || err.message);
          return err.response?.data?.message || err.message || "Error.";
        },
      });
      // --- FIN LÓGICA DESCOMENTADA ---
    } catch (outerError) {
      console.error("handleSubmit: Error INMEDIATO:", outerError); // Log 6
      toast.error("Error inesperado.");
      setIsSubmitting(false); // Asegurar reset
    }
  };

  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50";

  // --- JSX (Modificado: sin selector producto base) ---
  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <Hammer className="text-sky-400" />
        Registrar Producción Interna
      </h3>
      {error && <Alert message={error} />}{" "}
      {/* Ahora solo muestra error de carga de categorías */}
      {/* Mostrar Spinner solo si carga categorías */}
      {loadingCategories || loadingNames ? (
        <Spinner />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fila 1: Nombre Prebatch, Fecha Prod */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {" "}
            {/* Nombre Prebatch Resultante */}
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
                disabled={isSubmitting}
                placeholder="Ej: Negroni Base, Syrup Simple"
              />
              <datalist id="prebatch-names">
                {existingNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
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
              {/* CORRECCIÓN: Eliminada la clase 'block' redundante */}
              <label
                htmlFor="categoryId"
                className="mb-2 text-sm font-medium text-slate-300 flex items-center gap-1"
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
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <ListTree className="h-5 w-5 text-slate-400" />
              Ingredientes Consumidos (Opcional)
              {/* Ya no hay loadingPreview */}
            </h4>
            {ingredients.length === 0 && ( // Mensaje si no hay ingredientes
              <p className="text-sm text-slate-500 italic">
                Añade ingredientes manualmente si esta producción consume stock.
              </p>
            )}
            {ingredients.map((ing, index) => (
              <div
                key={ing.tempId}
                className="grid grid-cols-12 gap-3 items-center bg-slate-900/50 p-3 rounded"
              >
                {/* Autocomplete Ingrediente */}
                <div className="col-span-12 md:col-span-7">
                  <AutocompleteInput
                    ref={(el) => (ingredientRefs.current[ing.tempId] = el)}
                    label={index === 0 ? "Item de Stock" : undefined}
                    placeholder="Buscar ingrediente..."
                    onItemSelected={(item) =>
                      handleIngredientSelection(ing.tempId, item)
                    }
                    // Ya no hay initialItemId/Name porque no pre-rellenamos
                  />{" "}
                  {/* */}
                </div>
                {/* Cantidad Consumida */}
                <div className="col-span-8 md:col-span-3">
                  <label
                    htmlFor={`ing-qty-${ing.tempId}`}
                    className={`block mb-2 text-sm font-medium text-slate-300 ${
                      index !== 0 ? "md:hidden" : ""
                    }`}
                  >
                    Consumo (ml o g) (*)
                  </label>
                  <input
                    type="number"
                    id={`ing-qty-${ing.tempId}`}
                    value={ing.quantityConsumedMl}
                    onChange={(e) =>
                      handleIngredientChange(
                        ing.tempId,
                        "quantityConsumedMl",
                        e.target.value
                      )
                    }
                    placeholder="ml o g"
                    min="0.01"
                    step="any"
                    required
                    className={commonInputClass}
                    disabled={isSubmitting}
                  />
                </div>
                {/* Botón Eliminar */}
                <div className="col-span-4 md:col-span-2 flex items-end justify-center md:justify-end h-full pb-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(ing.tempId)}
                    className="p-2 text-red-500 hover:text-red-400 disabled:opacity-50"
                    title="Eliminar Ingrediente"
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddIngredient}
              className="flex items-center gap-2 text-sky-400 hover:text-sky-300 font-medium text-sm disabled:opacity-50"
              disabled={isSubmitting}
            >
              <PlusCircle className="h-5 w-5" /> Añadir Ingrediente
            </button>
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
              className={commonInputClass}
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
                isSubmitting ||
                loadingCategories || // Deshabilitar si categorías aún cargan
                !prebatchName.trim() ||
                !productionDate ||
                !quantityProducedMl ||
                !description.trim() ||
                (setExpiryManually && !expiryDate)
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
