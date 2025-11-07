// src/components/organisms/RecipeForm.jsx
import { useState, useEffect, useRef } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import {
  ClipboardPlus,
  PlusCircle,
  XCircle,
  RefreshCw,
  ArrowDownUp, // Icono para la prioridad de variante
} from "lucide-react";
import useStockStore from "../../stores/useStockStore";
import AutocompleteInput from "../molecules/AutocompleteInput";
import Spinner from "../atoms/Spinner";

// Helper para generar IDs temporales para las keys de React
const generateTempId = () => Date.now() + Math.random();

export default function RecipeForm({ recipeToEdit, onFormSubmit, onCancel }) {
  const [productName, setProductName] = useState("");
  const [reglas, setReglas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { stockItems, fetchStock } = useStockStore();

  // Nuevos estados para manejar prebatches y carga inicial
  const [availablePrebatches, setAvailablePrebatches] = useState([]);
  const [loadingDependencies, setLoadingDependencies] = useState(true);

  const ingredientRefs = useRef({}); // Refs para limpiar inputs hijos si es necesario

  // 1. Cargar dependencias iniciales (Items de Stock y Nombres de Prebatches)
  useEffect(() => {
    const loadDependencies = async () => {
      setLoadingDependencies(true);
      try {
        // Cargar stock solo si no está ya en el store
        const fetchStockIfNeeded =
          stockItems.length === 0 ? fetchStock() : Promise.resolve();

        const [prebatchNamesRes] = await Promise.all([
          api.get("/prebatches/names"),
          fetchStockIfNeeded,
        ]);

        if (Array.isArray(prebatchNamesRes.data)) {
          setAvailablePrebatches(prebatchNamesRes.data);
        } else {
          setAvailablePrebatches([]);
          toast.error("No se pudieron cargar los nombres de prebatches.");
        }
      } catch (error) {
        console.error("Error loading recipe dependencies:", error);
        toast.error("Error al cargar datos necesarios (items/prebatches).");
      } finally {
        setLoadingDependencies(false);
      }
    };
    loadDependencies();
  }, [fetchStock, stockItems.length]);

  // 2. Pre-llenar formulario si estamos editando
  useEffect(() => {
    if (recipeToEdit && !loadingDependencies) {
      setProductName(recipeToEdit.product.nombre_producto_fudo);
      setReglas(
        recipeToEdit.reglas.map((r) => ({
          tempId: generateTempId(),
          recipe_variant: r.recipe_variant || 1, // Cargar variante existente o default 1
          ingredient_type: r.ingredient_type || "ITEM",
          item_id: r.item_id || null,
          prebatch_id: r.prebatch_id || null,
          display_name: r.display_name || "", // Nombre para mostrar en el input
          consumo_ml: r.consumo_ml || "",
          prioridad_item: r.prioridad_item || "1",
        }))
      );
    } else if (!recipeToEdit && !loadingDependencies) {
      setProductName("");
      setReglas([]);
    }
  }, [recipeToEdit, loadingDependencies]);

  // 3. Handlers para manipular el array de reglas
  const handleAddRegla = () => {
    // Usar la última variante como valor por defecto para la nueva regla
    const lastVariant =
      reglas.length > 0 ? reglas[reglas.length - 1].recipe_variant : 1;
    setReglas([
      ...reglas,
      {
        tempId: generateTempId(),
        recipe_variant: lastVariant,
        ingredient_type: "ITEM", // Por defecto ITEM
        item_id: null,
        prebatch_id: null,
        display_name: "",
        consumo_ml: "",
        prioridad_item: "1",
      },
    ]);
  };

  const handleRemoveRegla = (tempId) => {
    setReglas(reglas.filter((r) => r.tempId !== tempId));
    delete ingredientRefs.current[tempId];
  };

  // Handler genérico para cambios simples (consumo, prioridad item, variante, tipo)
  const handleReglaChange = (tempId, field, value) => {
    setReglas(
      reglas.map((r) => {
        if (r.tempId === tempId) {
          const updated = { ...r, [field]: value };
          // Si cambia el tipo, limpiar los campos relacionados al ingrediente anterior
          if (field === "ingredient_type") {
            updated.item_id = null;
            updated.prebatch_id = null;
            updated.display_name = "";
            ingredientRefs.current[tempId]?.clear?.(); // Limpiar Autocomplete si existe
          }
          return updated;
        }
        return r;
      })
    );
  };

  // Handler específico para cuando se selecciona un ITEM del Autocomplete
  const handleItemSelection = (tempId, selectedItem) => {
    setReglas(
      reglas.map((r) =>
        r.tempId === tempId
          ? {
              ...r,
              item_id: selectedItem?.id || null,
              prebatch_id: null,
              display_name: selectedItem?.nombre_completo || "",
              ingredient_type: "ITEM",
            }
          : r
      )
    );
  };

  // Handler específico para cuando se escribe/selecciona un nombre de PREBATCH
  const handlePrebatchNameChange = (tempId, name) => {
    setReglas(
      reglas.map((r) =>
        r.tempId === tempId
          ? {
              ...r,
              display_name: name,
              prebatch_id: null, // El ID se buscará al guardar para asegurar que sea actual
              item_id: null,
              ingredient_type: "PREBATCH",
            }
          : r
      )
    );
  };

  // 4. Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast.error("El nombre del producto es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    let payloadReglas = [];
    let errorMsg = null;

    // Validar y preparar cada regla
    for (const r of reglas) {
      const consumo = parseFloat(r.consumo_ml);
      const prioItem = parseInt(r.prioridad_item);
      const variant = parseInt(r.recipe_variant);

      if (
        isNaN(consumo) ||
        consumo <= 0 ||
        isNaN(prioItem) ||
        prioItem <= 0 ||
        isNaN(variant) ||
        variant <= 0
      ) {
        errorMsg = `Valores inválidos en la regla de "${
          r.display_name || "sin nombre"
        }".`;
        break;
      }

      if (r.ingredient_type === "ITEM") {
        if (!r.item_id) {
          errorMsg = "Falta seleccionar un Item de Stock.";
          break;
        }
        payloadReglas.push({
          recipe_variant: variant,
          ingredient_type: "ITEM",
          item_id: parseInt(r.item_id),
          prebatch_id: null,
          consumo_ml: consumo,
          prioridad_item: prioItem,
        });
      } else if (r.ingredient_type === "PREBATCH") {
        if (!r.display_name.trim()) {
          errorMsg = "Falta el nombre del Prebatch.";
          break;
        }
        // Buscar el ID del prebatch por su nombre exacto antes de guardar
        try {
          const res = await api.get("/prebatches/find", {
            params: { name: r.display_name.trim() },
          });
          if (!res.data?.id) {
            errorMsg = `No se encontró el prebatch "${r.display_name}". Verifica el nombre.`;
            break;
          }
          payloadReglas.push({
            recipe_variant: variant,
            ingredient_type: "PREBATCH",
            item_id: null,
            prebatch_id: res.data.id,
            consumo_ml: consumo,
            prioridad_item: prioItem,
          });
        } catch (err) {
          console.error("Error buscando prebatch:", err);
          errorMsg = "Error al validar el prebatch. Intenta de nuevo.";
          break;
        }
      }
    }

    if (errorMsg) {
      toast.error(errorMsg);
      setIsSubmitting(false);
      return;
    }

    // Enviar al backend
    const payload = {
      nombre_producto_fudo: productName.trim(),
      reglas: payloadReglas,
    };
    const isEditing = !!recipeToEdit?.product.id;
    const promise = isEditing
      ? api.put(`/admin/recipes/${recipeToEdit.product.id}`, payload)
      : api.post("/admin/recipes", payload);

    toast.promise(promise, {
      loading: isEditing ? "Actualizando..." : "Guardando...",
      success: () => {
        setIsSubmitting(false);
        onFormSubmit();
        return "Receta guardada con éxito.";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || "Error al guardar la receta.";
      },
    });
  };

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
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Nombre del Producto (Ej: NEGRONI)"
            className={commonInputClass}
            required
            disabled={isSubmitting}
          />

          <div className="space-y-4 border border-slate-700 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-slate-400" /> Ingredientes por
              Variante
            </h4>

            {reglas.map((regla, index) => (
              <div
                key={regla.tempId}
                className="grid grid-cols-12 gap-3 bg-slate-900/50 p-3 rounded-lg items-end"
              >
                {/* 1. Prioridad de Variante */}
                <div className="col-span-12 md:col-span-1">
                  <label
                    className={`block mb-1 text-xs text-slate-400 ${
                      index !== 0 ? "md:sr-only" : ""
                    }`}
                    title="Agrupa ingredientes. Menor # = mayor prioridad."
                  >
                    Var. <ArrowDownUp className="inline h-3 w-3" />
                  </label>
                  <input
                    type="number"
                    value={regla.recipe_variant}
                    onChange={(e) =>
                      handleReglaChange(
                        regla.tempId,
                        "recipe_variant",
                        e.target.value
                      )
                    }
                    className={`${commonInputClass} text-center px-1`}
                    min="1"
                    step="1"
                    required
                    disabled={isSubmitting}
                    placeholder="#"
                    title="Número de Variante"
                  />
                </div>

                {/* 2. Tipo de Ingrediente */}
                <div className="col-span-6 md:col-span-2">
                  <label
                    className={`block mb-1 text-xs text-slate-400 ${
                      index !== 0 ? "md:sr-only" : ""
                    }`}
                  >
                    Tipo
                  </label>
                  <select
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

                {/* 3. Selector de Ingrediente (Condicional) */}
                <div className="col-span-12 md:col-span-4">
                  {regla.ingredient_type === "ITEM" ? (
                    <AutocompleteInput
                      ref={(el) => (ingredientRefs.current[regla.tempId] = el)}
                      label={
                        index === 0 ? (
                          <span className="text-xs text-slate-400">
                            Ingrediente
                          </span>
                        ) : undefined
                      }
                      placeholder="Buscar item..."
                      onItemSelected={(item) =>
                        handleItemSelection(regla.tempId, item)
                      }
                      initialItemId={regla.item_id}
                      initialItemName={regla.display_name}
                      key={`item-${regla.tempId}`} // Fuerza re-render al cambiar tipo
                    />
                  ) : (
                    <div>
                      <label
                        className={`block mb-2 text-xs text-slate-400 ${
                          index !== 0 ? "md:sr-only" : ""
                        }`}
                      >
                        Ingrediente (Prebatch)
                      </label>
                      <input
                        type="text"
                        list={`prebatch-list-${regla.tempId}`}
                        value={regla.display_name}
                        onChange={(e) =>
                          handlePrebatchNameChange(regla.tempId, e.target.value)
                        }
                        placeholder="Buscar prebatch..."
                        className={commonInputClass}
                        disabled={isSubmitting}
                        required
                        key={`prebatch-input-${regla.tempId}`}
                      />
                      <datalist id={`prebatch-list-${regla.tempId}`}>
                        {availablePrebatches.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>
                  )}
                </div>

                {/* 4. Consumo ML */}
                <div className="col-span-6 md:col-span-2">
                  <label
                    className={`block mb-1 text-xs text-slate-400 ${
                      index !== 0 ? "md:sr-only" : ""
                    }`}
                  >
                    Consumo (ml)
                  </label>
                  <input
                    type="number"
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

                {/* 5. Prioridad Item (dentro de la variante) */}
                <div className="col-span-6 md:col-span-2">
                  <label
                    className={`block mb-1 text-xs text-slate-400 ${
                      index !== 0 ? "md:sr-only" : ""
                    }`}
                    title="Prioridad entre botellas iguales"
                  >
                    Prio. Item
                  </label>
                  <input
                    type="number"
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
                  />
                </div>

                {/* 6. Botón Eliminar */}
                <div className="col-span-12 md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveRegla(regla.tempId)}
                    className="p-2 text-red-500 hover:text-red-400 disabled:opacity-50"
                    disabled={isSubmitting}
                    title="Eliminar esta regla"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={handleAddRegla}
              className="flex items-center gap-2 text-sky-400 hover:text-sky-300 font-medium text-sm"
              disabled={isSubmitting}
            >
              <PlusCircle className="h-5 w-5" /> Añadir Ingrediente
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="text-white bg-slate-600 hover:bg-slate-700 font-medium rounded-lg text-sm px-5 py-2.5"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loadingDependencies}
                className="text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-slate-500"
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
