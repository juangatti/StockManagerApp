// src/components/organisms/RecipeForm.jsx
import { useState, useEffect, useRef } from "react"; // 1. Añadir useRef
import api from "../../api/api";
import toast from "react-hot-toast";
import { ClipboardPlus, PlusCircle, XCircle } from "lucide-react";
import useStockStore from "../../stores/useStockStore";
// 2. Importar AutocompleteInput
import AutocompleteInput from "../molecules/AutocompleteInput";

export default function RecipeForm({ recipeToEdit, onFormSubmit, onCancel }) {
  const [productName, setProductName] = useState("");
  const [reglas, setReglas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 3. Eliminar estado 'marcas'
  // const [marcas, setMarcas] = useState([]);
  const { stockItems, fetchStock } = useStockStore(); // Mantenemos stockItems
  const ingredientRefs = useRef({}); // 4. Ref para los AutocompleteInputs

  // 5. Modificar useEffect: eliminar carga de marcas
  useEffect(() => {
    const loadData = async () => {
      try {
        // Solo necesitamos cargar el stock (si no está ya cargado)
        if (stockItems.length === 0) {
          await fetchStock(); // Asegurarse que los items estén disponibles
        }
      } catch (error) {
        toast.error(
          "No se pudieron cargar los datos iniciales para el formulario."
        );
      }
    };
    loadData();
  }, [fetchStock, stockItems.length]); // Depender de fetchStock y stockItems.length

  useEffect(() => {
    if (recipeToEdit) {
      setProductName(recipeToEdit.product.nombre_producto_fudo);
      setReglas(
        recipeToEdit.reglas.map((r) => {
          // Buscar el nombre completo del item para el estado inicial si es necesario
          const itemData = stockItems.find((item) => item.id === r.item_id);
          return {
            ...r,
            tempId: Date.now() + Math.random(),
            // Guardar nombre completo para mostrar en Autocomplete si editamos
            itemName: itemData ? itemData.nombre_completo : "",
          };
        })
      );
    } else {
      setProductName("");
      setReglas([]);
    }
  }, [recipeToEdit, stockItems]); // Añadir stockItems como dependencia

  const handleAddRegla = () =>
    setReglas([
      ...reglas,
      {
        tempId: Date.now() + Math.random(), // Usar un ID único temporal
        marca_id: "", // Se llenará al seleccionar item
        item_id: "",
        consumo_ml: "",
        prioridad_item: "1",
        itemName: "", // Para el valor inicial del Autocomplete
      },
    ]);

  const handleRemoveRegla = (tempId) => {
    setReglas(reglas.filter((r) => r.tempId !== tempId));
    if (ingredientRefs.current[tempId]) {
      // Limpiar ref si existe
      delete ingredientRefs.current[tempId];
    }
  };

  // 6. Nuevo handler para la selección del AutocompleteInput
  const handleItemSelection = (tempId, selectedItem) => {
    setReglas(
      reglas.map((r) => {
        if (r.tempId === tempId) {
          if (selectedItem) {
            // Buscar la marca_id del item seleccionado en stockItems
            const fullItemData = stockItems.find(
              (item) => item.id === selectedItem.id
            );
            return {
              ...r,
              item_id: selectedItem.id,
              // Asegúrate que fullItemData exista antes de acceder a marca_id
              marca_id: fullItemData ? fullItemData.marca_id : "",
              itemName: selectedItem.nombre_completo,
            };
          } else {
            // Si se deselecciona (clear)
            return {
              ...r,
              item_id: "",
              marca_id: "",
              itemName: "",
            };
          }
        }
        return r;
      })
    );
  };

  // 7. Modificar handleReglaChange para solo cantidad y prioridad
  const handleReglaQtyPrioChange = (tempId, field, value) => {
    setReglas(
      reglas.map((r) => (r.tempId === tempId ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productName.trim() || reglas.length === 0) {
      toast.error(
        "El nombre del producto y al menos una regla son obligatorios."
      );
      return;
    }
    // Validar que todas las reglas estén completas
    for (const regla of reglas) {
      if (
        !regla.item_id ||
        !regla.marca_id ||
        !regla.consumo_ml ||
        !regla.prioridad_item
      ) {
        toast.error(
          `La regla para "${regla.itemName || "un item"}" está incompleta.`
        );
        return;
      }
      const consumoNum = parseFloat(regla.consumo_ml);
      const prioridadNum = parseInt(regla.prioridad_item);
      if (
        isNaN(consumoNum) ||
        consumoNum <= 0 ||
        isNaN(prioridadNum) ||
        prioridadNum <= 0
      ) {
        toast.error(`Valores inválidos en la regla para "${regla.itemName}".`);
        return;
      }
    }

    setIsSubmitting(true);
    const payload = {
      nombre_producto_fudo: productName.trim(),
      // 8. Asegurar que enviamos solo los datos necesarios y parseados
      reglas: reglas.map(({ tempId, itemName, ...rest }) => ({
        ...rest,
        marca_id: parseInt(rest.marca_id),
        item_id: parseInt(rest.item_id),
        consumo_ml: parseFloat(rest.consumo_ml),
        prioridad_item: parseInt(rest.prioridad_item),
      })),
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
        return err.response?.data?.message || "Ocurrió un error.";
      },
    });
  };

  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5";

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <ClipboardPlus className="text-sky-400" />
        {recipeToEdit ? "Editar Receta" : "Crear Producto y Receta"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Nombre Producto (sin cambios) */}
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Nombre del Producto (Ej: Cuba Libre)"
          className={commonInputClass} // Usar clase común
          required
        />
        <div className="space-y-4">
          {reglas.map((regla, index) => {
            // Añadir index para labels condicionales
            return (
              <div
                key={regla.tempId}
                // 9. Ajustar grid para Autocomplete + 2 Inputs + Botón
                className="grid grid-cols-12 gap-3 bg-slate-900/50 p-4 rounded-lg items-end" // items-end para alinear labels arriba
              >
                {/* 10. Reemplazar selects con AutocompleteInput */}
                <div className="col-span-12 md:col-span-6">
                  <AutocompleteInput
                    ref={(el) => (ingredientRefs.current[regla.tempId] = el)} // Asignar ref
                    // Mostrar label solo en la primera fila en desktop
                    label={index === 0 ? "Ingrediente (*)" : undefined}
                    placeholder="Buscar item de stock..."
                    onItemSelected={(item) =>
                      handleItemSelection(regla.tempId, item)
                    }
                    // Pasar valor inicial si estamos editando
                    initialItemId={regla.item_id || null}
                    initialItemName={regla.itemName || ""}
                  />
                </div>

                {/* Consumo ML */}
                <div className="col-span-6 md:col-span-2">
                  <label
                    htmlFor={`consumo-${regla.tempId}`}
                    // Mostrar label solo en la primera fila en desktop
                    className={`block mb-1 text-sm font-medium text-slate-300 ${
                      index !== 0 ? "md:hidden" : ""
                    }`}
                  >
                    Consumo (ml) (*)
                  </label>
                  <input
                    type="number"
                    id={`consumo-${regla.tempId}`}
                    value={regla.consumo_ml}
                    onChange={(e) =>
                      handleReglaQtyPrioChange(
                        // Usar nuevo handler
                        regla.tempId,
                        "consumo_ml",
                        e.target.value
                      )
                    }
                    placeholder="ml"
                    className={`${commonInputClass} text-center`} // Centrar texto
                    min="0.01"
                    step="any"
                    required
                  />
                </div>

                {/* Prioridad */}
                <div className="col-span-6 md:col-span-2">
                  <label
                    htmlFor={`prio-${regla.tempId}`}
                    // Mostrar label solo en la primera fila en desktop
                    className={`block mb-1 text-sm font-medium text-slate-300 ${
                      index !== 0 ? "md:hidden" : ""
                    }`}
                  >
                    Prioridad (*)
                  </label>
                  <input
                    type="number"
                    id={`prio-${regla.tempId}`}
                    value={regla.prioridad_item}
                    onChange={(e) =>
                      handleReglaQtyPrioChange(
                        // Usar nuevo handler
                        regla.tempId,
                        "prioridad_item",
                        e.target.value
                      )
                    }
                    placeholder="1, 2..."
                    className={`${commonInputClass} text-center`} // Centrar texto
                    min="1"
                    step="1"
                    required
                  />
                </div>

                {/* Botón Eliminar */}
                <div className="col-span-12 md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveRegla(regla.tempId)}
                    // 11. Ajustar padding/margen para alinear con inputs
                    className="p-2 text-red-500 hover:text-red-400 mb-1" // Añadir mb-1 o ajustar según sea necesario
                    title="Eliminar Ingrediente"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {/* Botones Añadir, Cancelar, Guardar (sin cambios) */}
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={handleAddRegla}
            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 font-medium text-sm"
          >
            <PlusCircle className="h-5 w-5" /> Añadir Ingrediente
          </button>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="text-white bg-slate-600 hover:bg-slate-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500"
            >
              {isSubmitting ? "Guardando..." : "Guardar Receta"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
