import { Router } from "express";
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import {
  getStyles,
  getStyleById,
  createStyle,
  updateStyle,
  deleteStyle,
} from "../controllers/styleController.js";
import {
  createPurchase,
  createGlasswareAdjustment,
} from "../controllers/movementController.js";
import {
  getAllGlassware,
  getLowStockGlassware,
  createGlassware,
} from "../controllers/glasswareController.js";
import {
  getPurchases,
  getPurchaseById,
} from "../controllers/purchaseController.js";
import {
  getKegs,
  getKegById,
  tapKeg,
  emptyKeg,
  returnKegs,
} from "../controllers/kegController.js";

const router = Router();

// --- SUPPLIERS ---
router.get("/suppliers", getSuppliers);
router.get("/suppliers/:id", getSupplierById);
router.post("/suppliers", createSupplier);
router.put("/suppliers/:id", updateSupplier);
router.delete("/suppliers/:id", deleteSupplier);

// --- STYLES ---
router.get("/styles", getStyles); // Ahora incluye recommended_glass
router.get("/styles/:id", getStyleById);
router.post("/styles", createStyle);
router.put("/styles/:id", updateStyle);
router.delete("/styles/:id", deleteStyle);

// --- GLASSWARE (VASOS) ---
router.get("/glassware", getAllGlassware);
router.get("/glassware/low-stock", getLowStockGlassware);
router.post("/glassware", createGlassware);

// --- MOVEMENTS / PURCHASES (COMPRAS Y AJUSTES) ---
router.get("/purchases", getPurchases); // Mantenemos el GET histórico si se desea
router.get("/purchases/:id", getPurchaseById);
router.post("/purchases", createPurchase); // Lógica compleja (transaction)
router.post("/movements/adjustment", createGlasswareAdjustment); // Roturas/Ajustes

// --- KEGS (CICLO DE VIDA) ---
router.get("/kegs", getKegs);
router.get("/kegs/:id", getKegById);
router.put("/kegs/:id/tap", tapKeg);
router.put("/kegs/:id/empty", emptyKeg);
router.put("/kegs/return", returnKegs); // Batch return

export default router;
