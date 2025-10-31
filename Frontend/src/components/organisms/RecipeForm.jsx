import { useState, useEffect, useRef } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
// Importar iconos necesarios, incluyendo ArrowDownUp
import {
  ClipboardPlus,
  PlusCircle,
  XCircle,
  ChevronDown,
  RefreshCw,
  ArrowDownUp, // <-- Icono para Prioridad Variante
} from "lucide-react";
import useStockStore from "../../stores/useStockStore";
import AutocompleteInput from "../molecules/AutocompleteInput";
import Spinner from "../atoms/Spinner";

// Helper para generar IDs temporales
const generateTempId = () => Date.now() + Math.random();

export default function RecipeForm({ recipeToEdit, onFormSubmit, onCancel }) {
  const [productName, setProductName] = useState("");
  const [reglas, setReglas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { stockItems, fetchStock } = useStockStore();
  const [availablePrebatches, setAvailablePrebatches] = useState([]);
  const [loadingDependencies, setLoadingDependencies] = useState(true);
  // Eliminamos prebatchMap ya que buscaremos ID en handleSubmit
  // const [prebatchMap, setPrebatchMap] = useState({});

  const ingredientRefs = useRef({});

  // useEffect para cargar dependencias (stockItems y prebatchNames)
  useEffect(() => {
    const loadDependencies = async () => {
      setLoadingDependencies(true);
      try {
        const fetchStockIfNeeded =
          stockItems.length === 0 ? fetchStock() : Promise.resolve();
        const [prebatchNamesRes] = await Promise.all([
          api.get("/prebatches/names"),
          fetchStockIfNeeded,
        ]);

        if (Array.isArray(prebatchNamesRes.data)) {
          setAvailablePrebatches(prebatchNamesRes.data);
        } else {
          toast.error("Error al cargar nombres de prebatches.");
          setAvailablePrebatches([]);
        }
      } catch (error) {
        console.error("Error loading dependencies:", error);
        toast.error(
          "No se pudieron cargar los datos necesarios (items o prebatches)."
        );
        setAvailablePrebatches([]);
      } finally {
        setLoadingDependencies(false);
      }
    };
    loadDependencies();
  }, [fetchStock, stockItems.length]); // Dependencias correctas

  // useEffect para pre-llenar el formulario al editar
  useEffect(() => {
    // Solo proceder si hay datos para editar, si cargaron los items y si terminaron de cargar las dependencias
    if (recipeToEdit && stockItems.length > 0 && !loadingDependencies) {
      setProductName(recipeToEdit.product.nombre_producto_fudo);
      setReglas(
        recipeToEdit.reglas.map((r) => ({
          tempId: generateTempId(),
          // Incluir recipe_variant del backend
          recipe_variant: r.recipe_variant || 1, // Default a 1 si no viene
          ingredient_type: r.ingredient_type || "ITEM",
          item_id: r.item_id || null,
          prebatch_id: r.prebatch_id || null,
          display_name: r.display_name || "",
          consumo_ml: r.consumo_ml || "",
          prioridad_item: r.prioridad_item || "1",
        }))
      );
    } else if (!recipeToEdit && !loadingDependencies) {
      // Resetear solo si no es edición y ya cargó
      setProductName("");
      setReglas([]);
    }
  }, [recipeToEdit, stockItems, loadingDependencies]); // Añadir loadingDependencies

  // Añadir nueva regla
  const handleAddRegla = () => {
    const lastVariant =
      reglas.length > 0 ? reglas[reglas.length - 1].recipe_variant : 1;
    setReglas([
      ...reglas,
      {
        tempId: generateTempId(),
        recipe_variant: lastVariant, // Usar última variante como default
        ingredient_type: "ITEM",
        item_id: null,
        prebatch_id: null,
        display_name: "",
        consumo_ml: "",
        prioridad_item: "1",
      },
    ]);
  };

  // Eliminar regla
  const handleRemoveRegla = (tempId) => {
    setReglas(reglas.filter((r) => r.tempId !== tempId));
    if (ingredientRefs.current[tempId]) {
      delete ingredientRefs.current[tempId];
    }
  };

  // Handler genérico para cambios en campos de la regla
  const handleReglaChange = (tempId, field, value) => {
    setReglas(
      reglas.map((r) => {
        if (r.tempId === tempId) {
          const updatedRegla = { ...r, [field]: value };
          // Resetear si cambia el tipo
          if (field === "ingredient_type") {
            updatedRegla.item_id = null;
            updatedRegla.prebatch_id = null;
            updatedRegla.display_name = "";
            ingredientRefs.current[tempId]?.clear?.();
          }
          return updatedRegla;
        }
        return r;
      })
    );
  };

  // Handler específico para selección de ITEM
  const handleItemSelection = (tempId, selectedItem) => {
    setReglas(
      reglas.map((r) => {
        if (r.tempId === tempId) {
          return selectedItem
            ? {
                ...r,
                item_id: selectedItem.id,
                prebatch_id: null,
                display_name: selectedItem.nombre_completo,
                ingredient_type: "ITEM", // Confirmar tipo
              }
            : { ...r, item_id: null, display_name: "" }; // Limpiar
        }
        return r;
      })
    );
  };

  // Handler específico para cambio de nombre de PREBATCH
  const handlePrebatchNameChange = (tempId, selectedName) => {
    setReglas(
      reglas.map((r) =>
        r.tempId === tempId
          ? {
              ...r,
              display_name: selectedName,
              prebatch_id: null, // Resetear ID, se buscará al guardar
              item_id: null,
              ingredient_type: "PREBATCH", // Confirmar tipo
            }
          : r
      )
    );
  };

  // Submit del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast.error("El nombre del producto es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    let payloadReglas = [];
    let validationError = null;

    // Usar for...of para await dentro del bucle
    for (const regla of reglas) {
      // Validaciones
      const consumoNum = parseFloat(regla.consumo_ml);
      const prioridadNum = parseInt(regla.prioridad_item);
      const variantNum = parseInt(regla.recipe_variant); // Validar variante

      if (
        isNaN(consumoNum) ||
        consumoNum <= 0 ||
        isNaN(prioridadNum) ||
        prioridadNum <= 0 ||
        isNaN(variantNum) ||
        variantNum <= 0 // Validar que variante sea número > 0
      ) {
        validationError = `Valores inválidos (consumo/prioridad/variante) para "${
          regla.display_name || "una regla"
        }".`;
        break;
      }

      let prebatchIdToSave = null;

      if (regla.ingredient_type === "ITEM") {
        if (!regla.item_id) {
          validationError = `Falta seleccionar un Item de Stock para una regla.`;
          break;
        }
        payloadReglas.push({
          recipe_variant: variantNum, // Enviar variante
          ingredient_type: "ITEM",
          item_id: parseInt(regla.item_id),
          prebatch_id: null,
          consumo_ml: consumoNum,
          prioridad_item: prioridadNum,
        });
      } else if (regla.ingredient_type === "PREBATCH") {
        if (!regla.display_name) {
          validationError = `Falta seleccionar/escribir un nombre de Prebatch.`;
          break;
        }
        // Buscar ID del prebatch por nombre
        try {
          const findRes = await api.get(`/prebatches/find`, {
            params: { name: regla.display_name },
          });
          if (findRes.data && findRes.data.id) {
            prebatchIdToSave = findRes.data.id;
          } else {
            validationError = `Prebatch "${regla.display_name}" no encontrado. Verifica el nombre.`;
            break;
          }
        } catch (findError) {
          console.error("Error buscando prebatch id:", findError);
          validationError = `Error al verificar prebatch "${regla.display_name}".`;
          break;
        }

        payloadReglas.push({
          recipe_variant: variantNum, // Enviar variante
          ingredient_type: "PREBATCH",
          item_id: null,
          prebatch_id: parseInt(prebatchIdToSave),
          consumo_ml: consumoNum,
          prioridad_item: prioridadNum,
        });
      } else {
        validationError = "Tipo de ingrediente inválido.";
        break;
      }
    } // Fin for...of

    if (validationError) {
      toast.error(validationError);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      nombre_producto_fudo: productName.trim(),
      reglas: payloadReglas,
    };

    const isEditing = !!recipeToEdit?.product.id;
    const promise = isEditing
      ? api.put(`/admin/recipes/${recipeToEdit.product.id}`, payload)
      : api.post("/admin/recipes", payload);

    toast.promise(promise, {
      loading: isEditing ? "Actualizando receta..." : "Creando receta...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit(); // Llama a la función del padre
        return `¡Receta ${isEditing ? "actualizada" : "creada"} con éxito!`;
      },
      error: (err) => {
        setIsSubmitting(false);
        console.error("Error saving recipe:", err.response || err);
        return err.response?.data?.message || "Ocurrió un error al guardar.";
      },
    });
  };

  // Clase común para inputs
  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50";

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <ClipboardPlus className="text-sky-400" />
        {recipeToEdit ? "Editar Receta" : "Crear Producto y Receta"}
      </h3>

      {loadingDependencies ? (
        <Spinner />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input Nombre Producto */}
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Nombre del Producto (*)"
            className={commonInputClass}
            required
            disabled={isSubmitting}
          />

          {/* Sección de Reglas */}
          <div className="space-y-4 border border-slate-700 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-slate-400" /> Ingredientes por
              Variante
            </h4>
            {reglas.map((regla, index) => (
              <div
                key={regla.tempId}
                // Grid de 13 columnas para incluir Variante
                className="grid grid-cols-13 gap-x-3 gap-y-2 bg-slate-900/50 p-3 rounded-lg items-end"
              >
                {/* Prioridad Variante */}
                <div className="col-span-12 md:col-span-1">
                  <label
                    htmlFor={`variant-${regla.tempId}`}
                    className={`block mb-1 text-sm font-medium text-slate-300 ${
                      index !== 0 ? "md:sr-only" : ""
                    }`}
                    title="Prioridad de Variante (Menor número se usa primero)"
                  >
                    <ArrowDownUp className="h-4 w-4 inline-block -mt-1" /> (*)
                  </label>
                  <input
                    type="number"
                    id={`variant-${regla.tempId}`}
                    value={regla.recipe_variant}
                    onChange={(e) =>
                      handleReglaChange(
                        regla.tempId,
                        "recipe_variant",
                        e.target.value
                      )
                    }
                    placeholder="#"
                    className={`${commonInputClass} text-center`}
                    min="1"
                    step="1"
                    required
                    disabled={isSubmitting}
                    title="Prioridad de Variante (Menor número se usa primero)"
                  />
                </div>

                {/* Selector Tipo Ingrediente */}
                <div className="col-span-6 md:col-span-2">
                  <label
                    htmlFor={`type-${regla.tempId}`}
                    className={`block mb-1 text-sm font-medium text-slate-300 ${
                      index !== 0 ? "md:sr-only" : ""
                    }`}
                  >
                    Tipo (*)
                  </label>
                  <select
                    id={`type-${regla.tempId}`}
                    value={regla.ingredient_type}
                    onChange={(e) =>
                      handleReglaChange(
                        regla.tempId,
                        "ingredient_type",
                        e.target.value
                      )
                    }
                    className={commonInputClass}
                    disabled={isSubmitting}
                  >
                    <option value="ITEM">Item Stock</option>
                    <option value="PREBATCH">Prebatch</option>
                  </select>
                </div>

                {/* Selector Ingrediente (Condicional) */}
                <div className="col-span-12 md:col-span-4">
                  {regla.ingredient_type === "ITEM" ? (
                    <AutocompleteInput
                      ref={(el) => (ingredientRefs.current[regla.tempId] = el)}
                      label={index === 0 ? "Ingrediente (*)" : undefined}
                      placeholder="Buscar item..."
                      onItemSelected={(item) =>
                        handleItemSelection(regla.tempId, item)
                      }
                      initialItemId={regla.item_id || null}
                      initialItemName={regla.display_name || ""}
                      key={`item-${regla.tempId}`} // Key única
                    />
                  ) : (
                    <>
                      <label
                        htmlFor={`prebatch-${regla.tempId}`}
                        className={`block mb-1 text-sm font-medium text-slate-300 ${
                          index !== 0 ? "md:sr-only" : ""
                        }`}
                      >
                        Ingrediente (*)
                      </label>
                      <input
                        type="text"
                        id={`prebatch-${regla.tempId}`}
                        list={`prebatch-names-list-${regla.tempId}`}
                        value={regla.display_name || ""}
                        onChange={(e) =>
                          handlePrebatchNameChange(regla.tempId, e.target.value)
                        }
                        placeholder="Buscar prebatch..."
                        className={commonInputClass}
                        autoComplete="off"
                        disabled={isSubmitting}
                        required
                        key={`prebatch-${regla.tempId}`} // Key única
                      />
                      <datalist id={`prebatch-names-list-${regla.tempId}`}>
                        {availablePrebatches.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </>
                  )}
                </div>

                {/* Consumo ML */}
                <div className="col-span-6 md:col-span-2">
                  <label
                    htmlFor={`consumo-${regla.tempId}`}
                    className={`block mb-1 text-sm font-medium text-slate-300 ${
                      index !== 0 ? "md:sr-only" : ""
                    }`}
                  >
                    Consumo (ml) (*)
                  </label>
                  <input
                    type="number"
                    id={`consumo-${regla.tempId}`}
                    value={regla.consumo_ml}
                    onChange={(e) =>
                      handleReglaChange(
                        regla.tempId,
                        "consumo_ml",
                        e.target.value
                      )
                    }
                    placeholder="ml"
                    className={`${commonInputClass} text-center`}
                    min="0.01"
                    step="any"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Prioridad Item */}
                <div className="col-span-6 md:col-span-2">
                  <label
                    htmlFor={`prio-${regla.tempId}`}
                    className={`block mb-1 text-sm font-medium text-slate-300 ${
                      index !== 0 ? "md:sr-only" : ""
                    }`}
                    title="Prioridad del Item (si hay varias botellas de lo mismo)"
                  >
                    Prio. Item (*)
                  </label>
                  <input
                    type="number"
                    id={`prio-${regla.tempId}`}
                    value={regla.prioridad_item}
                    onChange={(e) =>
                      handleReglaChange(
                        regla.tempId,
                        "prioridad_item",
                        e.target.value
                      )
                    }
                    placeholder="1, 2..."
                    className={`${commonInputClass} text-center`}
                    min="1"
                    step="1"
                    required
                    disabled={isSubmitting}
                    title="Prioridad del Item (si hay varias botellas de lo mismo)"
                  />
                </div>

                {/* Botón Eliminar */}
                <div className="col-span-12 md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveRegla(regla.tempId)}
                    className="p-2 text-red-500 hover:text-red-400 mb-1 disabled:opacity-50"
                    title="Eliminar Ingrediente"
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Botones */}
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={handleAddRegla}
              className="flex items-center gap-2 text-sky-400 hover:text-sky-300 font-medium text-sm disabled:opacity-50"
              disabled={isSubmitting}
            >
              <PlusCircle className="h-5 w-5" /> Añadir Ingrediente
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="text-white bg-slate-600 hover:bg-slate-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loadingDependencies}
                className="text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500"
              >
                {isSubmitting ? "Guardando..." : "Guardar Receta"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
