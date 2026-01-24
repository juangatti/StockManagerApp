import { Router } from "express";
import {
  getStock,
  getStockTotals,
  registerAdjustment,
  registerMassiveAdjustment,
  getStockMovements,
  getMovementEventById,
  searchStockItems,
  getIceReport,
  getStockAlerts,
  registerProduction,
} from "../controllers/stockController.js";
import { registerPurchase } from "../controllers/purchaseController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/", getStock);
router.get("/totals", getStockTotals);
router.get("/search-items", searchStockItems);
router.get("/ice", getIceReport);
router.get("/alerts", getStockAlerts);

router.post("/purchases", authorize("purchases:create"), registerPurchase);
router.post("/adjust", authorize("stock:adjust"), registerAdjustment);
router.post(
  "/mass-adjustment",
  authorize("stock:adjust"),
  registerMassiveAdjustment,
);
router.get("/historic-movement", authorize("history:view"), getStockMovements);
router.get(
  "/historic-movement/:id",
  authorize("history:view"),
  getMovementEventById,
);
router.post("/production", authorize("production:create"), registerProduction);

export default router;
