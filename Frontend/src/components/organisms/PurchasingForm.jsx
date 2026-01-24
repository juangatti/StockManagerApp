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
  RotateCcw,
  ChevronDown,
  ChevronUp,
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
    main_category: "cerveza",
    notes: "",
  });

  // UI state for progressive disclosure
  const [showItemEntry, setShowItemEntry] = useState(false);
  const [showReturns, setShowReturns] = useState(false);

  // Master Lists
  const [suppliers, setSuppliers] = useState([]);
  const [beerStyles, setBeerStyles] = useState([]);
  const [emptyKegs, setEmptyKegs] = useState([]); // Available for return
  const [basket, setBasket] = useState([]);
  const [returnedKegIds, setReturnedKegIds] = useState([]); // Selected for return
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Item Entry State
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [selectedStyleId, setSelectedStyleId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [kegCode, setKegCode] = useState("");

  const autocompleteRef = useRef();

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (invoiceHeader.supplier_id) {
      fetchEmptyKegs(invoiceHeader.supplier_id);
    } else {
      setEmptyKegs([]);
      setReturnedKegIds([]);
    }
  }, [invoiceHeader.supplier_id]);

  const fetchDependencies = async () => {
    try {
      const [suppliersRes, stylesRes] = await Promise.all([
        api.get("/keg-management/suppliers"),
        api.get("/keg-management/styles"),
      ]);
      setSuppliers(suppliersRes.data);
      setBeerStyles(stylesRes.data);
    } catch (error) {
      console.error("Error fetching dependencies:", error);
      toast.error("Error al cargar proveedores o estilos.");
    }
  };

  const fetchEmptyKegs = async (supplierId) => {
    try {
      const res = await api.get("/keg-management/kegs?status=EMPTY");
      const supplierName = suppliers.find(
        (s) => s.id === parseInt(supplierId),
      )?.name;
      setEmptyKegs(res.data.filter((k) => k.supplier_name === supplierName));
    } catch (error) {
      console.error("Error fetching empty kegs:", error);
    }
  };

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
      setBasket([
        ...basket,
        {
          type: "keg",
          style_id: style.id,
          style_name: style.name,
          code: kegCode || `BEER-${Date.now().toString().slice(-4)}`,
          cost_price: parseFloat(itemPrice),
          volume: 50.0,
        },
      ]);
      setKegCode("");
    } else {
      if (!selectedStockItem || !itemQuantity || !itemPrice) {
        toast.error("Datos de ítem incompletos.");
        return;
      }
      setBasket([
        ...basket,
        {
          type: "stock",
          itemId: selectedStockItem.id,
          nombre: selectedStockItem.nombre_completo,
          quantity: parseFloat(itemQuantity),
          unitCost: parseFloat(itemPrice),
        },
      ]);
      setItemQuantity("");
      setItemPrice("");
      setSelectedStockItem(null);
      if (autocompleteRef.current) autocompleteRef.current.clear();
    }
  };

  const toggleKegReturn = (id) => {
    setReturnedKegIds((prev) =>
      prev.includes(id) ? prev.filter((kId) => kId !== id) : [...prev, id],
    );
  };

  const calculateBasketTotal = () => {
    return basket.reduce((sum, item) => {
      if (item.type === "keg") return sum + item.cost_price;
      return sum + item.quantity * item.unitCost;
    }, 0);
  };

  const handleSubmitInvoice = async () => {
    const basketTotal = calculateBasketTotal();
    const invoiceTotal = parseFloat(invoiceHeader.total_amount || 0);

    if (basket.length > 0 && Math.abs(basketTotal - invoiceTotal) > 0.1) {
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
        returned_keg_ids: returnedKegIds,
      };

      await api.post("/stock/purchases", payload);
      toast.success("Operación registrada correctamente.");
      setBasket([]);
      setReturnedKegIds([]);
      setInvoiceHeader({
        supplier_id: "",
        invoice_number: "",
        invoice_date: new Date().toISOString().split("T")[0],
        total_amount: "",
        main_category: "cerveza",
        notes: "",
      });
      setShowItemEntry(false);
      setShowReturns(false);
      fetchStock();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error al registrar la factura.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header Section */}
      <div className="bg-surface p-6 rounded-2xl shadow-(--shadow-card) border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-text-primary font-display uppercase tracking-tight flex items-center gap-2">
            <FileText className="text-primary h-6 w-6" />
            Cabecera de Factura
          </h2>
          <div
            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter shadow-sm border ${isSubmitting ? "bg-gray-100 text-gray-400" : "bg-primary text-white"}`}
          >
            {isSubmitting ? "Procesando..." : "Modo Registro"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              Proveedor
            </label>
            <select
              name="supplier_id"
              value={invoiceHeader.supplier_id}
              onChange={handleHeaderChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
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
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              Factura/Remito
            </label>
            <input
              type="text"
              name="invoice_number"
              value={invoiceHeader.invoice_number}
              onChange={handleHeaderChange}
              placeholder="Nro de comprobante"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              Fecha Compra
            </label>
            <input
              type="date"
              name="invoice_date"
              value={invoiceHeader.invoice_date}
              onChange={handleHeaderChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              Rubro Principal
            </label>
            <select
              name="main_category"
              value={invoiceHeader.main_category}
              onChange={handleHeaderChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            >
              <option value="cerveza">Cerveza (Barriles)</option>
              <option value="comida">Comida (Cocina)</option>
              <option value="bebidas">Bebidas (Barra)</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest">
              Importe Total
            </label>
            <input
              type="number"
              name="total_amount"
              value={invoiceHeader.total_amount}
              onChange={handleHeaderChange}
              placeholder="0.00"
              className="w-full bg-primary/5 border-2 border-primary/20 rounded-xl p-3 text-sm font-black text-primary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8 border-t border-gray-100 pt-6">
          <button
            onClick={() => setShowItemEntry(!showItemEntry)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black uppercase text-xs tracking-tighter transition-all ${showItemEntry ? "bg-primary text-white shadow-lg" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            {invoiceHeader.main_category === "cerveza" ? (
              <Beer className="h-5 w-5" />
            ) : (
              <Package className="h-5 w-5" />
            )}
            {showItemEntry ? "Ocultar Carga" : "Agregar Ítems de Ingreso"}
            {showItemEntry ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </button>
          <button
            onClick={() => setShowReturns(!showReturns)}
            disabled={!invoiceHeader.supplier_id}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black uppercase text-xs tracking-tighter transition-all ${showReturns ? "bg-accent text-white shadow-lg" : "bg-gray-100 text-gray-500 hover:bg-gray-200"} disabled:opacity-30`}
          >
            <RotateCcw className="h-5 w-5" />
            {showReturns
              ? "Ocultar Devoluciones"
              : "Registrar Devolución de Vacíos"}
            {showReturns ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Dynamic Entry Sections */}
      {showItemEntry && (
        <div className="bg-surface p-8 rounded-2xl shadow-(--shadow-card) border border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-black text-text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Ingreso de Mercadería al Canasto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            {invoiceHeader.main_category === "cerveza" ? (
              <>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    Estilo
                  </label>
                  <select
                    value={selectedStyleId}
                    onChange={(e) => setSelectedStyleId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                  >
                    <option value="">Seleccionar...</option>
                    {beerStyles.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fantasy_name || s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    Cod Barril
                  </label>
                  <input
                    type="text"
                    value={kegCode}
                    onChange={(e) => setKegCode(e.target.value)}
                    placeholder="Ej: B-101"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-2">
                  <AutocompleteInput
                    ref={autocompleteRef}
                    label="Insumo / Ítem"
                    onItemSelected={setSelectedStockItem}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    Cant.
                  </label>
                  <input
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                Costo Unit.
              </label>
              <input
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <button
              onClick={handleAddToCart}
              className="bg-primary text-white font-black py-3.5 rounded-xl uppercase text-xs tracking-tighter shadow-md hover:scale-[1.02] transition-all"
            >
              Sumar al Canasto
            </button>
          </div>
        </div>
      )}

      {showReturns && (
        <div className="bg-surface p-8 rounded-2xl shadow-(--shadow-card) border border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-black text-text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-accent" />
            Barriles Vacíos en Mauer (Listos para Retorno)
          </h3>
          {emptyKegs.length === 0 ? (
            <p className="text-text-muted italic text-center text-sm py-4">
              No hay barriles vacíos de este proveedor en depósito.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {emptyKegs.map((keg) => (
                <button
                  key={keg.id}
                  onClick={() => toggleKegReturn(keg.id)}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${returnedKegIds.includes(keg.id) ? "bg-accent/10 border-accent text-accent shadow-inner" : "bg-gray-50 border-transparent text-gray-400 hover:border-gray-200"}`}
                >
                  <Beer className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    {keg.code}
                  </span>
                  <span className="text-[8px] opacity-70 truncate w-full text-center">
                    {keg.style_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Basket Summary */}
      {(basket.length > 0 || returnedKegIds.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <div className="lg:col-span-2 bg-surface rounded-2xl shadow-(--shadow-card) border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                Resumen de Carga
              </h3>
              {returnedKegIds.length > 0 && (
                <span className="bg-accent text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                  {returnedKegIds.length} Devoluciones
                </span>
              )}
            </div>
            <ul className="divide-y divide-gray-50">
              {basket.map((item, idx) => (
                <li
                  key={idx}
                  className="p-5 flex justify-between items-center transition-colors group hover:bg-gray-50/50"
                >
                  <div>
                    <p className="font-bold text-sm text-text-primary uppercase tracking-tight">
                      {item.type === "keg" ? item.style_name : item.nombre}
                    </p>
                    <p className="text-[10px] text-text-muted font-mono">
                      {item.type === "keg"
                        ? `BARRIL ${item.code}`
                        : `${item.quantity} UDS x $${item.unitCost}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-mono font-black text-primary text-base">
                      ${" "}
                      {(item.type === "keg"
                        ? item.cost_price
                        : item.quantity * item.unitCost
                      ).toLocaleString()}
                    </span>
                    <button
                      onClick={() =>
                        setBasket(basket.filter((_, i) => i !== idx))
                      }
                      className="text-gray-300 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-primary p-8 rounded-2xl shadow-xl flex flex-col justify-between text-white relative overflow-hidden">
            <ShoppingCart className="absolute -right-8 -bottom-8 h-48 w-48 opacity-10 pointer-events-none" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">
                Total Auditado
              </p>
              <h4 className="text-4xl font-black tracking-tighter">
                $ {calculateBasketTotal().toLocaleString()}
              </h4>
              <div className="h-1 w-full bg-white/20 my-6 rounded-full" />
              <p className="text-xs font-bold opacity-80 leading-relaxed italic">
                {basket.length} ítems de ingreso y {returnedKegIds.length}{" "}
                barriles vacíos listos para retiro.
              </p>
            </div>
            <button
              onClick={handleSubmitInvoice}
              disabled={isSubmitting}
              className="w-full bg-white text-primary font-black py-4 rounded-xl shadow-lg mt-8 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              {isSubmitting ? "Registrando..." : "Confirmar Operación"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
