// src/components/organisms/ProductionForm.jsx
import { useState, useEffect } from "react";
import { Hammer, Send, ListTree, RefreshCw } from "lucide-react"; // Añadidos iconos
import toast from "react-hot-toast";
import api from "../../api/api"; //
import Spinner from "../atoms/Spinner"; //
import Alert from "../atoms/Alert"; //
// Necesitamos el store para refrescar el stock si fuera necesario
import useStockStore from "../../stores/useStockStore"; //

export default function ProductionForm() {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState([]); // Lista de productos producibles
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [recipePreview, setRecipePreview] = useState(null); // Para vista previa
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState(null); // Para errores generales o de carga

  const { fetchStock } = useStockStore(); // Acción para refrescar inventario general

  // Cargar productos producibles al montar
  useEffect(() => {
    setLoadingProducts(true);
    setError(null); // Limpiar error anterior
    api
      .get("/admin/products", { params: { limit: 1000 } }) // Traer todos los productos activos (podríamos filtrar por nombre si es necesario)
      .then((res) => {
        // Filtrar productos cuyo nombre empiece con "PRODUCCION:" (o según tu convención)
        const producibleProducts = res.data.products.filter((p) =>
          p.nombre_producto_fudo.toUpperCase().startsWith("PRODUCCION:")
        );
        if (producibleProducts.length === 0) {
          setError(
            "No se encontraron productos marcados para producción (deben empezar con 'PRODUCCION:')."
          );
        }
        setProducts(producibleProducts);
      })
      .catch((err) => {
        console.error("Error fetching products for production:", err);
        setError("No se pudieron cargar los productos para producción.");
        setProducts([]); // Asegurar que sea un array vacío
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  // Obtener vista previa de receta cuando cambia el producto seleccionado
  useEffect(() => {
    if (!selectedProductId) {
      setRecipePreview(null);
      return;
    }
    setLoadingPreview(true);
    setRecipePreview(null); // Limpiar vista previa anterior
    api
      .get(`/admin/recipes/${selectedProductId}`) // Endpoint para obtener receta
      .then(async (res) => {
        const rules = res.data.reglas;
        // Enriquecer reglas con nombre completo del item
        const itemIds = rules.map((r) => r.item_id);
        if (itemIds.length > 0) {
          // Podríamos necesitar un endpoint para buscar varios items por ID,
          // o hacer múltiples llamadas (menos eficiente).
          // Por ahora, buscaremos en la lista general de stock si está cargada,
          // o mostraremos solo el ID (simplificación). Usaremos la API de búsqueda.
          const enrichedRulesPromises = rules.map(async (rule) => {
            try {
              // Usamos la búsqueda general para obtener el nombre
              const itemRes = await api.get(`/stock/search-items`, {
                params: { query: `id:${rule.item_id}` },
              }); // Asumiendo que search puede buscar por ID exacto (ajustar backend si no)
              // O mejor, llamar a getStockItemById
              const itemDetailRes = await api.get(
                `/admin/stock-items/${rule.item_id}`
              ); //
              const nombreCompleto = itemDetailRes.data
                ? `${itemDetailRes.data.marca_nombre || "Marca?"} ${
                    itemDetailRes.data.variacion || ""
                  } ${itemDetailRes.data.equivalencia_ml}ml`
                    .replace("  ", " ")
                    .trim()
                : `Item ID: ${rule.item_id}`; // Construir nombre si falta
              return {
                ...rule,
                nombre_completo_item:
                  nombreCompleto || `Item ID ${rule.item_id}`,
              };
            } catch {
              return {
                ...rule,
                nombre_completo_item: `Item ID ${rule.item_id} (Error al buscar)`,
              };
            }
          });
          const enrichedRules = await Promise.all(enrichedRulesPromises);
          setRecipePreview(enrichedRules);
        } else {
          setRecipePreview([]); // Receta sin reglas
        }
      })
      .catch((err) => {
        console.error("Error fetching recipe preview:", err);
        toast.error("No se pudo cargar la receta para vista previa.");
        setRecipePreview(null);
      })
      .finally(() => setLoadingPreview(false));
  }, [selectedProductId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || !description.trim()) {
      toast.error(
        "Selecciona un producto, indica la cantidad y añade una descripción."
      );
      return;
    }
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error("La cantidad producida debe ser un número mayor a cero.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      productId: parseInt(selectedProductId),
      quantityProduced: quantityNum,
      description: description.trim(),
    };
    console.log("Enviando Payload:", payload); // Para depuración

    const promise = api.post("/stock/production", payload); // Llamada al nuevo endpoint

    toast.promise(promise, {
      loading: "Registrando producción...",
      success: (res) => {
        setIsSubmitting(false);
        // Limpiar formulario
        setSelectedProductId("");
        setQuantity("");
        setDescription("");
        setRecipePreview(null);
        // Refrescar lista de inventario general (donde se ven los ingredientes)
        fetchStock(); //
        return res.data?.message || "Producción registrada con éxito.";
      },
      error: (err) => {
        setIsSubmitting(false);
        console.error(
          "Error al registrar producción:",
          err.response?.data || err.message
        );
        return (
          err.response?.data?.message ||
          err.message ||
          "Error al registrar la producción."
        );
      },
    });
  };

  const commonInputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg w-full p-2.5 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50";

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
        <Hammer className="text-sky-400" />
        Registrar Producción Interna
      </h3>
      {/* Mostrar error general si existe */}
      {error && <Alert message={error} />} {/* */}
      {loadingProducts ? (
        <Spinner /> //
      ) : products.length === 0 && !error ? (
        // Mostrar alerta si no hay productos producibles pero no hubo error de carga
        <Alert message="No hay productos configurados para producción. Crea recetas con nombres que empiecen con 'PRODUCCION:' en la sección de Administración." /> //
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Selector de Producto */}
          <div>
            <label
              htmlFor="product-select"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Producto a Producir (*)
            </label>
            <select
              id="product-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={commonInputClass}
              required
              disabled={isSubmitting}
            >
              <option value="">Selecciona un producto...</option>
              {/* Cargar productos filtrados */}
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_producto_fudo}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Cantidad Producida */}
          <div>
            <label
              htmlFor="quantity"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Cantidad a Producir (*)
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={commonInputClass}
              required
              min="0.01"
              step="any"
              placeholder="Ej: 5 (según unidad de la receta)"
              disabled={!selectedProductId || isSubmitting}
            />
          </div>

          {/* 3. Descripción */}
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
              disabled={!selectedProductId || isSubmitting}
            />
          </div>

          {/* Vista Previa de Consumo */}
          {selectedProductId && (
            <div className="bg-slate-900 p-4 rounded text-sm text-slate-400 min-h-[100px]">
              {" "}
              {/* Altura mínima */}
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-slate-300 flex items-center">
                  <ListTree className="h-4 w-4 mr-2" /> Receta / Consumo
                  Estimado
                </p>
                {loadingPreview && (
                  <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
                )}
              </div>
              {!loadingPreview && recipePreview === null && quantity && (
                <p className="text-xs italic">Cargando receta...</p>
              )}
              {!loadingPreview && recipePreview === null && !quantity && (
                <p className="text-xs italic">
                  Ingresa una cantidad para ver el consumo.
                </p>
              )}
              {!loadingPreview && recipePreview?.length === 0 && (
                <p className="text-xs text-yellow-400">
                  Este producto no tiene ingredientes definidos en su receta.
                </p>
              )}
              {!loadingPreview &&
                recipePreview &&
                recipePreview.length > 0 &&
                !quantity && (
                  <p className="text-xs italic">
                    Ingresa una cantidad para ver el consumo.
                  </p>
                )}
              {!loadingPreview &&
                recipePreview &&
                recipePreview.length > 0 &&
                quantity && (
                  <ul className="list-disc list-inside space-y-1">
                    {recipePreview.map((rule) => {
                      const cantidadNum = parseFloat(quantity) || 0;
                      const consumoEstimado = rule.consumo_ml * cantidadNum;
                      return (
                        <li key={rule.item_id}>
                          <span className="text-slate-300">
                            {rule.nombre_completo_item}:
                          </span>{" "}
                          {consumoEstimado.toFixed(1)}ml
                        </li>
                      );
                    })}
                    <p className="mt-2 text-xs italic">
                      (El stock real se verificará al guardar)
                    </p>
                  </ul>
                )}
            </div>
          )}

          {/* Botón Submit */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedProductId ||
                !quantity ||
                !description ||
                loadingProducts
              }
              className="flex items-center justify-center text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              <Send className="mr-2 h-5 w-5" />
              {isSubmitting ? "Registrando..." : "Confirmar Producción"}
            </button>
          </div>
        </form>
      )}{" "}
      {/* Cierre del else para el formulario */}
    </div>
  );
}
