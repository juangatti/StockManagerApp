// src/components/organisms/RecipeForm.jsx
import { useState, useEffect, useRef } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
// 1. Importar iconos necesarios
import {
  ClipboardPlus,
  PlusCircle,
  XCircle,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import useStockStore from "../../stores/useStockStore";
import AutocompleteInput from "../molecules/AutocompleteInput";
import Spinner from "../atoms/Spinner"; // Importar Spinner

// Helper para generar IDs temporales
const generateTempId = () => Date.now() + Math.random();

export default function RecipeForm({ recipeToEdit, onFormSubmit, onCancel }) {
  const [productName, setProductName] = useState("");
  const [reglas, setReglas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { stockItems, fetchStock } = useStockStore();
  // 2. Nuevo estado para nombres de prebatches y estado de carga
  const [availablePrebatches, setAvailablePrebatches] = useState([]);
  const [loadingDependencies, setLoadingDependencies] = useState(true);
  const [prebatchMap, setPrebatchMap] = useState({}); // Mapa nombre -> id

  const ingredientRefs = useRef({}); // Refs para Autocomplete/Selects

  // 3. useEffect modificado para cargar stockItems Y prebatchNames
  useEffect(() => {
    const loadDependencies = async () => {
      setLoadingDependencies(true);
      try {
        const fetchStockIfNeeded =
          stockItems.length === 0 ? fetchStock() : Promise.resolve();
        const [prebatchNamesRes] = await Promise.all([
          api.get("/prebatches/names"), // Cargar nombres de prebatches
          fetchStockIfNeeded, // Cargar stock si es necesario
        ]);

        if (Array.isArray(prebatchNamesRes.data)) {
          setAvailablePrebatches(prebatchNamesRes.data);
          // Crear un mapa para buscar ID por nombre fácilmente
          // NOTA: Esto asume nombres únicos. Si no son únicos, necesitaríamos IDs en la respuesta de /names
          const nameToIdMap = {};
          // Asumimos que la API /prebatches devuelve objetos {id, nombre_prebatch} si /names no lo hace.
          // SI /names SOLO devuelve strings, necesitaremos OTRA llamada a /prebatches para obtener los IDs
          // Por ahora, asumimos que /names devuelve strings y que buscaremos ID al guardar, o que modificamos /names
          // Vamos a asumir que /names devuelve strings y ajustaremos el handler
          // setPrebatchMap(nameToIdMap); // Dejamos esto vacío por ahora
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
  }, [fetchStock, stockItems.length]);

  // 4. useEffect para pre-llenar el formulario (adaptado)
  useEffect(() => {
    if (recipeToEdit && stockItems.length > 0 && !loadingDependencies) {
      // Esperar a que todo cargue
      setProductName(recipeToEdit.product.nombre_producto_fudo);
      setReglas(
        recipeToEdit.reglas.map((r) => ({
          tempId: generateTempId(),
          ingredient_type: r.ingredient_type || "ITEM", // Default a ITEM si no viene
          item_id: r.item_id || null,
          prebatch_id: r.prebatch_id || null,
          // display_name vino del backend en getRecipeById
          display_name: r.display_name || "",
          consumo_ml: r.consumo_ml || "",
          prioridad_item: r.prioridad_item || "1",
        }))
      );
    } else if (!recipeToEdit) {
      // Solo resetear si no estamos editando
      setProductName("");
      setReglas([]);
    }
  }, [recipeToEdit, stockItems, loadingDependencies]); // Depender de la carga

  const handleAddRegla = () =>
    setReglas([
      ...reglas,
      {
        tempId: generateTempId(),
        ingredient_type: "ITEM", // Iniciar como ITEM por defecto
        item_id: null,
        prebatch_id: null,
        display_name: "", // Nombre para mostrar/buscar
        consumo_ml: "",
        prioridad_item: "1",
      },
    ]);

  const handleRemoveRegla = (tempId) => {
    setReglas(reglas.filter((r) => r.tempId !== tempId));
    if (ingredientRefs.current[tempId]) {
      delete ingredientRefs.current[tempId];
    }
  };

  // 5. Handler unificado para cambios en la regla (tipo, consumo, prioridad)
  const handleReglaChange = (tempId, field, value) => {
    setReglas(
      reglas.map((r) => {
        if (r.tempId === tempId) {
          const updatedRegla = { ...r, [field]: value };
          // Si cambia el tipo, resetear los IDs y nombre
          if (field === "ingredient_type") {
            updatedRegla.item_id = null;
            updatedRegla.prebatch_id = null;
            updatedRegla.display_name = "";
            // Limpiar el input hijo asociado (si existe la ref)
            ingredientRefs.current[tempId]?.clear?.(); // Usar clear() del Autocomplete
            // Para el select/datalist de prebatch, podríamos necesitar resetear el valor del input directamente si no es Autocomplete
          }
          return updatedRegla;
        }
        return r;
      })
    );
  };

  // 6. Handler para selección de ITEM (usando AutocompleteInput)
  const handleItemSelection = (tempId, selectedItem) => {
    setReglas(
      reglas.map((r) => {
        if (r.tempId === tempId) {
          if (selectedItem) {
            // No necesitamos buscar marca_id si la eliminamos de la BD
            return {
              ...r,
              item_id: selectedItem.id,
              prebatch_id: null, // Asegurar que prebatch_id sea null
              display_name: selectedItem.nombre_completo,
              ingredient_type: "ITEM", // Confirmar tipo
            };
          } else {
            // Si se limpia
            return { ...r, item_id: null, display_name: "" };
          }
        }
        return r;
      })
    );
  };

  // 7. Handler para selección/cambio de PREBATCH (usando input con datalist)
  const handlePrebatchNameChange = (tempId, selectedName) => {
    // SOLO actualizamos el nombre aquí. El ID lo buscaremos al guardar.
    // Necesitamos una llamada API async aquí si quisiéramos validar/buscar ID al instante.
    // Por simplicidad, lo haremos en handleSubmit.
    setReglas(
      reglas.map((r) =>
        r.tempId === tempId
          ? {
              ...r,
              display_name: selectedName, // Guardamos el nombre seleccionado/escrito
              prebatch_id: null, // Reseteamos ID por si cambia el nombre
              item_id: null, // Asegurar que item_id sea null
              ingredient_type: "PREBATCH", // Confirmar tipo
            }
          : r
      )
    );
  };

  // 8. handleSubmit modificado para enviar la nueva estructura y buscar prebatch_id
  const handleSubmit = async (e) => {
    // Marcar como async
    e.preventDefault();
    if (!productName.trim()) {
      toast.error("El nombre del producto es obligatorio.");
      return;
    }
    // Permitir guardar sin reglas si se desea (para vaciar)
    // if (reglas.length === 0) {
    //   toast.error("Debe añadir al menos una regla.");
    //   return;
    // }

    setIsSubmitting(true);
    let payloadReglas = [];
    let validationError = null;

    // Usar un bucle for...of para poder usar await dentro
    for (const regla of reglas) {
      // Validaciones comunes
      const consumoNum = parseFloat(regla.consumo_ml);
      const prioridadNum = parseInt(regla.prioridad_item);
      if (
        isNaN(consumoNum) ||
        consumoNum <= 0 ||
        isNaN(prioridadNum) ||
        prioridadNum <= 0
      ) {
        validationError = `Valores inválidos (consumo/prioridad) para "${
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
          ingredient_type: "ITEM",
          item_id: parseInt(regla.item_id),
          prebatch_id: null,
          consumo_ml: consumoNum,
          prioridad_item: prioridadNum,
        });
      } else if (regla.ingredient_type === "PREBATCH") {
        if (!regla.display_name) {
          validationError = `Falta seleccionar o escribir un nombre de Prebatch para una regla.`;
          break;
        }
        // --- Búsqueda ASÍNCRONA del prebatch_id ---
        // Necesitamos un endpoint que busque un prebatch por nombre EXACTO
        // Si no existe, crearemos uno ahora.
        try {
          // Asumimos un nuevo endpoint GET /api/prebatches/find?name=NOMBRE_EXACTO
          const findRes = await api.get(`/prebatches/find`, {
            params: { name: regla.display_name },
          });
          if (findRes.data && findRes.data.id) {
            prebatchIdToSave = findRes.data.id;
          } else {
            // Si no se encuentra, lanzar error (o podríamos crearlo si quisiéramos)
            validationError = `El prebatch "${regla.display_name}" no fue encontrado en la base de datos. Verifica el nombre.`;
            break;
          }
        } catch (findError) {
          console.error("Error buscando prebatch id:", findError);
          validationError = `Error al verificar el prebatch "${regla.display_name}".`;
          break;
        }
        // --- Fin Búsqueda ---
        payloadReglas.push({
          ingredient_type: "PREBATCH",
          item_id: null,
          prebatch_id: parseInt(prebatchIdToSave),
          consumo_ml: consumoNum,
          prioridad_item: prioridadNum, // La prioridad puede tener menos sentido para prebatches, pero la mantenemos
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

    // Construir payload final
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
        onFormSubmit();
        return `¡Receta ${isEditing ? "actualizada" : "creada"} con éxito!`;
      },
      error: (err) => {
        setIsSubmitting(false);
        console.error("Error saving recipe:", err.response || err); // Log más detallado
        return err.response?.data?.message || "Ocurrió un error al guardar.";
      },
    });
  };

  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50";

  // --- JSX Modificado ---
  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <ClipboardPlus className="text-sky-400" />
        {recipeToEdit ? "Editar Receta" : "Crear Producto y Receta"}
      </h3>

      {/* Mostrar Spinner mientras cargan dependencias */}
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
              <RefreshCw className="h-5 w-5 text-slate-400" /> Ingredientes
            </h4>
            {reglas.map((regla, index) => (
              <div
                key={regla.tempId}
                // Ajustar grid para Select Tipo + Selector Ingrediente + 2 Inputs + Botón
                className="grid grid-cols-12 gap-x-3 gap-y-2 bg-slate-900/50 p-3 rounded-lg items-end"
              >
                {/* Selector Tipo Ingrediente */}
                <div className="col-span-12 md:col-span-2">
                  <label
                    htmlFor={`type-${regla.tempId}`}
                    className={`block mb-1 text-sm font-medium text-slate-300 ${
                      index !== 0 ? "md:sr-only" : ""
                    }`} // sr-only para ocultar visualmente pero mantener accesible
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
                      initialItemName={regla.display_name || ""} // Usar display_name
                      key={`item-${regla.tempId}`} // Key para forzar re-render si cambia tipo
                    />
                  ) : (
                    // PREBATCH
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
                        list={`prebatch-names-list-${regla.tempId}`} // Datalist único por input
                        value={regla.display_name || ""}
                        onChange={(e) =>
                          handlePrebatchNameChange(regla.tempId, e.target.value)
                        }
                        placeholder="Buscar prebatch..."
                        className={commonInputClass}
                        autoComplete="off"
                        disabled={isSubmitting}
                        required
                        key={`prebatch-${regla.tempId}`} // Key para forzar re-render
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
                        // Usar handler genérico
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

                {/* Prioridad */}
                <div className="col-span-6 md:col-span-2">
                  <label
                    htmlFor={`prio-${regla.tempId}`}
                    className={`block mb-1 text-sm font-medium text-slate-300 ${
                      index !== 0 ? "md:sr-only" : ""
                    }`}
                  >
                    Prioridad (*)
                  </label>
                  <input
                    type="number"
                    id={`prio-${regla.tempId}`}
                    value={regla.prioridad_item}
                    onChange={(e) =>
                      handleReglaChange(
                        // Usar handler genérico
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

          {/* Botones Añadir, Cancelar, Guardar */}
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
                disabled={isSubmitting || loadingDependencies} // Deshabilitar si carga o envía
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
