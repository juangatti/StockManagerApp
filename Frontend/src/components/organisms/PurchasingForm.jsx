// src/components/organisms/PurchasingForm.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../../api/api";
import {
  PlusCircle,
  ShoppingCart,
  Send,
  FileText,
  Trash2,
  Beer,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import useStockStore from "../../stores/useStockStore";
import AutocompleteInput from "../molecules/AutocompleteInput";

export default function PurchasingForm() {
  const { fetchStock } = useStockStore();

  // Header State
  const [invoiceHeader, setInvoiceHeader] = useState({
    supplier_id: "",
    invoice_number: "",
    invoice_date: new Date().toISOString().split("T")[0],
    total_amount: "",
    main_category: "cerveza", // Default
    notes: "",
  });

  // Master Lists for Selection
  const [suppliers, setSuppliers] = useState([]);
  const [beerStyles, setBeerStyles] = useState([]);
  const [basket, setBasket] = useState([]); // List of items/kegs to be sent
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Item Entry State
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [selectedStyleId, setSelectedStyleId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [kegCode, setKegCode] = useState(""); // For individual keg code entry if needed

  const autocompleteRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, stylesRes] = await Promise.all([
          api.get("/keg-management/suppliers"),
          api.get("/keg-management/styles"),
        ]);
        setSuppliers(suppliersRes.data);
        setBeerStyles(stylesRes.data);
      } catch (error) {
        console.error("Error fetching form dependencies:", error);
        toast.error("Error al cargar proveedores o estilos.");
      }
    };
    fetchData();
  }, []);

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setInvoiceHeader((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = (e) => {
    if (e) e.preventDefault();

    if (invoiceHeader.main_category === "cerveza") {
      if (!selectedStyleId || !itemPrice) {
        toast.error("Selecciona un estilo y especifica el precio.");
        return;
      }

      const style = beerStyles.find((s) => s.id === parseInt(selectedStyleId));
      const newKeg = {
        type: "keg",
        style_id: style.id,
        style_name: style.name,
        code: kegCode || `BEER-${Date.now().toString().slice(-4)}`,
        cost_price: parseFloat(itemPrice),
        volume: 50.0, // Default
      };
      setBasket([...basket, newKeg]);
      setKegCode("");
    } else {
      if (!selectedStockItem || !itemQuantity || !itemPrice) {
        toast.error("Datos de ítem incompletos.");
        return;
      }
      const newItem = {
        type: "stock",
        itemId: selectedStockItem.id,
        nombre: selectedStockItem.nombre_completo,
        quantity: parseFloat(itemQuantity),
        unitCost: parseFloat(itemPrice),
      };
      setBasket([...basket, newItem]);
      setItemQuantity("");
      setItemPrice("");
      setSelectedStockItem(null);
      if (autocompleteRef.current) autocompleteRef.current.clear();
    }
  };

  const removeFromBasket = (index) => {
    setBasket(basket.filter((_, i) => i !== index));
  };

  const calculateBasketTotal = () => {
    return basket.reduce((sum, item) => {
      if (item.type === "keg") return sum + item.cost_price;
      return sum + item.quantity * item.unitCost;
    }, 0);
  };

  const handleSubmitInvoice = async () => {
    const basketTotal = calculateBasketTotal();
    const invoiceTotal = parseFloat(invoiceHeader.total_amount);

    if (Math.abs(basketTotal - invoiceTotal) > 0.01) {
      toast.error(
        `El total de los ítems ($${basketTotal.toFixed(2)}) no coincide con el total de la factura ($${invoiceTotal.toFixed(2)}).`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...invoiceHeader,
        items: basket.filter((i) => i.type === "stock"),
        kegs: basket.filter((i) => i.type === "keg"),
      };

      await api.post("/stock/purchases", payload);
      toast.success("Factura registrada con éxito.");
      setBasket([]);
      setInvoiceHeader({
        supplier_id: "",
        invoice_number: "",
        invoice_date: new Date().toISOString().split("T")[0],
        total_amount: "",
        main_category: "cerveza",
        notes: "",
      });
      fetchStock();
    } catch (error) {
      console.error("Error submitting invoice:", error);
      toast.error(
        error.response?.data?.message || "Error al registrar la factura.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header de Factura */}
      <div className="bg-surface p-6 rounded-xl shadow-(--shadow-card) border border-gray-100">
        <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2 uppercase tracking-tight">
          <FileText className="text-primary h-5 w-5" />
          Cabecera de Factura / Compra
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase">
              Proveedor
            </label>
            <select
              name="supplier_id"
              value={invoiceHeader.supplier_id}
              onChange={handleHeaderChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="">Seleccionar...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase">
              Nro Fac/Remito
            </label>
            <input
              type="text"
              name="invoice_number"
              value={invoiceHeader.invoice_number}
              onChange={handleHeaderChange}
              placeholder="0001-0000123"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase">
              Fecha
            </label>
            <input
              type="date"
              name="invoice_date"
              value={invoiceHeader.invoice_date}
              onChange={handleHeaderChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase">
              Categoría Principal
            </label>
            <select
              name="main_category"
              value={invoiceHeader.main_category}
              onChange={(e) => {
                handleHeaderChange(e);
                setBasket([]); // Limpiar canasto si cambia categoría para evitar mezclas complejas
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="cerveza">Cerveza (Barriles)</option>
              <option value="comida">Comida / Cocina</option>
              <option value="bebidas">Bebidas / Barra</option>
              <option value="mantenimiento">Mantenimiento / Limpieza</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase text-primary">
              Monto Total Factura
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                name="total_amount"
                value={invoiceHeader.total_amount}
                onChange={handleHeaderChange}
                placeholder="0.00"
                className="w-full bg-gray-50 border border-primary/20 rounded-lg p-2.5 pl-7 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Carga de Items */}
      <div className="bg-surface p-6 rounded-xl shadow-(--shadow-card) border border-gray-100">
        <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2 uppercase tracking-tight">
          {invoiceHeader.main_category === "cerveza" ? (
            <Beer className="text-accent h-5 w-5" />
          ) : (
            <Package className="text-accent h-5 w-5" />
          )}
          Carga de Ítems ({invoiceHeader.main_category})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          {invoiceHeader.main_category === "cerveza" ? (
            <>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">
                  Estilo de Cerveza
                </label>
                <select
                  value={selectedStyleId}
                  onChange={(e) => setSelectedStyleId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Seleccionar estilo...</option>
                  {beerStyles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.fantasy_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">
                  Código Barril (Opcional)
                </label>
                <input
                  type="text"
                  value={kegCode}
                  onChange={(e) => setKegCode(e.target.value)}
                  placeholder="Ej: B-123"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          ) : (
            <>
              <div className="md:col-span-2">
                <AutocompleteInput
                  ref={autocompleteRef}
                  label="Insumo / Ítem de Stock"
                  onItemSelected={setSelectedStockItem}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase">
              {invoiceHeader.main_category === "cerveza"
                ? "Precio Barril"
                : "Precio Unitario"}
            </label>
            <input
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="$ 0.00"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            onClick={handleAddToCart}
            className="md:col-start-4 bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle h-5 w-5 />
            Agregar a la Factura
          </button>
        </div>
      </div>

      {/* 3. Canasto / Resumen */}
      <div className="bg-surface rounded-xl shadow-(--shadow-card) border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Detalle de Carga
          </h3>
          <span
            className={`text-sm font-bold ${Math.abs(calculateBasketTotal() - parseFloat(invoiceHeader.total_amount || 0)) < 0.01 ? "text-green-600" : "text-primary"}`}
          >
            Auditado: ${calculateBasketTotal().toLocaleString()} / $
            {parseFloat(invoiceHeader.total_amount || 0).toLocaleString()}
          </span>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-text-muted uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-bold">Ítem / Estilo</th>
                <th className="px-6 py-3 font-bold">Detalle / Cod</th>
                <th className="px-6 py-3 font-bold text-right">Cantidad</th>
                <th className="px-6 py-3 font-bold text-right">Subtotal</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {basket.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-gray-400 italic"
                  >
                    No hay ítems cargados en esta factura.
                  </td>
                </tr>
              ) : (
                basket.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-primary">
                      {item.type === "keg" ? item.style_name : item.nombre}
                    </td>
                    <td className="px-6 py-4 text-text-muted text-xs">
                      {item.type === "keg"
                        ? `BARRIL COPIADO (${item.code})`
                        : `Insumo General`}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.type === "keg"
                        ? "1 Ud."
                        : `${item.quantity.toFixed(2)} Uds.`}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold">
                      ${" "}
                      {(item.type === "keg"
                        ? item.cost_price
                        : item.quantity * item.unitCost
                      ).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => removeFromBasket(idx)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {basket.length > 0 && (
          <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end items-center gap-8">
            <div className="text-right">
              <p className="text-xs text-text-muted uppercase font-bold">
                Total Cargado
              </p>
              <p className="text-2xl font-black text-text-primary">
                ${calculateBasketTotal().toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleSubmitInvoice}
              disabled={isSubmitting}
              className="bg-green-600 text-white font-black px-10 py-4 rounded-xl hover:bg-green-700 transition-all shadow-lg flex items-center gap-3 uppercase tracking-tighter disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              {isSubmitting ? "Procesando..." : "Confirmar Factura y Stock"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
